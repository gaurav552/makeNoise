# MakeNoise

A framework-agnostic audio player for single page applications, powered by [Howler.js](https://howlerjs.com).

- **Your app owns the playlists.** MakeNoise only receives copies; it never modifies or saves them.
- **A real queue.** Play one track or a whole list, then add, remove, reorder, shuffle and repeat, with the queue always showing the actual play order.
- **Works everywhere.** The core is plain TypeScript exposing a tiny store that React, Vue, Svelte, Solid and Angular can all consume natively.

> Status: **core, default UI and framework bindings.** Queue, player, Howler engine, OS media controls, `<mn-player>` (a small corner player), React / Vue / Svelte bindings, keyboard shortcuts and next-track preloading. See [Roadmap](#roadmap).

## Try it

```bash
npm install
npm run dev     # opens the test bench at http://localhost:5173
npm run dev:react   # the same app in React (also dev:vue, dev:svelte)
npm run docs:dev    # the documentation site
npm test        # unit tests (core, bindings, keyboard)
npm run build   # dist/makenoise.js + dist/elements.js (ESM), dist/makenoise.iife.js (<script> tag, everything bundled)
```

The test bench (`examples/vanilla`) is a reading page with `<mn-player>` in the corner. It has three playlists (short local test tones, real streamed MP3s, and one with a broken file), corner and theme switchers, session save/restore, and an event log. The player is also on `window.player` for poking at in the console.

## Quick start

```ts
import { createPlayer } from 'makenoise';
import 'makenoise/elements'; // registers <mn-player>

// Create it once, outside any component, so it survives route changes.
export const player = createPlayer();
```

```html
<!-- Anywhere in your page. It finds the player by itself. -->
<mn-player></mn-player>
```

```ts

// Play one file
player.play({ id: '1', src: '/song.mp3', title: 'Song', artist: 'Artist' });

// Play a playlist from the 3rd track (your array is copied, never modified)
player.play(playlist.tracks, { startIndex: 2 });

// Shuffle-play a playlist (starts on a random track)
player.play(playlist.tracks, { shuffle: true });

player.subscribe((state) => render(state));            // discrete changes
player.progress.subscribe(({ currentTime, duration }) => // ~4×/second while playing
  updateSeekBar(currentTime, duration));
```

## The player UI: `<mn-player>`

A small player that lives in a corner and stays out of the way:

- **Collapsed:** a 48px medallion: a play/pause button on a soft accent-tinted disc, inside a thin progress ring. After a few seconds without attention it fades back a little. When the track changes, its title shows beside the medallion for a moment.
- **Hover or keyboard focus:** it unfolds from the medallion into a compact card with the title (up to two lines), a seek bar, previous/next, shuffle, repeat, volume, and a queue button. The dot in the card's corner opens the color picker. Moving away folds it back. Escape closes it. On touch screens, the first tap opens it.
- **Queue:** opens above the card and stays open until you close it. Drag the handle to reorder, or focus a row and use <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd>. <kbd>Delete</kbd> removes, <kbd>Enter</kbd> plays. Played tracks are tucked away behind "Show N played".
- **Hidden** while the queue is empty, unless `always-visible` is set.

### Attributes

| Attribute | Values |
|---|---|
| `position` | `bottom-left` (default), `bottom-right`, `top-left`, `top-right` |
| `theme` | `auto` (default, follows the OS), `light`, `dark` |
| `always-visible` | show the medallion even when nothing is queued |
| `quiet` | don't show the title when the track changes |
| `no-font-download` | don't fetch Nunito Sans from Google Fonts; self-host it or use the fallback fonts |
| `accent` | `red` (default), `orange`, `green`, `teal`, `blue`, `purple`: pastel colors |
| `no-color-picker` | hide the color picker |
| `artwork` | show the track's artwork in the medallion instead of the plain disc |
| `keyboard` | keyboard shortcuts while focus is in the player; `keyboard="global"` for the whole page (see [Keyboard shortcuts](#keyboard-shortcuts)) |

The element uses the first player created with `createPlayer()`. To control a different one, set `element.player = otherPlayer`. Methods: `expand()`, `collapse()`, `toggleQueue(open?)`.

### Colors

Listeners can pick one of six pastel colors from the dot in the card. The choice is remembered in `localStorage` (key `makenoise-accent`), takes priority over the `accent` attribute, and fires an `accentchange` event so the app can save it elsewhere too:

```js
document.querySelector('mn-player').addEventListener('accentchange', (e) => {
  saveUserPreference('playerColor', e.detail.accent); // 'red' | 'orange' | 'green' | 'teal' | 'blue' | 'purple'
});
```

With `no-color-picker`, the picker is hidden and only the `accent` attribute (or `--mn-accent`) decides. The palette values are exported as `accents` from `makenoise/elements`.

### Styling

Set custom properties on the element:

```css
mn-player {
  --mn-accent: #2f6f5e;                   /* any color, overrides the accent attribute */
  --mn-accent-ink: #2f6f5e;               /* accent for text/icons; on light themes it defaults to a darkened accent */
  --mn-surface: rgb(255 255 255 / 0.8);   /* translucent; the page blurs through it */
  --mn-text: #1d1d1f;
  --mn-muted: rgb(29 29 31 / 0.6);
  --mn-font-title: 'Your Font', sans-serif; /* song titles; default Nunito Sans */
  --mn-font-ui: 'Your Font', sans-serif;    /* everything else; default Nunito Sans */
  --mn-title-weight: 300;                   /* song titles are Light by default */
  --mn-width: 360px;
  --mn-offset-x: 24px;
  --mn-offset-y: 24px;
  --mn-rest-opacity: 0.55;               /* how far the idle medallion fades back */
  --mn-z: 1000;
}
```

Inner parts can be styled with `::part()`: `hud`, `card`, `queue`, `medallion`, `title`, `artist`, `seek`, `controls`, `whisper`.

```css
mn-player::part(title) { font-style: italic; }
```

**Fonts:** the player uses [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans) and adds the Google Fonts stylesheet to the page once. If the page already loads Nunito Sans it skips that. Add `no-font-download` to keep it from contacting Google (for privacy or a strict Content-Security-Policy) and self-host the font, or let it fall back to the system font.

To build a completely different UI, skip `<mn-player>` and use the store and actions directly (see below).

## Concepts

### Tracks and queue entries

A `Track` is your data: `{ id, src, title?, artist?, album?, artwork?, duration?, format? }`. Add your own fields with `createPlayer<MyTrack>()`.

When a track enters the queue it's wrapped in a `QueueItem` `{ qid, track }`. The `qid` is unique per entry, so the same song can be queued twice, and every queue operation takes a `qid`, never an index.

> URLs without a file extension (e.g. `/api/stream/42`) need a `format: 'mp3'` hint, because Howler picks the decoder from the extension.

### What you see is what plays

`state.queue` is always the real play order: **history → current → up next**. `state.currentIndex` marks the current entry.

| Action | Effect |
|---|---|
| Shuffle on | History and the current track stay put; *up next* is shuffled. The original order is remembered. |
| Shuffle off | The original order is restored. Removed entries stay removed; added ones keep their place. |
| Repeat `off` | Stops after the last track (`status: 'ended'`). Pressing play starts over. |
| Repeat `all` | Wraps to the first track. When shuffled, it reshuffles each pass, and the last track never plays twice in a row. |
| Repeat `one` | The track restarts when it ends, but **next** still moves on. |
| Previous | More than 3 s in: restart. Otherwise: previous track. |
| Remove the playing track | The next one takes its place, and keeps playing if the removed one was. Removing the last one leaves the player idle. |
| Track fails to load | An `error` event fires and the player skips ahead. It gives up when every track fails, instead of looping. |

## API

### `createPlayer(options?)`

| Option | Default | |
|---|---|---|
| `volume`, `muted`, `rate` | `1`, `false`, `1` | Initial values |
| `shuffle`, `repeat` | `false`, `'off'` | Initial modes |
| `skipOnError` | `true` | Skip tracks that fail to load |
| `restartThreshold` | `3` | Seconds before `previous()` restarts instead |
| `progressInterval` | `250` | ms between `progress` updates while playing |
| `preloadNext` | `20` | Start fetching the next track this many seconds before the current one ends, so it starts without a gap. `false` turns it off. |
| `mediaSession` | `true` | OS media controls, lock screen and media keys |
| `random` | `Math.random` | Random source for shuffling (seed it for reproducible tests) |
| `engine` | `new HowlerEngine()` | Swap the audio backend. `new HowlerEngine({ html5: false })` uses Web Audio. |

### Playback

`play()` · `play(trackOrTracks, { startIndex?, shuffle?, autoplay? })` · `pause()` · `toggle()` · `stop()` · `next()` · `previous()` · `jumpTo(qid)` · `seek(seconds)` · `setVolume(0..1)` · `setMuted(bool)` · `toggleMute()` · `setRate(0.5..4)`

### Queue

`addToQueue(tracks)` · `playNext(tracks)` · `remove(qid | qids)` · `move(qid, toIndex)` · `clearUpcoming()` · `clearQueue()` · `setShuffle(bool)` · `toggleShuffle()` · `setRepeat('off' | 'all' | 'one')` · `cycleRepeat()`

### State

```ts
player.getState(): PlayerState
{
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  playing: boolean;          // intent to play, true while loading too; use for the play button
  current: QueueItem | null;
  currentIndex: number;
  queue: readonly QueueItem[];
  shuffle: boolean; repeat: 'off' | 'all' | 'one';
  volume: number; muted: boolean; rate: number;
  blocked: boolean;          // browser blocked autoplay; next user click starts it
  error: PlayerError | null;
}

player.progress.get(): { currentTime: number; duration: number }
```

Both stores return immutable snapshots: a new object when something changed, the same object otherwise. Each has `get()`, `subscribe(fn)` (calls `fn` immediately, which matches the Svelte store contract) and `listen(fn)` (changes only).

### Events

`player.on(event, handler)` returns an unsubscribe function.

`trackchange(current, previous)` · `queuechange(queue)` · `play(item)` · `pause(item)` · `trackend(item)` · `queueend()` · `seek(time)` · `error(error)` · `blocked()`

### Session persistence

The library stores nothing. The app decides whether and where to store a session:

```ts
localStorage.setItem('player', JSON.stringify(player.serialize()));
player.restore(JSON.parse(localStorage.getItem('player')!)); // loads paused at the saved position
```

## Keyboard shortcuts

```ts
import { bindKeyboard } from 'makenoise';

const unbind = bindKeyboard(player, document.querySelector('#player-area')!); // only while focus is inside
bindKeyboard(player, document);                                              // or page-wide
```

Or on the element: `<mn-player keyboard>` (while focus is in the player) or `<mn-player keyboard="global">`.

| Keys | Action |
|---|---|
| <kbd>Space</kbd>, <kbd>K</kbd> | play / pause |
| <kbd>←</kbd> / <kbd>→</kbd>, <kbd>J</kbd> / <kbd>L</kbd> | seek 5 s back / forward |
| <kbd>Shift</kbd>+<kbd>P</kbd> / <kbd>Shift</kbd>+<kbd>N</kbd> | previous / next |
| <kbd>↑</kbd> / <kbd>↓</kbd> | volume up / down |
| <kbd>M</kbd> · <kbd>S</kbd> · <kbd>R</kbd> | mute · shuffle · repeat |

Keys typed into text fields, sliders and other form controls are left alone, as are <kbd>Space</kbd> and <kbd>Enter</kbd> on buttons and links, and events the app already handled (`preventDefault()`). Nothing happens while the queue is empty. Change the keys with `bindKeyboard(player, scope, { keys: { toggle: ['p'], mute: false }, seekStep: 10, volumeStep: 0.05 })`.

## Using it in a framework

Create the player once, in a module of its own, outside any component, so it survives route changes. Every binding finds it automatically. To use a different player for part of the app, provide it as shown below.

### React: `makenoise/react`

```tsx
import { usePlayer, usePlayerState, useProgress, usePlayerEvent, PlayerProvider } from 'makenoise/react';

function NowPlaying() {
  const player = usePlayer();
  const title = usePlayerState((s) => s.current?.track.title); // re-renders only when the title changes
  const playing = usePlayerState((s) => s.playing);
  const seconds = useProgress((p) => Math.floor(p.currentTime));
  usePlayerEvent('trackend', (item) => scrobble(item.track));

  return <button onClick={player.toggle}>{playing ? 'Pause' : 'Play'} {title} ({seconds}s)</button>;
}

// Optional: <PlayerProvider player={otherPlayer}>…</PlayerProvider>
```

Selectors should return a value from the state (or a primitive), not a new object. Call `useProgress` only in the components that show time, because it updates several times a second.

### Vue: `makenoise/vue`

```vue
<script setup lang="ts">
import { usePlayer, usePlayerState, useProgress, usePlayerEvent } from 'makenoise/vue';

const player = usePlayer();
const state = usePlayerState();                        // Readonly<Ref<PlayerState>>
const title = usePlayerState((s) => s.current?.track.title);
const progress = useProgress();
usePlayerEvent('trackend', (item) => scrobble(item.track)); // unsubscribed with the component
</script>

<template>
  <button @click="player.toggle()">{{ state.playing ? 'Pause' : 'Play' }} {{ title }}</button>
  <progress :value="progress.currentTime" :max="progress.duration" />
</template>
```

Optional: `app.provide(playerKey, otherPlayer)` or `providePlayer(otherPlayer)` in a component's setup. To use `<mn-player>` in Vue templates, tell the compiler it's a custom element: `vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('mn-') } } })`.

### Svelte 5: `makenoise/svelte`

```svelte
<script lang="ts">
  import { getPlayer, usePlayerState, useProgress, onPlayerEvent } from 'makenoise/svelte';

  const player = getPlayer();
  const playback = usePlayerState();  // reactive: playback.current.status
  const progress = useProgress();
  onPlayerEvent('trackend', (item) => scrobble(item.track));
</script>

<button onclick={player.toggle}>{playback.current.playing ? 'Pause' : 'Play'}</button>
<progress value={progress.current.currentTime} max={progress.current.duration}></progress>
```

The player is also a plain Svelte store, so `$player.current` works too. Don't name the variable `state`, because it clashes with the `$state` rune. Optional: `setPlayer(otherPlayer)` in a parent component.

### Others (Solid, Angular, Preact, …)

The stores follow a tiny contract that any framework can consume: `get()`, `listen(fn)` (changes only) and `subscribe(fn)` (also calls `fn` immediately).

## Server-side rendering

Every entry point can be imported on the server. `<mn-player>` is only registered in the browser. A player created on the server keeps its state but plays nothing: the Howler engine ignores calls when there is no `window`. Create the player in a client-only module (e.g. a `'use client'` file in Next.js), and don't share one between server requests.

## Architecture

```
src/
  queue.ts          pure queue model: no audio, no side effects, fully unit tested
  player.ts         createPlayer(): state, actions, events; the only bridge between queue and engine
  engine/howler.ts  the only file that touches Howler
  store.ts          tiny store + typed event emitter
  media-session.ts  OS media controls
  keyboard.ts       bindKeyboard(): scoped keyboard shortcuts
  react/ vue/ svelte/  framework bindings: thin adapters over the stores
  default-player.ts lets UI elements find the player without wiring
  elements/         <mn-player>: player-element.ts, styles.ts, icons.ts
```

How the engine handles Howler's sharp edges:
- **Always passes the sound id**, so `play()` never starts a second, overlapping copy.
- **Unloads every replaced track**, which prevents the *HTML5 Audio pool exhausted* error.
- **Ignores events from replaced tracks**, so a slow load after rapid skipping can't hijack playback.
- **Streams through HTML5 audio by default**, so long tracks start immediately instead of downloading first.
- **Preloads the next track** shortly before the current one ends, and hands that same `Howl` over when it starts.

## Roadmap

- [x] Phase 0: project setup (TypeScript, Vite, Vitest)
- [x] Phase 1: queue model + tests
- [x] Phase 2: Howler engine, player store, events, Media Session, error skipping
- [x] Phase 4: `<mn-player>`, the corner player with queue panel, themes, `::part()` and CSS custom properties
- [x] Phase 3: `makenoise/react`, `makenoise/vue`, `makenoise/svelte` bindings + one demo app per framework (`examples/`)
- [x] Phase 5: keyboard shortcuts (scoped), next-track preloading, SSR safety, docs site (`docs/`)

## License

MIT © Gaura Ghimire
