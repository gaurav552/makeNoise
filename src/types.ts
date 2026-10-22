/**
 * A playable track. This is the application's data — MakeNoise never mutates it.
 * Extend it with your own fields: `createPlayer<MyTrack>()`.
 */
export interface Track {
  /** The application's id for this track. Need not be unique within a queue. */
  id: string;
  /** URL(s) of the audio. Multiple URLs are tried in order (e.g. `['a.webm', 'a.mp3']`). */
  src: string | readonly string[];
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  /** Known duration in seconds, used until the real duration is loaded. */
  duration?: number;
  /**
   * File format hint(s) such as `'mp3'`. Required when `src` has no file extension,
   * e.g. `/api/stream/42`, because Howler picks a decoder from the extension.
   */
  format?: string | readonly string[];
}

/**
 * One entry in the queue. `qid` is unique per entry, so the same track can be
 * queued more than once and every entry can still be removed or moved unambiguously.
 */
export interface QueueItem<T extends Track = Track> {
  readonly qid: string;
  readonly track: T;
}

export type RepeatMode = 'off' | 'all' | 'one';

/**
 * - `idle`     nothing loaded
 * - `loading`  the current track is loading
 * - `playing`  audio is audible
 * - `paused`   paused by the user (or not yet started)
 * - `ended`    the queue played to the end
 * - `error`    the current track failed and could not be skipped
 */
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface PlayerError {
  /** `load` — the file could not be fetched/decoded. `play` — the browser refused to play it. */
  type: 'load' | 'play';
  message: string;
  item: QueueItem | null;
}

/** Changes on discrete events only — safe to bind your whole UI to. */
export interface PlayerState<T extends Track = Track> {
  status: PlaybackStatus;
  /**
   * True while the player intends to play, including while the track is still loading.
   * Use this for the play/pause button.
   */
  playing: boolean;
  current: QueueItem<T> | null;
  /** Index of `current` in `queue`, or -1. */
  currentIndex: number;
  /** The queue in play order: history, then the current item, then what's up next. */
  queue: readonly QueueItem<T>[];
  shuffle: boolean;
  repeat: RepeatMode;
  /** 0..1 */
  volume: number;
  muted: boolean;
  rate: number;
  /** The browser blocked autoplay; playback starts on the next user interaction. */
  blocked: boolean;
  error: PlayerError | null;
}

/** Changes many times per second while playing — subscribe only where you show time. */
export interface ProgressState {
  /** Seconds */
  currentTime: number;
  /** Seconds; 0 until known */
  duration: number;
}
