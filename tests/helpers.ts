import type { AudioEngine, EngineHandlers, EngineSource } from '../src/engine/types';
import type { Track } from '../src/types';

/**
 * In-memory engine. By default tracks load instantly (synchronously); set
 * `autoLoad = false` to finish loads by hand with `finishLoad()`.
 * Any src containing "broken" fails to load.
 */
export class FakeEngine implements AudioEngine {
  handlers: EngineHandlers | null = null;
  source: EngineSource | null = null;
  loads: string[] = [];
  playing = false;
  loaded = false;
  pendingPlay = false;
  pos = 0;
  dur = 0;
  volume = 1;
  muted = false;
  rate = 1;
  playCalls = 0;
  /** Every `preload()` call: the src, or null for a release. */
  preloads: (string | null)[] = [];

  constructor(public autoLoad = true, public trackDuration = 180) {}

  load(source: EngineSource, handlers: EngineHandlers): void {
    this.unload();
    this.source = source;
    this.handlers = handlers;
    this.loads.push(String(source.src));
    if (this.autoLoad) this.finishLoad();
  }

  finishLoad(): void {
    const handlers = this.handlers;
    if (!handlers) return;
    if (String(this.source?.src).includes('broken')) {
      handlers.loadError('cannot load');
      return;
    }
    this.loaded = true;
    this.dur = this.trackDuration;
    handlers.load(this.dur);
    if (this.pendingPlay && this.handlers === handlers) {
      this.pendingPlay = false;
      this.startPlaying();
    }
  }

  play(): void {
    this.playCalls += 1;
    if (!this.handlers || this.playing) return;
    if (!this.loaded) {
      this.pendingPlay = true;
      return;
    }
    this.startPlaying();
  }

  private startPlaying() {
    this.playing = true;
    this.handlers?.play();
  }

  pause(): void {
    this.pendingPlay = false;
    if (!this.playing) return;
    this.playing = false;
    this.handlers?.pause();
  }

  seek(seconds: number): void {
    this.pos = seconds;
  }

  position(): number {
    return this.pos;
  }

  duration(): number {
    return this.dur;
  }

  setVolume(volume: number): void {
    this.volume = volume;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  setRate(rate: number): void {
    this.rate = rate;
  }

  unload(): void {
    this.handlers = null;
    this.source = null;
    this.playing = false;
    this.loaded = false;
    this.pendingPlay = false;
    this.pos = 0;
    this.dur = 0;
  }

  preload(source: EngineSource | null): void {
    this.preloads.push(source ? String(source.src) : null);
  }

  /** Simulate the track reaching its end. */
  end(): void {
    this.playing = false;
    this.pos = 0;
    this.handlers?.end();
  }
}

export function tracks(count: number, prefix = 't'): Track[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i + 1}`, src: `/${prefix}${i + 1}.mp3`, title: `${prefix}${i + 1}` }));
}

/** Deterministic random numbers (mulberry32). */
export function seeded(seed = 42): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
