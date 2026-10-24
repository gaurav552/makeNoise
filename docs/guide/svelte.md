# Svelte

`makenoise/svelte` provides helpers for Svelte 5 (5.7 or later) in runes mode. The player and its stores also follow the Svelte store contract, so `$player` works without any helper.

## Setup

Create the player once, in a module of its own, outside any component:

```ts
// player.ts
import { createPlayer } from 'makenoise';
import 'makenoise/elements'; // registers <mn-player>, if you use it

export const player = createPlayer();
```

Import it before mounting. The helpers find the first player created by themselves:

```ts
// main.ts
import { mount } from 'svelte';
import App from './App.svelte';
import './player';

mount(App, { target: document.getElementById('app')! });
```

If no player exists when a helper runs, it throws an error that says so.

### `setPlayer()` (optional)

To give a component and its descendants a different player, call `setPlayer()` during component initialisation. It uses Svelte context:

```svelte
<script lang="ts">
  import { setPlayer } from 'makenoise/svelte';
  import { previewPlayer } from './preview-player';

  let { children } = $props();
  setPlayer(previewPlayer);
</script>

{@render children()}
```

## `getPlayer()`

Returns the player from `setPlayer()`, else the default player. Call it during component initialisation (at the top level of `<script>`), like any Svelte context function.

```svelte
<script lang="ts">
  import { getPlayer } from 'makenoise/svelte';
  import type { Track } from 'makenoise';

  let { tracks }: { tracks: Track[] } = $props();
  const player = getPlayer();
</script>

<button onclick={() => player.play(tracks)}>Play all</button>
```

## `usePlayerState(player?)`

Returns an object whose `current` property is the latest [`PlayerState`](/api/player#playerstate). Reading `.current` in markup, `$derived` or `$effect` is reactive.

```svelte
<script lang="ts">
  import { getPlayer, usePlayerState } from 'makenoise/svelte';

  const player = getPlayer();
  const playback = usePlayerState();
  const title = $derived(playback.current.current?.track.title);
</script>

<button onclick={player.toggle}>
  {playback.current.playing ? 'Pause' : 'Play'} {title}
</button>

<ol>
  {#each playback.current.queue as item, i (item.qid)}
    <li aria-current={i === playback.current.currentIndex}>
      <button onclick={() => player.jumpTo(item.qid)}>{item.track.title}</button>
    </li>
  {/each}
</ol>
```

::: warning Don't name it `state`
`const state = usePlayerState()` clashes with the `$state` rune in runes mode. Use another name, such as `playback`.
:::

It only subscribes to the store while something reactive is reading `.current`, so there is nothing to clean up.

There is no selector argument. To narrow what an effect depends on, read the part you need with `$derived`, as with `title` above: Svelte only re-runs things whose derived value actually changed.

Pass a player to use a specific one instead of the context or default player: `usePlayerState(otherPlayer)`.

## `useProgress(player?)`

The same for `{ currentTime, duration }`. It updates several times a second while playing, so read it only where you show time.

```svelte
<script lang="ts">
  import { getPlayer, useProgress } from 'makenoise/svelte';

  const player = getPlayer();
  const progress = useProgress();
</script>

<input
  type="range"
  min="0"
  step="any"
  max={progress.current.duration}
  value={progress.current.currentTime}
  oninput={(e) => player.seek(Number(e.currentTarget.value))}
/>
```

## `onPlayerEvent(event, handler, player?)`

Subscribes to a [player event](/api/player#events) until the component is destroyed. Call it during component initialisation.

```svelte
<script lang="ts">
  import { onPlayerEvent } from 'makenoise/svelte';

  onPlayerEvent('trackend', (item) => scrobble(item.track));
  onPlayerEvent('error', (error) => console.warn('Skipped:', error.message));
</script>
```

With a custom track type, pass your typed player as the third argument, or annotate the handler's parameter: `onPlayerEvent('trackend', (item: QueueItem<MyTrack>) => …)`. Either way the track type is inferred.

## Store syntax

The player is a Svelte store of its state, and `player.state` and `player.progress` are stores too. The `$` prefix works on them directly, as long as they are in scope as top-level variables:

```svelte
<script lang="ts">
  import { player } from './player';
  const progress = player.progress;
</script>

<p>{$player.current?.track.title ?? 'Nothing playing'}</p>
<p>{Math.floor($progress.currentTime)} / {Math.floor($progress.duration)} s</p>
```

## Using `<mn-player>`

`<mn-player>` works in Svelte markup without configuration:

```svelte
<mn-player position="bottom-right" always-visible></mn-player>
```

For SvelteKit, see [Server-side rendering](./ssr).
