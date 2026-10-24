# Vue

`makenoise/vue` provides composables that turn the player's stores into read-only refs. Vue 3.3 or later is required.

## Setup

Create the player once, in a module of its own, outside any component:

```ts
// player.ts
import { createPlayer } from 'makenoise';
import 'makenoise/elements'; // registers <mn-player>, if you use it

export const player = createPlayer();
```

Import it before mounting the app. The composables find the first player created by themselves:

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import './player';

createApp(App).mount('#app');
```

If no player exists when a composable runs, it throws an error that says so.

### Providing a different player (optional)

To give the whole app a specific player, provide it with `playerKey`:

```ts
import { createApp } from 'vue';
import { playerKey } from 'makenoise/vue';
import App from './App.vue';
import { player } from './player';

createApp(App).provide(playerKey, player).mount('#app');
```

To give one component and its descendants a different player, call `providePlayer()` in its setup:

```vue
<script setup lang="ts">
import { providePlayer } from 'makenoise/vue';
import { previewPlayer } from './preview-player';

providePlayer(previewPlayer);
</script>
```

## `usePlayer()`

Returns the player, for calling actions: the provided player if there is one, else the default player.

```vue
<script setup lang="ts">
import { usePlayer } from 'makenoise/vue';
import type { Track } from 'makenoise';

defineProps<{ tracks: Track[] }>();
const player = usePlayer();
</script>

<template>
  <button @click="player.play(tracks)">Play all</button>
</template>
```

## `usePlayerState(selector?)`

Without a selector, returns a `Readonly<Ref<PlayerState>>` that updates on every state change. With a selector, the ref only updates when the selected value changes:

```vue
<script setup lang="ts">
import { usePlayer, usePlayerState } from 'makenoise/vue';

const player = usePlayer();
const playback = usePlayerState();                              // Readonly<Ref<PlayerState>>
const title = usePlayerState((s) => s.current?.track.title);   // Readonly<Ref<string | undefined>>
</script>

<template>
  <button @click="player.toggle()">
    {{ playback.playing ? 'Pause' : 'Play' }} {{ title }}
  </button>
</template>
```

A queue list:

```vue
<script setup lang="ts">
import { usePlayer, usePlayerState } from 'makenoise/vue';

const player = usePlayer();
const queue = usePlayerState((s) => s.queue);
const currentIndex = usePlayerState((s) => s.currentIndex);
</script>

<template>
  <ol>
    <li v-for="(item, i) in queue" :key="item.qid" :aria-current="i === currentIndex">
      <button @click="player.jumpTo(item.qid)">{{ item.track.title }}</button>
      <button @click="player.remove(item.qid)">Remove</button>
    </li>
  </ol>
</template>
```

Use `item.qid` as the key: the same track can be in the queue more than once.

### Choosing selectors

The refs are shallow: they only notify when the value is a different value. A selector should return a value from the state (like `s.queue` or `s.current`) or a primitive. If it returns a new object or array, the ref updates on every state change:

```ts
// Avoid: a new object each time
const info = usePlayerState((s) => ({ playing: s.playing, title: s.current?.track.title }));

// Instead: one ref per value, or a computed over the full state
const playing = usePlayerState((s) => s.playing);
const title = usePlayerState((s) => s.current?.track.title);
```

The subscription ends when the component (or the surrounding effect scope) is disposed.

## `useProgress(selector?)`

A read-only ref to `{ currentTime, duration }` in seconds. It updates several times a second while playing, so use it only in the components that show time.

```vue
<script setup lang="ts">
import { usePlayer, useProgress } from 'makenoise/vue';

const player = usePlayer();
const progress = useProgress();
const seconds = useProgress((p) => Math.floor(p.currentTime)); // updates once a second
</script>

<template>
  <input
    type="range"
    min="0"
    step="any"
    :max="progress.duration"
    :value="progress.currentTime"
    @input="player.seek(Number(($event.target as HTMLInputElement).value))"
  />
  <span>{{ seconds }}s</span>
</template>
```

## `usePlayerEvent(event, handler)`

Subscribes to a [player event](/api/player#events). It unsubscribes when the component (or effect scope) is disposed, and also returns an unsubscribe function if you want to stop earlier.

```vue
<script setup lang="ts">
import { usePlayerEvent } from 'makenoise/vue';

usePlayerEvent('trackend', (item) => scrobble(item.track));

const stop = usePlayerEvent('error', (error) => {
  console.warn('Skipped:', error.message);
});
// stop() whenever you like
</script>
```

## Typed tracks

With a custom track type, pass it as a type argument: `usePlayer<MyTrack>()`, `usePlayerState<MyTrack>()` or `usePlayerEvent<'trackend', MyTrack>('trackend', …)`.

## Using `<mn-player>` {#using-mn-player}

Vue tries to resolve unknown tags as components. Tell the template compiler that tags starting with `mn-` are custom elements:

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: { isCustomElement: (tag) => tag.startsWith('mn-') },
      },
    }),
  ],
});
```

Then use it in any template:

```vue
<template>
  <RouterView />
  <mn-player position="bottom-right" always-visible />
</template>
```

In Nuxt, the same option goes under `vue.compilerOptions.isCustomElement` in `nuxt.config.ts`. See also [Server-side rendering](./ssr).
