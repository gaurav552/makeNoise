/**
 * What the player needs from an audio backend. The Howler implementation is the
 * default; tests use a fake one, and anyone can plug in their own.
 */
export interface AudioEngine {
  /**
   * Load a track, replacing (and unloading) whatever was loaded before.
   * Events from a previously loaded track must never reach the new `handlers`.
   */
  load(source: EngineSource, handlers: EngineHandlers): void;
  /** Start or resume. Must be a no-op if already playing, never a second overlapping sound. */
  play(): void;
  pause(): void;
  /** Seconds. May be called before the track has loaded. */
  seek(seconds: number): void;
  /** Current position in seconds. */
  position(): number;
  /** Duration in seconds, 0 if unknown. */
  duration(): number;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  setRate(rate: number): void;
  /** Stop and release the current track. */
  unload(): void;
}

export interface EngineSource {
  src: string | readonly string[];
  format?: string | readonly string[];
}

export interface EngineHandlers {
  /** The track is ready to play. */
  load(duration: number): void;
  /** Audio actually started. */
  play(): void;
  pause(): void;
  /** The track played to its end. */
  end(): void;
  loadError(message: string): void;
  /** The browser refused to start playback, usually the autoplay policy. */
  playError(message: string): void;
  /** Audio has been unlocked by a user interaction after a `playError`. */
  unlock(): void;
}
