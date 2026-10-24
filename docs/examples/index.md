# Examples

These are the demo apps from the [`examples/`](https://github.com/gaurav552/makeNoise/tree/master/examples) folder, built from the current source. Each one has the same three playlists:

- **Tone Studies:** eight short generated tracks, 10 to 20 seconds each, for testing auto-advance, repeat and shuffle.
- **Real Music (streamed):** four full-length MP3s from soundhelix.com.
- **Error Handling:** a playlist with a missing file in the middle. The player reports it and skips to the next track.

Browsers block audio until you interact with the page, so press a track before expecting sound.

## Test bench (no framework)

A long reading page with `<mn-player>` in the corner. Use it to try the player UI itself: hover or tab to the medallion, open the queue, drag rows to reorder. The header switches the corner and the theme, toggles artwork, and saves or restores the session through `localStorage`. The event log shows every player event, and the player is on `window.player` for the browser console.

[Open the test bench →](/examples/vanilla/){target="_self"} · [Source](https://github.com/gaurav552/makeNoise/tree/master/examples/vanilla)

## React

The same app built with `makenoise/react`: `usePlayerState` for the now-playing panel and queue, `useProgress` for the seek bar, and `usePlayerEvent` for the event log. `<mn-player>` sits alongside the hooks and drives the same player.

[Open the React demo →](/examples/react/){target="_self"} · [Source](https://github.com/gaurav552/makeNoise/tree/master/examples/react) · [Guide](/guide/react)

## Vue

The same app built with the `makenoise/vue` composables: `usePlayerState`, `useProgress` (with a separate seek bar component) and `usePlayerEvent`.

[Open the Vue demo →](/examples/vue/){target="_self"} · [Source](https://github.com/gaurav552/makeNoise/tree/master/examples/vue) · [Guide](/guide/vue)

## Svelte

The same app built with Svelte 5 runes and `makenoise/svelte`. The player is also a plain Svelte store, so the header reads `$player.queue.length` directly.

[Open the Svelte demo →](/examples/svelte/){target="_self"} · [Source](https://github.com/gaurav552/makeNoise/tree/master/examples/svelte) · [Guide](/guide/svelte)

## Run them locally

```bash
git clone https://github.com/gaurav552/makeNoise.git
cd makeNoise
npm install
npm run dev          # test bench
npm run dev:react    # also dev:vue and dev:svelte
```

The examples import the library straight from `src/`, so edits to the source hot-reload in every one of them.
