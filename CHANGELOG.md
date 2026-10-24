# Changelog

## 0.1.1

- **Types:** `PlayerError['type']` is now just `'load'`. The `'play'` member was never emitted: when the browser refuses to start playback, the player sets `state.blocked` and emits `blocked` instead. If you compared `error.type === 'play'`, remove that branch.
- **Docs:** `state.error` describes the current entry and is cleared by the next successful load, so after a skip it is already gone. Show "skipped" notices from the `error` event. This was always the behaviour; the docs now say so.
- **Docs:** for a custom track type in event handlers, annotate the handler's parameter (`(item: QueueItem<MyTrack>) => …`) instead of naming the event twice as a type argument. A type test now covers this for React, Vue and Svelte.
- The npm page now shows the current README (install, CDN and badges).

## 0.1.0

First release: queue, player, Howler engine, Media Session, `<mn-player>`, React / Vue / Svelte bindings, keyboard shortcuts, next-track preloading and SSR safety.
