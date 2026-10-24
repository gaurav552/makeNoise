# Other frameworks

Solid, Angular, Preact, Lit, or no framework at all: the player's stores follow a tiny contract that anything can consume.

## The store contract

`player.state` and `player.progress` are `ReadableStore`s:

```ts
interface ReadableStore<S> {
  /** The current snapshot. */
  get(): S;
  /** Calls `listener` now and on every change. Returns an unsubscribe function. */
  subscribe(listener: (state: S) => void): () => void;
  /** Calls `listener` on every change only. Returns an unsubscribe function. */
  listen(listener: (state: S) => void): () => void;
}
```

Snapshots are immutable. Every change produces a new object, and nothing changed means the same object. Inside a snapshot, parts that didn't change keep their identity too: `state.queue` is the same array until the queue changes. That makes `===` comparisons safe for skipping work.

`subscribe` follows the Svelte store contract. `listen` plus `get` is the shape React's `useSyncExternalStore` expects.

The player itself also has `getState()` (same as `state.get()`) and `subscribe()` (same as `state.subscribe()`).

## Examples

### Solid

```ts
import { createSignal, onCleanup } from 'solid-js';
import type { ReadableStore } from 'makenoise';

export function fromStore<S>(store: ReadableStore<S>) {
  const [value, setValue] = createSignal(store.get(), { equals: false });
  onCleanup(store.listen((next) => setValue(() => next)));
  return value;
}

// In a component:
// const playback = fromStore(player.state);
// <button onClick={() => player.toggle()}>{playback().playing ? 'Pause' : 'Play'}</button>
```

### Angular (signals)

```ts
import { DestroyRef, inject, signal } from '@angular/core';
import type { ReadableStore } from 'makenoise';

export function fromStore<S>(store: ReadableStore<S>) {
  const value = signal(store.get());
  inject(DestroyRef).onDestroy(store.listen((next) => value.set(next)));
  return value.asReadonly();
}
```

### Plain DOM

```ts
import { player } from './player';

const button = document.querySelector<HTMLButtonElement>('#play')!;
button.addEventListener('click', () => player.toggle());

player.subscribe((state) => {
  button.textContent = state.playing ? 'Pause' : 'Play';
});
```

## Events

Events are separate from the stores. Use `player.on(event, handler)`, which returns an unsubscribe function, and call it when your component is destroyed. See [Events](/api/player#events).

## Your own stores

`createStore` is exported too, if you want the same contract for your own state:

```ts
import { createStore } from 'makenoise';

const ui = createStore({ panelOpen: false });
ui.update({ panelOpen: true }); // shallow merge; listeners run only if a value changed
ui.readonly;                    // the same store without update()
```
