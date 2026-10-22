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

const MEDIA_ERRORS: Record<number, string> = {
  1: 'Loading was aborted',
  2: 'A network error occurred while loading the audio',
  3: 'The audio could not be decoded',
  4: 'The audio format or source is not supported',
};

export class HowlerEngine implements AudioEngine {
  private howl: Howl | null = null;
  /**
   * The Howler sound id. Always passed back to Howler: `howl.play()` without an id
   * can start a second, overlapping copy of the track.
   */
  private soundId: number | undefined;
  private volume = 1;
  private muted = false;
  private rate = 1;
  private readonly html5: boolean;

  constructor(options: HowlerEngineOptions = {}) {
    this.html5 = options.html5 ?? true;
  }

  load(source: EngineSource, handlers: EngineHandlers): void {
    this.unload();

    // Every callback checks it still belongs to the loaded track, so a slow track
    // that finishes loading after the user skipped past it can't take over.
    const live = () => this.howl === howl;
    const howl: Howl = new Howl({
      src: typeof source.src === 'string' ? [source.src] : [...source.src],
      format: source.format === undefined ? undefined : typeof source.format === 'string' ? [source.format] : [...source.format],
      html5: this.html5,
      preload: true,
      volume: this.volume,
      mute: this.muted,
      rate: this.rate,
      onload: () => live() && handlers.load(howl.duration()),
      onloaderror: (_id, error) => live() && handlers.loadError(describe(error)),
      onplay: () => live() && handlers.play(),
      onpause: () => live() && handlers.pause(),
      onend: () => live() && handlers.end(),
      onplayerror: (_id, error) => {
        if (!live()) return;
        handlers.playError(describe(error));
        howl.once('unlock', () => live() && handlers.unlock());
      },
    });
    this.howl = howl;
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
    this.soundId = undefined;
    // Unloading returns the <audio> element to Howler's pool; skipping this
    // eventually fails with "HTML5 Audio pool exhausted".
    howl?.unload();
  }
}

function describe(error: unknown): string {
  if (typeof error === 'number') return MEDIA_ERRORS[error] ?? `Media error ${error}`;
  if (typeof error === 'string' && error) return error;
  return 'Unknown audio error';
}
