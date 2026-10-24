import { Howl } from 'howler';
import type { AudioEngine, EngineHandlers, EngineSource } from './types';

export interface HowlerEngineOptions {
  /**
   * Stream through an HTML5 <audio> element (default `true`). With `false`, Howler uses
   * Web Audio, which downloads and decodes the whole file before playing — fine for
   * short sound effects, bad for music.
   */
  html5?: boolean;
}

/** On the server (SSR) there is nothing to play: the engine accepts every call and does nothing. */
const inBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const MEDIA_ERRORS: Record<number, string> = {
  1: 'Loading was aborted',
  2: 'A network error occurred while loading the audio',
  3: 'The audio could not be decoded',
  4: 'The audio format or source is not supported',
};

export class HowlerEngine implements AudioEngine {
  private howl: Howl | null = null;
  /** The player's callbacks for `howl`. */
  private handlers: EngineHandlers | null = null;
  /**
   * The Howler sound id. Always passed back to Howler: `howl.play()` without an id
   * can start a second, overlapping copy of the track.
   */
  private soundId: number | undefined;
  private volume = 1;
  private muted = false;
  private rate = 1;
  private readonly html5: boolean;
  /** The likely next track, already fetching. `load()` adopts it when its source matches. */
  private preloaded: { key: string; howl: Howl; failed: boolean } | null = null;

  constructor(options: HowlerEngineOptions = {}) {
    this.html5 = options.html5 ?? true;
  }

  load(source: EngineSource, handlers: EngineHandlers): void {
    if (!inBrowser) return;
    const adopted = this.takePreloaded(source);
    this.unload();

    const howl = adopted ?? this.create(source);
    this.howl = howl;
    this.handlers = handlers;

    if (adopted) {
      howl.volume(this.volume);
      howl.mute(this.muted);
      howl.rate(this.rate);
      // Already loaded while preloading: Howler won't fire 'load' again.
      if (howl.state() === 'loaded') handlers.load(howl.duration());
    }
  }

  preload(source: EngineSource | null): void {
    if (!inBrowser) return;
    const key = source ? keyOf(source) : null;
    if (key !== null && this.preloaded?.key === key) return;
    this.preloaded?.howl.unload();
    this.preloaded = null;
    if (source && key !== null) this.preloaded = { key, howl: this.create(source), failed: false };
  }

  private takePreloaded(source: EngineSource): Howl | null {
    const entry = this.preloaded;
    if (!entry || entry.key !== keyOf(source)) return null;
    this.preloaded = null;
    if (!entry.failed) return entry.howl;
    // Load it again from scratch, so the error is reported to the new handlers.
    entry.howl.unload();
    return null;
  }

  /** The handlers for `howl` while it is the loaded track; null for preloaded and replaced ones. */
  private route(howl: Howl): EngineHandlers | null {
    return this.howl === howl ? this.handlers : null;
  }

  private create(source: EngineSource): Howl {
    // The callbacks must go in the constructor: Howler can emit while constructing
    // (e.g. "No codec support" for a src without an extension, or `load` from its Web
    // Audio cache), and it only delivers to listeners registered at that moment.
    // Delivery is deferred with setTimeout, so `howl` is assigned by the time they run.
    // Routing through `route()` drops events from a slow track that finishes loading
    // after the user skipped past it, and holds a preloaded track's events until adopted.
    const howl: Howl = new Howl({
      src: typeof source.src === 'string' ? [source.src] : [...source.src],
      format: source.format === undefined ? undefined : typeof source.format === 'string' ? [source.format] : [...source.format],
      html5: this.html5,
      preload: true,
      volume: this.volume,
      mute: this.muted,
      rate: this.rate,
      onload: () => this.route(howl)?.load(howl.duration()),
      onloaderror: (_id, error) => {
        if (this.preloaded?.howl === howl) this.preloaded.failed = true;
        this.route(howl)?.loadError(describe(error));
      },
      onplay: () => this.route(howl)?.play(),
      onpause: () => this.route(howl)?.pause(),
      onend: () => this.route(howl)?.end(),
      onplayerror: (_id, error) => {
        const handlers = this.route(howl);
        if (!handlers) return;
        handlers.playError(describe(error));
        howl.once('unlock', () => this.route(howl)?.unlock());
      },
    });
    return howl;
  }

  play(): void {
    const howl = this.howl;
    if (!howl) return;
    if (this.soundId !== undefined && howl.playing(this.soundId)) return;
    this.soundId = howl.play(this.soundId);
  }

  pause(): void {
    this.howl?.pause(this.soundId);
  }

  seek(seconds: number): void {
    const howl = this.howl;
    if (!howl) return;
    if (this.soundId === undefined) howl.seek(seconds);
    else howl.seek(seconds, this.soundId);
  }

  position(): number {
    const howl = this.howl;
    if (!howl || howl.state() !== 'loaded') return 0;
    // Howler returns the Howl itself instead of a number in some states.
    const position: unknown = this.soundId === undefined ? howl.seek() : howl.seek(this.soundId);
    return typeof position === 'number' && Number.isFinite(position) ? position : 0;
  }

  duration(): number {
    const duration = this.howl?.duration() ?? 0;
    return Number.isFinite(duration) ? duration : 0;
  }

  setVolume(volume: number): void {
    this.volume = volume;
    this.howl?.volume(volume);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.howl?.mute(muted);
  }

  setRate(rate: number): void {
    this.rate = rate;
    this.howl?.rate(rate);
  }

  unload(): void {
    const howl = this.howl;
    this.howl = null;
    this.handlers = null;
    this.soundId = undefined;
    // Unloading returns the <audio> element to Howler's pool; skipping this
    // eventually fails with "HTML5 Audio pool exhausted".
    howl?.unload();
  }
}

function keyOf(source: EngineSource): string {
  return JSON.stringify([source.src, source.format ?? null]);
}

function describe(error: unknown): string {
  if (typeof error === 'number') return MEDIA_ERRORS[error] ?? `Media error ${error}`;
  if (typeof error === 'string' && error) return error;
  return 'Unknown audio error';
}
