import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPlayer, type Player } from '../src/player';
import { FakeEngine, seeded, tracks } from './helpers';

let player: Player;
let engine: FakeEngine;

function setup(options: { autoLoad?: boolean } = {}) {
  engine = new FakeEngine(options.autoLoad ?? true);
  player = createPlayer({ engine, mediaSession: false, random: seeded() });
  return player;
}

const currentId = () => player.getState().current?.track.id ?? null;
const queueIds = () => player.getState().queue.map((item) => item.track.id);

afterEach(() => player?.destroy());

describe('playing', () => {
  it('plays a single track', () => {
    setup();
    player.play(tracks(1)[0]!);
    expect(player.getState().status).toBe('playing');
    expect(player.getState().playing).toBe(true);
    expect(engine.source?.src).toBe('/t1.mp3');
  });

  it('plays a list from startIndex', () => {
    setup();
    player.play(tracks(5), { startIndex: 2 });
    expect(currentId()).toBe('t3');
    expect(queueIds()).toEqual(['t1', 't2', 't3', 't4', 't5']);
  });

  it('autoplay: false loads paused', () => {
    setup();
    player.play(tracks(3), { autoplay: false });
    expect(player.getState().status).toBe('paused');
    expect(player.getState().playing).toBe(false);
    expect(engine.playing).toBe(false);
  });

  it('pause / resume / toggle', () => {
    setup();
    player.play(tracks(2));
    player.pause();
    expect(player.getState().status).toBe('paused');
    expect(engine.playing).toBe(false);
    player.toggle();
    expect(player.getState().status).toBe('playing');
    expect(engine.playing).toBe(true);
  });

  it('play() with nothing current starts the queue', () => {
    setup();
    player.addToQueue(tracks(2));
    expect(player.getState().status).toBe('paused');
    player.play();
    expect(currentId()).toBe('t1');
    expect(player.getState().status).toBe('playing');
  });

  it('shows "playing" intent while the track is still loading', () => {
    setup({ autoLoad: false });
    player.play(tracks(2));
    expect(player.getState().status).toBe('loading');
    expect(player.getState().playing).toBe(true);
    engine.finishLoad();
    expect(player.getState().status).toBe('playing');
  });

  it('pausing while loading means it does not start when loaded', () => {
    setup({ autoLoad: false });
    player.play(tracks(2));
    player.pause();
    engine.finishLoad();
    expect(player.getState().status).toBe('paused');
    expect(engine.playing).toBe(false);
  });

  it('never mutates the application playlist', () => {
    setup();
    const playlist = tracks(5);
    const before = JSON.stringify(playlist);
    player.play(playlist, { startIndex: 1 });
    player.toggleShuffle();
    player.remove(player.getState().queue[3]!.qid);
    player.move(player.getState().queue[0]!.qid, 3);
    player.addToQueue(tracks(2, 'x'));
    player.clearUpcoming();
    expect(JSON.stringify(playlist)).toBe(before);
    expect(playlist).toHaveLength(5);
  });
});

describe('navigation', () => {
  it('advances when a track ends', () => {
    setup();
    player.play(tracks(3));
    engine.end();
    expect(currentId()).toBe('t2');
    expect(player.getState().status).toBe('playing');
  });

  it('stops with status "ended" after the last track', () => {
    setup();
    const onEnd = vi.fn();
    player.on('queueend', onEnd);
    player.play(tracks(2), { startIndex: 1 });
    engine.end();
    expect(player.getState().status).toBe('ended');
    expect(player.getState().playing).toBe(false);
    expect(currentId()).toBe('t2');
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('play() after the queue ended starts over from the first track', () => {
    setup();
    player.play(tracks(3), { startIndex: 2 });
    engine.end();
    player.play();
    expect(currentId()).toBe('t1');
    expect(player.getState().status).toBe('playing');
  });

  it('play() after the queue ended plays what was added since', () => {
    setup();
    player.play(tracks(2), { startIndex: 1 });
    engine.end();
    player.addToQueue(tracks(1, 'x'));
    player.play();
    expect(currentId()).toBe('x1');
  });

  it('repeat one restarts the same track when it ends', () => {
    setup();
    player.play(tracks(3));
    player.setRepeat('one');
    engine.pos = 100;
    engine.end();
    expect(currentId()).toBe('t1');
    expect(engine.pos).toBe(0);
    expect(player.getState().status).toBe('playing');
  });

  it('repeat all loops the queue', () => {
    setup();
    player.play(tracks(2), { startIndex: 1 });
    player.setRepeat('all');
    engine.end();
    expect(currentId()).toBe('t1');
  });

  it('cycleRepeat goes off → all → one → off', () => {
    setup();
    const seen = [player.getState().repeat];
    for (let i = 0; i < 3; i++) {
      player.cycleRepeat();
      seen.push(player.getState().repeat);
    }
    expect(seen).toEqual(['off', 'all', 'one', 'off']);
  });

  it('previous() restarts the track when past the threshold', () => {
    setup();
    player.play(tracks(3), { startIndex: 1 });
    player.seek(30);
    player.previous();
    expect(currentId()).toBe('t2');
    expect(engine.pos).toBe(0);
  });

  it('previous() goes back when near the start', () => {
    setup();
    player.play(tracks(3), { startIndex: 1 });
    player.previous();
    expect(currentId()).toBe('t1');
  });

  it('jumpTo plays the chosen entry', () => {
    setup();
    player.play(tracks(5), { autoplay: false });
    player.jumpTo(player.getState().queue[3]!.qid);
    expect(currentId()).toBe('t4');
    expect(player.getState().status).toBe('playing');
  });

  it('rapid next() presses settle on the right track without overlapping audio', () => {
    setup({ autoLoad: false });
    player.play(tracks(10));
    for (let i = 0; i < 6; i++) player.next();
    expect(currentId()).toBe('t7');
    engine.finishLoad();
    expect(engine.source?.src).toBe('/t7.mp3');
    expect(player.getState().status).toBe('playing');
    expect(engine.loads).toHaveLength(7);
  });
});

describe('queue editing while playing', () => {
  it('removing the playing track moves on to the next and keeps playing', () => {
    setup();
    player.play(tracks(3));
    player.remove(player.getState().current!.qid);
    expect(currentId()).toBe('t2');
    expect(player.getState().status).toBe('playing');
  });

  it('removing the playing last track stops', () => {
    setup();
    player.play(tracks(2), { startIndex: 1 });
    player.remove(player.getState().current!.qid);
    expect(player.getState().current).toBeNull();
    expect(player.getState().status).toBe('idle');
    expect(engine.source).toBeNull();
  });

  it('reordering, shuffling and adding never reload the playing track', () => {
    setup();
    player.play(tracks(5));
    const loads = engine.loads.length;
    player.move(player.getState().queue[4]!.qid, 1);
    player.toggleShuffle();
    player.toggleShuffle();
    player.addToQueue(tracks(1, 'x'));
    player.playNext(tracks(1, 'y'));
    expect(engine.loads.length).toBe(loads);
    expect(player.getState().status).toBe('playing');
  });

  it('adding to an empty player loads the first entry, paused', () => {
    setup();
    player.addToQueue(tracks(2));
    expect(currentId()).toBe('t1');
    expect(player.getState().status).toBe('paused');
    expect(engine.playing).toBe(false);
  });

  it('clearQueue stops and empties', () => {
    setup();
    player.play(tracks(3));
    player.clearQueue();
    expect(player.getState().queue).toEqual([]);
    expect(player.getState().status).toBe('idle');
    expect(player.getState().playing).toBe(false);
  });

  it('turning shuffle off resumes the original order after the current track', () => {
    setup();
    player.play(tracks(6), { startIndex: 0, shuffle: true });
    engine.end();
    const playing = currentId();
    player.setShuffle(false);
    expect(queueIds()).toEqual(['t1', 't2', 't3', 't4', 't5', 't6']);
    expect(currentId()).toBe(playing);
  });
});

describe('errors', () => {
  it('skips a track that fails to load', () => {
    setup();
    const onError = vi.fn();
    player.on('error', onError);
    player.play([...tracks(1), { id: 'bad', src: '/broken.mp3' }, ...tracks(1, 'x')], { startIndex: 1 });
    expect(onError).toHaveBeenCalledOnce();
    expect(currentId()).toBe('x1');
    expect(player.getState().status).toBe('playing');
  });

  it('gives up instead of looping forever when every track fails', () => {
    setup();
    player.setRepeat('all');
    player.play([
      { id: 'a', src: '/broken-a.mp3' },
      { id: 'b', src: '/broken-b.mp3' },
      { id: 'c', src: '/broken-c.mp3' },
    ]);
    expect(player.getState().status).toBe('error');
    expect(player.getState().playing).toBe(false);
    expect(engine.loads.length).toBeLessThanOrEqual(3);
  });
});

describe('events and stores', () => {
  it('emits trackchange and queuechange', () => {
    setup();
    const trackchange = vi.fn();
    const queuechange = vi.fn();
    player.on('trackchange', trackchange);
    player.on('queuechange', queuechange);
    player.play(tracks(3));
    player.next();
    player.addToQueue(tracks(1, 'x'));
    expect(trackchange).toHaveBeenCalledTimes(2);
    expect(trackchange.mock.calls[1]![0].track.id).toBe('t2');
    expect(trackchange.mock.calls[1]![1].track.id).toBe('t1');
    expect(queuechange).toHaveBeenCalledTimes(2);
  });

  it('emits play and pause once per change', () => {
    setup();
    const play = vi.fn();
    const pause = vi.fn();
    player.on('play', play);
    player.on('pause', pause);
    player.play(tracks(3));
    player.pause();
    player.pause();
    player.addToQueue(tracks(1, 'x'));
    player.play();
    expect(play).toHaveBeenCalledTimes(2);
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('state snapshots are immutable and only change when something changed', () => {
    setup();
    player.play(tracks(2));
    const before = player.getState();
    player.setShuffle(false); // already off
    player.setVolume(before.volume);
    expect(player.getState()).toBe(before);
    player.setVolume(0.5);
    expect(player.getState()).not.toBe(before);
    expect(before.volume).toBe(1);
  });

  it('subscribe follows the Svelte store contract (called immediately)', () => {
    setup();
    const listener = vi.fn();
    const unsubscribe = player.subscribe(listener);
    expect(listener).toHaveBeenCalledOnce();
    player.play(tracks(1));
    expect(listener.mock.calls.length).toBeGreaterThan(1);
    unsubscribe();
    const calls = listener.mock.calls.length;
    player.pause();
    expect(listener.mock.calls.length).toBe(calls);
  });

  it('a throwing listener does not break playback', () => {
    setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    player.on('trackchange', () => {
      throw new Error('app bug');
    });
    player.play(tracks(2));
    player.next();
    expect(currentId()).toBe('t2');
    spy.mockRestore();
  });
});

describe('settings', () => {
  it('volume, mute and rate reach the engine and are clamped', () => {
    setup();
    player.setVolume(2);
    expect(engine.volume).toBe(1);
    player.setMuted(true);
    expect(engine.muted).toBe(true);
    player.setVolume(0.3);
    expect(engine.muted).toBe(false); // raising the volume unmutes
    player.setRate(10);
    expect(engine.rate).toBe(4);
  });
});

describe('serialize / restore', () => {
  it('restores queue, current entry, shuffle state and position, paused', () => {
    setup();
    player.play(tracks(5), { startIndex: 0, shuffle: true });
    player.next();
    player.setRepeat('all');
    player.setVolume(0.4);
    player.seek(42);
    const saved = JSON.parse(JSON.stringify(player.serialize()));
    const expectedQueue = queueIds();
    const expectedCurrent = currentId();
    player.destroy();

    setup();
    player.restore(saved);
    expect(queueIds()).toEqual(expectedQueue);
    expect(currentId()).toBe(expectedCurrent);
    expect(player.getState().repeat).toBe('all');
    expect(player.getState().volume).toBe(0.4);
    expect(player.getState().status).toBe('paused');
    expect(engine.pos).toBe(42);

    player.setShuffle(false);
    expect(queueIds()).toEqual(['t1', 't2', 't3', 't4', 't5']);
  });
});

describe('default player', () => {
  it('the first player created becomes the default, and destroying it clears it', async () => {
    const { getDefaultPlayer } = await import('../src/default-player');
    player?.destroy();
    setup();
    expect(getDefaultPlayer()).toBe(player);
    const second = createPlayer({ engine: new FakeEngine(), mediaSession: false });
    expect(getDefaultPlayer()).toBe(player);
    player.destroy();
    expect(getDefaultPlayer()).toBeNull();
    second.destroy();
  });
});

describe('preloading the next track', () => {
  afterEach(() => vi.useRealTimers());

  function playNearEnd(options: { preloadNext?: number | false } = {}) {
    vi.useFakeTimers();
    engine = new FakeEngine(true, 180);
    player = createPlayer({ engine, mediaSession: false, progressInterval: 250, ...options });
    player.play(tracks(3));
    return {
      at(seconds: number) {
        engine.pos = seconds;
        vi.advanceTimersByTime(250);
      },
    };
  }

  it('preloads the next track shortly before the current one ends', () => {
    const { at } = playNearEnd();
    at(100);
    expect(engine.preloads).toEqual([]);
    at(165);
    at(166);
    expect(engine.preloads).toEqual(['/t2.mp3']);
  });

  it('follows queue edits made after preloading', () => {
    const { at } = playNearEnd();
    at(165);
    player.remove(player.getState().queue[1]!.qid);
    at(166);
    expect(engine.preloads).toEqual(['/t2.mp3', null, '/t3.mp3']);
    player.clearUpcoming();
    expect(engine.preloads.at(-1)).toBe(null);
  });

  it('releases a stale preload right away, even while paused', () => {
    const { at } = playNearEnd();
    at(170);
    player.pause();
    player.play(tracks(2, 'new'), { autoplay: false });
    expect(engine.preloads).toEqual(['/t2.mp3', null]);
  });

  it('preloads the same track again after skipping away and back', () => {
    const { at } = playNearEnd();
    at(170);
    player.next(); // uses up the t2 preload
    player.previous();
    player.previous();
    at(170);
    expect(engine.preloads.filter((src) => src === '/t2.mp3')).toHaveLength(2);
  });

  it('counts a preload as used when another entry with the same source loads', () => {
    vi.useFakeTimers();
    engine = new FakeEngine(true, 180);
    player = createPlayer({ engine, mediaSession: false });
    const [a, b] = tracks(2);
    player.play([a!, b!, { ...b!, id: 'b-again' }]);
    engine.pos = 170;
    vi.advanceTimersByTime(250);
    player.next(); // loads b, which was preloaded
    engine.pos = 170;
    vi.advanceTimersByTime(250);
    // The second b entry has the same source; it must be preloaded again, not skipped.
    expect(engine.preloads).toEqual(['/t2.mp3', '/t2.mp3']);
  });

  it('respects the preloadNext option', () => {
    const early = playNearEnd({ preloadNext: 90 });
    early.at(95);
    expect(engine.preloads).toEqual(['/t2.mp3']);
    player.destroy();

    const off = playNearEnd({ preloadNext: false });
    off.at(179);
    expect(engine.preloads).toEqual([]);
  });

  it('does not preload while paused or on repeat-one', () => {
    const { at } = playNearEnd();
    player.setRepeat('one');
    at(170);
    player.setRepeat('off');
    engine.pos = 171;
    player.pause(); // pausing reads the position one last time
    at(172);
    expect(engine.preloads).toEqual([]);
  });

  it('treats 0 as off', () => {
    const { at } = playNearEnd({ preloadNext: 0 });
    at(180);
    expect(engine.preloads).toEqual([]);
  });

  it('releases the preload when destroyed', () => {
    const { at } = playNearEnd();
    at(170);
    player.destroy();
    expect(engine.preloads.at(-1)).toBe(null);
  });
});
