# Audio engine

The player never touches audio directly. It talks to an `AudioEngine`, and the default one, `HowlerEngine`, wraps [Howler.js](https://howlerjs.com). You can configure it, or replace it with your own engine.

## `HowlerEngine`

```ts
import { createPlayer, HowlerEngine } from 'makenoise';

const player = createPlayer({ engine: new HowlerEngine({ html5: false }) });
```

### Options

| Option | Default | |
|---|---|---|
| `html5` | `true` | Stream through an HTML5 `<audio>` element. With `false`, Howler uses Web Audio, which downloads and decodes the whole file before playing: fine for short sound effects, bad for music. |

### How it handles Howler

- **It always passes the sound id** back to Howler, so `play()` never starts a second, overlapping copy of the track.
- **It unloads every replaced track,** which prevents Howler's *HTML5 Audio pool exhausted* error.
- **It ignores events from replaced tracks,** so a slow load that finishes after the user skipped past it can't take over playback.
- **It streams through HTML5 audio by default,** so long tracks start right away instead of downloading first.
- **It preloads the next track** when the player asks, and hands that same `Howl` over when the track starts. If the preload failed, the track is loaded again so the error reaches the player.
- **On the server it does nothing.** Without `window`, every call is accepted and ignored.

Howler picks a decoder from the file extension. For URLs without one, set the track's `format` (for example `format: 'mp3'`).

## Writing your own engine

Implement `AudioEngine` to use another backend: a plain `<audio>` element, a native bridge in a hybrid app, or a fake for tests.

```ts
interface AudioEngine {
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
  /** Stop and release the current track. Must not release a preloaded track. */
  unload(): void;
  /**
   * Optional. Start fetching the track that will most likely play next, so `load()`
   * can reuse it. `null` releases whatever was preloaded.
   */
  preload?(source: EngineSource | null): void;
}

interface EngineSource {
  src: string | readonly string[];
  format?: string | readonly string[];
}
```

`EngineSource` carries the track's `src` and `format` fields.

### Handlers

`load()` receives a set of handlers. Call them to tell the player what happened to the loaded track:

```ts
interface EngineHandlers {
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
```

- Call `play()` when audio is really audible, not when it was requested. The player sets `status: 'playing'` from it.
- Call `pause()` for pauses the player didn't ask for, such as another app taking over audio. Calling it after the player's own `pause()` is harmless.
- `playError()` sets `state.blocked`. Call `unlock()` once the browser allows playback again; the player then resumes.
- `loadError()` reports an `error` event and, with `skipOnError`, moves on.

The player reads `position()` and `duration()` on every progress tick, and sets volume, mute and rate on the engine when it is created and whenever they change. Settings must carry over to tracks loaded later.

### Preloading

`preload()` is optional. When it exists and the `preloadNext` option isn't `false`, the player calls it shortly before the current track ends, with the next track's source. It calls `preload(null)` when the next track changes to none, and when the player is destroyed. When the preloaded track is then passed to `load()`, reuse what was fetched.

If your engine doesn't implement `preload()`, the player simply doesn't preload.

### Example: a plain `<audio>` element

A minimal engine without preloading:

```ts
import type { AudioEngine, EngineHandlers, EngineSource } from 'makenoise';

export class AudioElementEngine implements AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private handlers: EngineHandlers | null = null;
  private volume = 1;
  private muted = false;
  private rate = 1;

  load(source: EngineSource, handlers: EngineHandlers): void {
    this.unload();
    const audio = new Audio(typeof source.src === 'string' ? source.src : source.src[0]);
    audio.volume = this.volume;
    audio.muted = this.muted;
    audio.playbackRate = this.rate;

    // Ignore events once this element has been replaced.
    const live = () => this.audio === audio;
    audio.addEventListener('loadedmetadata', () => live() && handlers.load(audio.duration));
    audio.addEventListener('playing', () => live() && handlers.play());
    audio.addEventListener('pause', () => live() && !audio.ended && handlers.pause());
    audio.addEventListener('ended', () => live() && handlers.end());
    audio.addEventListener('error', () => live() && handlers.loadError(audio.error?.message || 'Could not load audio'));

    this.audio = audio;
    this.handlers = handlers;
  }

  play(): void {
    const audio = this.audio;
    if (!audio || !audio.paused) return;
    audio.play().catch((error: unknown) => {
      // NotAllowedError: the autoplay policy. Load failures arrive as 'error' events instead.
      if (this.audio !== audio || (error as DOMException).name !== 'NotAllowedError') return;
      this.handlers?.playError(String(error));
      const unlock = () => this.audio === audio && this.handlers?.unlock();
      document.addEventListener('pointerdown', unlock, { once: true });
    });
  }

  pause(): void {
    this.audio?.pause();
  }

  seek(seconds: number): void {
    if (this.audio) this.audio.currentTime = seconds;
  }

  position(): number {
    return this.audio?.currentTime ?? 0;
  }

  duration(): number {
    const duration = this.audio?.duration ?? 0;
    return Number.isFinite(duration) ? duration : 0;
  }

  setVolume(volume: number): void {
    this.volume = volume;
    if (this.audio) this.audio.volume = volume;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.audio) this.audio.muted = muted;
  }

  setRate(rate: number): void {
    this.rate = rate;
    if (this.audio) this.audio.playbackRate = rate;
  }

  unload(): void {
    const audio = this.audio;
    this.audio = null;
    this.handlers = null;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }
}
```

```ts
import { createPlayer } from 'makenoise';
import { AudioElementEngine } from './audio-element-engine';

export const player = createPlayer({ engine: new AudioElementEngine() });
```

This sketch only uses the first URL of `src` and ignores `format`. It is a starting point, not a replacement for `HowlerEngine`.
