import { getDefaultPlayer, setDefaultPlayer } from './default-player.js';
import { HowlerEngine } from './engine/howler.js';
import type { AudioEngine, EngineHandlers } from './engine/types.js';
import { connectMediaSession } from './media-session.js';
import * as Q from './queue.js';
import type { LoadOptions, QueueState, Random } from './queue.js';
import { Emitter, createStore, type ReadableStore } from './store.js';
import type { PlaybackStatus, PlayerError, PlayerState, ProgressState, QueueItem, RepeatMode, Track } from './types.js';

export interface PlayerOptions {
  /** Audio backend. Defaults to `new HowlerEngine()`. */
  engine?: AudioEngine;
  volume?: number;
  muted?: boolean;
  rate?: number;
  shuffle?: boolean;
  repeat?: RepeatMode;
  /** Skip to the next track when one fails to load (default `true`). */
  skipOnError?: boolean;
  /** `previous()` restarts the track instead when more than this many seconds in (default 3). */
  restartThreshold?: number;
  /** How often `progress` updates while playing, in ms (default 250). */
  progressInterval?: number;
  /**
   * Start fetching the next track this many seconds before the current one ends,
   * so it starts without a gap (default 20). `false` or `0` turns preloading off.
   */
  preloadNext?: number | false;
  /** Connect to OS media controls (default `true`). */
  mediaSession?: boolean;
  /** Random source for shuffling (default `Math.random`). */
  random?: Random;
}

export interface PlayOptions extends LoadOptions {
  /** Start playing immediately (default `true`). With `false`, the first track is loaded paused. */
  autoplay?: boolean;
}

export interface PlayerEvents<T extends Track> {
  /** The current entry changed. */
  trackchange: [current: QueueItem<T> | null, previous: QueueItem<T> | null];
  /** Entries were added, removed or reordered. */
  queuechange: [queue: readonly QueueItem<T>[]];
  play: [item: QueueItem<T>];
  pause: [item: QueueItem<T>];
  /** A track played to its end by itself. */
  trackend: [item: QueueItem<T>];
  /** The last track ended and there is nothing more to play. */
  queueend: [];
  seek: [time: number];
  error: [error: PlayerError];
  /** The browser blocked autoplay. Playback starts on the next user interaction. */
  blocked: [];
}

/** A snapshot of the queue and settings, to store wherever the application likes. */
export interface PlayerSession<T extends Track = Track> {
  version: 1;
  items: QueueItem<T>[];
  currentQid: string | null;
  originalOrder: string[] | null;
  shuffle: boolean;
  repeat: RepeatMode;
  position: number;
  volume: number;
  muted: boolean;
  rate: number;
}

export interface Player<T extends Track = Track> {
  /** Changes on discrete events: track, queue, play/pause, settings. */
  readonly state: ReadableStore<PlayerState<T>>;
  /** Changes several times a second while playing. */
  readonly progress: ReadableStore<ProgressState>;
  /** Shorthand for `state.get()`. */
  getState(): PlayerState<T>;
  /** Shorthand for `state.subscribe()`. Svelte-compatible: `$player` works. */
  subscribe(listener: (state: PlayerState<T>) => void): () => void;
  on<K extends keyof PlayerEvents<T>>(event: K, handler: (...args: PlayerEvents<T>[K]) => void): () => void;
  once<K extends keyof PlayerEvents<T>>(event: K, handler: (...args: PlayerEvents<T>[K]) => void): () => void;
  off<K extends keyof PlayerEvents<T>>(event: K, handler: (...args: PlayerEvents<T>[K]) => void): void;

  /** Resume, or start the queue if nothing is playing. */
  play(): void;
  /** Replace the queue with one track or a list (e.g. a playlist) and play it. Your array is copied, never modified. */
  play(tracks: T | readonly T[], options?: PlayOptions): void;
  pause(): void;
  toggle(): void;
  /** Pause and rewind the current track. */
  stop(): void;
  next(): void;
  /** Restart the track if past `restartThreshold`, else go to the previous one. */
  previous(): void;
  /** Make a queue entry current and play it. */
  jumpTo(qid: string): void;
  seek(seconds: number): void;

  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  toggleMute(): void;
  setRate(rate: number): void;
  setShuffle(shuffle: boolean): void;
  toggleShuffle(): void;
  setRepeat(repeat: RepeatMode): void;
  /** off → all → one → off */
  cycleRepeat(): void;

  /** Append to the end of the queue. */
  addToQueue(tracks: T | readonly T[]): void;
  /** Insert right after the current track. */
  playNext(tracks: T | readonly T[]): void;
  remove(qids: string | readonly string[]): void;
  /** Move an entry so it ends up at `toIndex` in `state.queue`. */
  move(qid: string, toIndex: number): void;
  /** Remove everything after the current track. */
  clearUpcoming(): void;
  /** Stop and empty the queue. */
  clearQueue(): void;

  serialize(): PlayerSession<T>;
  /** Restore a session from `serialize()`. Loads paused unless `autoplay` is set. */
  restore(session: PlayerSession<T>, options?: { autoplay?: boolean }): void;
  destroy(): void;
}

const REPEAT_CYCLE: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };

export function createPlayer<T extends Track = Track>(options: PlayerOptions = {}): Player<T> {
  const engine = options.engine ?? new HowlerEngine();
  const random = options.random ?? Math.random;
  const skipOnError = options.skipOnError ?? true;
  const restartThreshold = options.restartThreshold ?? 3;
  const progressInterval = options.progressInterval ?? 250;
  const preloadAhead = options.preloadNext === undefined ? 20 : options.preloadNext || false;

  // All mutable state lives in these variables; `sync()` publishes them as one snapshot.
  let q: QueueState<T> = { ...Q.emptyQueue<T>(), shuffle: options.shuffle ?? false, repeat: options.repeat ?? 'off' };
  let status: PlaybackStatus = 'idle';
  /** The user wants audio playing (true while loading, too). */
  let intent = false;
  /** The queue entry whose audio is loaded in the engine. */
  let loadedQid: string | null = null;
  let volume = clamp(options.volume ?? 1, 0, 1);
  let muted = options.muted ?? false;
  let rate = clamp(options.rate ?? 1, 0.5, 4);
  let blocked = false;
  let error: PlayerError | null = null;
  let consecutiveErrors = 0;
  let ticker: ReturnType<typeof setInterval> | undefined;
  /**
   * The source handed to `engine.preload()`, if any. Tracked by source rather than
   * queue entry, because that is what the engine matches when it loads.
   */
  let preloadedKey: string | null = null;

  engine.setVolume(volume);
  engine.setMuted(muted);
  engine.setRate(rate);

  const events = new Emitter<PlayerEvents<T>>();
  const state = createStore<PlayerState<T>>(snapshot());
  const progress = createStore<ProgressState>({ currentTime: 0, duration: 0 });

  function snapshot(): PlayerState<T> {
    const index = Q.currentIndex(q);
    return {
      status,
      playing: intent,
      current: q.items[index] ?? null,
      currentIndex: index,
      queue: q.items,
      shuffle: q.shuffle,
      repeat: q.repeat,
      volume,
      muted,
      rate,
      blocked,
      error,
    };
  }

  let publishedStatus: PlaybackStatus = status;

  /** Publish the snapshot, and emit `play`/`pause` from the status change. */
  function sync() {
    const before = publishedStatus;
    state.update(snapshot());
    publishedStatus = status;
    const item = Q.currentItem(q);
    if (!item || before === status) return;
    if (status === 'playing') events.emit('play', item);
    else if (before === 'playing' && status === 'paused') events.emit('pause', item);
  }

  // --- progress -----------------------------------------------------------

  function tick() {
    progress.update({ currentTime: engine.position(), duration: engine.duration() || progress.get().duration });
    preloadIfNearEnd();
  }

  // --- preloading -----------------------------------------------------------

  function preloadIfNearEnd() {
    if (preloadAhead === false || !engine.preload || status !== 'playing') return;
    const { currentTime, duration } = progress.get();
    if (duration <= 0 || duration - currentTime > preloadAhead) return;
    const next = Q.peekNext(q);
    const key = next ? sourceKey(next.track) : null;
    if (key === preloadedKey) return;
    preloadedKey = key;
    engine.preload(next ? { src: next.track.src, format: next.track.format } : null);
  }

  /** After a queue change: let go of a preload that is no longer what plays next. */
  function dropStalePreload() {
    if (preloadedKey === null) return;
    const next = Q.peekNext(q);
    if (next && sourceKey(next.track) === preloadedKey) return;
    preloadedKey = null;
    engine.preload?.(null);
  }

  function startTicker() {
    stopTicker();
    tick();
    ticker = setInterval(tick, progressInterval);
  }

  function stopTicker() {
    if (ticker !== undefined) clearInterval(ticker);
    ticker = undefined;
  }

  // --- the one place where queue changes reach the engine -----------------

  /**
   * Apply a new queue state. If the current entry changed, its audio is loaded;
   * `play` sets whether it should be playing afterwards.
   */
  function commit(next: QueueState<T>, play = intent) {
    const previousItem = Q.currentItem(q);
    const previousItems = q.items;
    const wasPlaying = intent;
    q = next;
    const item = Q.currentItem(q);
    intent = play && item !== null;

    if ((item?.qid ?? null) !== loadedQid) {
      loadCurrent();
    } else if (item && intent !== wasPlaying) {
      if (intent) engine.play();
      else engine.pause();
    }
    dropStalePreload();
    sync();

    if (previousItem !== item) events.emit('trackchange', item, previousItem);
    if (previousItems !== q.items) events.emit('queuechange', q.items);
  }

  function loadCurrent() {
    stopTicker();
    const item = Q.currentItem(q);
    loadedQid = item?.qid ?? null;
    // The engine uses up a preloaded track when it loads the same source.
    if (item && sourceKey(item.track) === preloadedKey) preloadedKey = null;
    blocked = false;

    if (!item) {
      engine.unload();
      status = 'idle';
      progress.update({ currentTime: 0, duration: 0 });
      return;
    }

    status = 'loading';
    progress.update({ currentTime: 0, duration: item.track.duration ?? 0 });
    engine.load({ src: item.track.src, format: item.track.format }, createHandlers(item));
    if (intent) engine.play();
  }

  function createHandlers(item: QueueItem<T>): EngineHandlers {
    // The engine already drops events from unloaded tracks; this double-checks.
    const live = () => loadedQid === item.qid;
    return {
      load(duration) {
        if (!live()) return;
        error = null;
        if (duration > 0) progress.update({ duration });
        if (!intent) status = 'paused';
        sync();
      },
      play() {
        if (!live()) return;
        if (!intent) {
          // Paused while the play request was still pending.
          engine.pause();
          return;
        }
        status = 'playing';
        blocked = false;
        consecutiveErrors = 0;
        startTicker();
        sync();
      },
      pause() {
        // Only pauses we didn't ask for (our own pause() already updated the status).
        if (!live() || intent || status !== 'playing') return;
        status = 'paused';
        stopTicker();
        tick();
        sync();
      },
      end() {
        if (!live()) return;
        stopTicker();
        events.emit('trackend', item);
        const { queue, result } = Q.advance(q, 'auto', random);
        if (result === 'end') endQueue();
        else if (result === 'repeat') restart();
        else commit(queue, true);
      },
      loadError(message) {
        if (live()) fail('load', message);
      },
      playError() {
        if (!live()) return;
        intent = false;
        blocked = true;
        status = 'paused';
        sync();
        events.emit('blocked');
      },
      unlock() {
        if (live() && blocked) play();
      },
    };
  }

  function fail(type: PlayerError['type'], message: string) {
    stopTicker();
    error = { type, message, item: Q.currentItem(q) };
    consecutiveErrors += 1;
    events.emit('error', error);

    // Skip ahead, but give up once every entry has failed in a row.
    if (skipOnError && consecutiveErrors < q.items.length) {
      const { queue, result } = Q.advance(q, 'user', random);
      if (result === 'next') {
        commit(queue);
        return;
      }
    }
    intent = false;
    status = 'error';
    sync();
  }

  function restart() {
    engine.seek(0);
    progress.update({ currentTime: 0 });
    intent = true;
    engine.play();
    sync();
  }

  function endQueue() {
    stopTicker();
    intent = false;
    status = 'ended';
    engine.pause();
    engine.seek(0);
    progress.update({ currentTime: 0 });
    sync();
    events.emit('queueend');
  }

  // --- actions --------------------------------------------------------------

  function play(tracks?: T | readonly T[], playOptions: PlayOptions = {}) {
    if (tracks !== undefined) {
      commit(Q.load(q, toArray(tracks), playOptions, random), playOptions.autoplay ?? true);
      return;
    }

    const item = Q.currentItem(q);
    if (!item) {
      const first = q.items[0];
      if (first) commit(Q.jumpTo(q, first.qid), true);
      return;
    }
    if (status === 'ended') {
      // Play what was added after the queue ended, or start over.
      const { queue, result } = Q.advance(q, 'user', random);
      if (result === 'next') commit(queue, true);
      else commit(Q.jumpTo(q, q.items[0]!.qid), true);
      if (Q.currentItem(q) === item) restart();
      return;
    }
    if (status === 'error') {
      consecutiveErrors = 0;
      loadedQid = null;
      commit(q, true);
      return;
    }
    if (intent && !blocked) return;
    intent = true;
    blocked = false;
    engine.play();
    sync();
  }

  function pause() {
    if (!intent) return;
    intent = false;
    if (status === 'playing') status = 'paused';
    stopTicker();
    tick();
    engine.pause();
    sync();
  }

  function seek(seconds: number) {
    if (!Q.currentItem(q)) return;
    const duration = progress.get().duration;
    const time = clamp(seconds, 0, duration > 0 ? duration : Infinity);
    engine.seek(time);
    progress.update({ currentTime: time });
    events.emit('seek', time);
  }

  function next() {
    const { queue, result } = Q.advance(q, 'user', random);
    if (result === 'end') endQueue();
    else if (result === 'repeat') restart();
    else commit(queue);
  }

  function previous() {
    if (progress.get().currentTime > restartThreshold) {
      seek(0);
      return;
    }
    const { queue, result } = Q.retreat(q);
    if (result === 'restart') seek(0);
    else commit(queue);
  }

  /** After adding to an empty queue, show the first entry as current (loaded, paused). */
  function selectFirstIfNone(next: QueueState<T>): QueueState<T> {
    const first = next.items[0];
    return next.currentQid === null && first ? Q.jumpTo(next, first.qid) : next;
  }

  const player: Player<T> = {
    state: state.readonly,
    progress: progress.readonly,
    getState: state.get,
    subscribe: state.subscribe,
    on: (event, handler) => events.on(event, handler),
    once: (event, handler) => events.once(event, handler),
    off: (event, handler) => events.off(event, handler),

    play,
    pause,
    toggle: () => (intent ? pause() : play()),
    stop() {
      pause();
      seek(0);
    },
    next,
    previous,
    jumpTo(qid) {
      if (qid === q.currentQid) {
        seek(0);
        play();
      } else if (q.items.some((item) => item.qid === qid)) {
        commit(Q.jumpTo(q, qid), true);
      }
    },
    seek,

    setVolume(value) {
      volume = clamp(value, 0, 1);
      engine.setVolume(volume);
      if (muted && volume > 0) {
        muted = false;
        engine.setMuted(false);
      }
      sync();
    },
    setMuted(value) {
      muted = value;
      engine.setMuted(muted);
      sync();
    },
    toggleMute: () => player.setMuted(!muted),
    setRate(value) {
      rate = clamp(value, 0.5, 4);
      engine.setRate(rate);
      sync();
    },
    setShuffle: (value) => commit(Q.setShuffle(q, value, random)),
    toggleShuffle: () => commit(Q.setShuffle(q, !q.shuffle, random)),
    setRepeat: (value) => commit(Q.setRepeat(q, value)),
    cycleRepeat: () => commit(Q.setRepeat(q, REPEAT_CYCLE[q.repeat])),

    addToQueue: (tracks) => commit(selectFirstIfNone(Q.add(q, toArray(tracks)))),
    playNext: (tracks) => commit(selectFirstIfNone(Q.addNext(q, toArray(tracks)))),
    remove: (qids) => commit(Q.remove(q, qids)),
    move: (qid, toIndex) => commit(Q.move(q, qid, toIndex)),
    clearUpcoming: () => commit(Q.clearUpcoming(q)),
    clearQueue: () => commit(Q.clear(q), false),

    serialize: () => ({
      version: 1,
      items: [...q.items],
      currentQid: q.currentQid,
      originalOrder: q.originalOrder && [...q.originalOrder],
      shuffle: q.shuffle,
      repeat: q.repeat,
      position: progress.get().currentTime,
      volume,
      muted,
      rate,
    }),
    restore(session, restoreOptions = {}) {
      if (session?.version !== 1) return;
      player.setVolume(session.volume);
      player.setMuted(session.muted);
      player.setRate(session.rate);
      const items = session.items.filter((item) => item && typeof item.qid === 'string' && item.track);
      const qids = new Set(items.map((item) => item.qid));
      commit(
        {
          items,
          currentQid: session.currentQid !== null && qids.has(session.currentQid) ? session.currentQid : (items[0]?.qid ?? null),
          shuffle: session.shuffle,
          repeat: session.repeat,
          originalOrder: session.shuffle ? (session.originalOrder ?? items.map((item) => item.qid)) : null,
        },
        restoreOptions.autoplay ?? false,
      );
      if (session.position > 0) seek(session.position);
    },
    destroy() {
      if (getDefaultPlayer() === player) setDefaultPlayer(null);
      disconnectMediaSession();
      stopTicker();
      intent = false;
      loadedQid = null;
      engine.unload();
      preloadedKey = null;
      engine.preload?.(null);
      events.clear();
    },
  };

  const disconnectMediaSession = options.mediaSession === false ? () => {} : connectMediaSession(player);
  if (!getDefaultPlayer()) setDefaultPlayer(player);
  return player;
}

function sourceKey(track: Track): string {
  return JSON.stringify([track.src, track.format ?? null]);
}

function toArray<T>(value: T | readonly T[]): readonly T[] {
  return Array.isArray(value) ? (value as readonly T[]) : [value as T];
}

function clamp(value: number, min: number, max: number): number {
  return Number.isNaN(value) ? min : Math.min(max, Math.max(min, value));
}
