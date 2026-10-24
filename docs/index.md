---
layout: home

hero:
  name: MakeNoise
  text: An audio player for single page applications
  tagline: A real play queue, a small corner player and bindings for React, Vue and Svelte. Powered by Howler.js.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: API
      link: /api/player
    - theme: alt
      text: Live examples
      link: /examples/

features:
  - title: Your app owns the playlists
    details: MakeNoise only receives copies of your tracks. It never modifies them and never saves anything on its own.
    link: /guide/concepts
    linkText: Tracks and queue entries
  - title: What you see is what plays
    details: The queue is always the real play order, history then current then up next, even with shuffle and repeat on.
    link: /guide/concepts#what-you-see-is-what-plays
    linkText: How the queue works
  - title: Works in any framework
    details: The core is plain TypeScript with a tiny store. React, Vue and Svelte bindings are included, and others can use the store directly.
    link: /guide/react
    linkText: Framework guides
  - title: A small corner player
    details: "<code>&lt;mn-player&gt;</code> is a 48px medallion that unfolds into a compact card with a seek bar, controls and a reorderable queue."
    link: /guide/player-ui
    linkText: The player UI
---

## Try it

This page runs the library from source. Press the button, then hover the medallion in the bottom-left corner to open the card.

<ClientOnly>
  <LiveDemo />
</ClientOnly>

```ts
import { createPlayer } from 'makenoise';
import 'makenoise/elements'; // registers <mn-player>

export const player = createPlayer();

player.play(playlist.tracks);
```

```html
<mn-player></mn-player>
```
