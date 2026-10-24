# Getting started

MakeNoise plays audio in single page applications. It keeps a play queue, talks to the browser through [Howler.js](https://howlerjs.com), and comes with a small corner player, `<mn-player>`. You can use that player, build your own UI on top of the store, or do both.

## Install

```bash
npm install makenoise
```

Howler.js is a dependency and is installed with it. React, Vue and Svelte are optional peer dependencies: install the one you use (React 18+, Vue 3.3+ or Svelte 5.7+).

The package has five entry points:

| Import | Contents |
|---|---|
| `makenoise` | `createPlayer`, `bindKeyboard`, `HowlerEngine`, the store and all types |
| `makenoise/elements` | Registers `<mn-player>` when imported |
| `makenoise/react` | [React hooks](./react) |
| `makenoise/vue` | [Vue composables](./vue) |
| `makenoise/svelte` | [Svelte 5 helpers](./svelte) |

## Create the player once

Create the player in a module of its own, outside any component. A player created inside a component would be recreated, and would stop playing, every time the component remounts or the route changes.

```ts
// player.ts
import { createPlayer } from 'makenoise';
import 'makenoise/elements'; // registers <mn-player>

export const player = createPlayer();
```

The first player you create becomes the default player. `<mn-player>` and the framework bindings find it by themselves, so there is nothing to wire up.

`createPlayer()` takes [options](/api/player#createplayer-options) for the initial volume, shuffle and repeat modes, error handling, preloading and the audio engine.

## Add the player UI

Put `<mn-player>` anywhere in your page. It positions itself in a corner and stays hidden while the queue is empty.

```html
<mn-player></mn-player>
```

See [The player UI](./player-ui) for its attributes and styling. If you want to build a completely different UI, leave it out and use the [store and actions](/api/player) directly.

## Play something

A track is a plain object with an `id` and a `src`. Everything else is optional.

```ts
import type { Track } from 'makenoise';
import { player } from './player';

const song: Track = { id: '1', src: '/song.mp3', title: 'Song', artist: 'Artist' };

// Play one file
player.play(song);

// Play a playlist from its 3rd track. Your array is copied, never modified.
player.play(playlist.tracks, { startIndex: 2 });

// Shuffle-play a playlist. It starts on a random track.
player.play(playlist.tracks, { shuffle: true });

// Add to the queue without interrupting what's playing
player.addToQueue(song);
player.playNext(song);
```

`play(tracks)` replaces the queue. To queue tracks without replacing anything, use `addToQueue()` or `playNext()`.

## React to changes

The player has two stores. `player.state` changes on discrete events: the track, the queue, play and pause, settings. `player.progress` changes about four times a second while playing.

```ts
player.subscribe((state) => {
  playButton.textContent = state.playing ? 'Pause' : 'Play';
  titleEl.textContent = state.current?.track.title ?? '';
});

player.progress.subscribe(({ currentTime, duration }) => {
  seekBar.max = String(duration);
  seekBar.value = String(currentTime);
});

player.on('trackend', (item) => scrobble(item.track));
```

`subscribe()` calls the listener right away and then on every change. Each subscription returns a function that removes it. The framework bindings wrap all of this for you: see [React](./react), [Vue](./vue) and [Svelte](./svelte).

## Without a bundler

The build also produces `dist/makenoise.iife.js`, a single file with the core, Howler and `<mn-player>` bundled together. Loading it with a `<script>` tag registers `<mn-player>` and exposes everything from `makenoise` and `makenoise/elements` on `window.MakeNoise`.

```html
<script src="makenoise.iife.js"></script>

<mn-player></mn-player>
<button id="start">Play</button>

<script>
  const player = MakeNoise.createPlayer();

  document.querySelector('#start').addEventListener('click', () => {
    player.play([
      { id: '1', src: '/audio/one.mp3', title: 'One' },
      { id: '2', src: '/audio/two.mp3', title: 'Two' },
    ]);
  });
</script>
```

Copy the file from the package's `dist/` folder, or run `npm run build` in the repository to produce it.

## Next steps

- [Concepts](./concepts): tracks, queue entries, and how shuffle and repeat behave.
- [The player UI](./player-ui): attributes, colors and styling of `<mn-player>`.
- [Keyboard shortcuts](./keyboard), [saving the session](./persistence) and [server-side rendering](./ssr).
