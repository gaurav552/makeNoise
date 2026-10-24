# React

`makenoise/react` provides hooks over the player's stores. They are built on `useSyncExternalStore`, so they work with concurrent rendering. React 18 or later is required.

## Setup

Create the player once, in a module of its own, outside any component:

```ts
// player.ts
import { createPlayer } from 'makenoise';
import 'makenoise/elements'; // registers <mn-player>, if you use it

export const player = createPlayer();
```

Import that module before rendering, for example from your entry file. The hooks find the first player created by themselves:

```tsx
// main.tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './player';

createRoot(document.getElementById('root')!).render(<App />);
```

If no player exists when a hook runs, it throws an error that says so.

### `PlayerProvider` (optional)

To give part of the app a different player, wrap it in a provider. Hooks inside use the nearest provided player:

```tsx
import { PlayerProvider } from 'makenoise/react';
import { previewPlayer } from './preview-player';

export function PreviewPane() {
  return (
    <PlayerProvider player={previewPlayer}>
      <PreviewControls />
    </PlayerProvider>
  );
}
```

You can also wrap the whole app in `<PlayerProvider player={player}>` just to make the dependency explicit.

## `usePlayer()`

Returns the player, for calling actions. It doesn't subscribe to anything, so it never causes a re-render by itself.

```tsx
import { usePlayer } from 'makenoise/react';
import type { Track } from 'makenoise';

export function PlayButton({ tracks }: { tracks: Track[] }) {
  const player = usePlayer();
  return <button onClick={() => player.play(tracks)}>Play all</button>;
}
```

Actions don't rely on `this`, so you can pass them directly: `onClick={player.toggle}`. The exception is `play`: `onClick={player.play}` would pass the click event as the tracks to play. Wrap it instead: `onClick={() => player.play()}`.

## `usePlayerState(selector?)`

Without a selector, returns the whole [`PlayerState`](/api/player#playerstate) and re-renders on every state change. With a selector, it re-renders only when the selected value changes:

```tsx
import { usePlayer, usePlayerState } from 'makenoise/react';

export function NowPlaying() {
  const player = usePlayer();
  const title = usePlayerState((s) => s.current?.track.title); // re-renders only when the title changes
  const playing = usePlayerState((s) => s.playing);

  return (
    <button onClick={player.toggle}>
      {playing ? 'Pause' : 'Play'} {title}
    </button>
  );
}
```

```tsx
export function QueueList() {
  const player = usePlayer();
  const queue = usePlayerState((s) => s.queue);
  const currentIndex = usePlayerState((s) => s.currentIndex);

  return (
    <ol>
      {queue.map((item, i) => (
        <li key={item.qid} aria-current={i === currentIndex}>
          <button onClick={() => player.jumpTo(item.qid)}>{item.track.title}</button>
          <button onClick={() => player.remove(item.qid)}>Remove</button>
        </li>
      ))}
    </ol>
  );
}
```

Use `item.qid` as the React key: the same track can be in the queue more than once.

### Choosing selectors

A selector should return a value from the state (like `s.queue` or `s.current`) or a primitive (like `s.playing` or `s.queue.length`). The state is an immutable snapshot, so those values only change identity when they really changed.

Don't return a new object or array from a selector:

```tsx
// Avoid: a new object on every state change, so the component re-renders every time
const { playing, title } = usePlayerState((s) => ({ playing: s.playing, title: s.current?.track.title }));

// Instead: one hook per value
const playing = usePlayerState((s) => s.playing);
const title = usePlayerState((s) => s.current?.track.title);
```

With a custom track type, pass it as a type argument: `usePlayerState<MyTrack>()` or `usePlayer<MyTrack>()`. For `usePlayerEvent`, annotate the handler's parameter and the track type is inferred: `usePlayerEvent('trackend', (item: QueueItem<MyTrack>) => …)`.

## `useProgress(selector?)`

Returns `{ currentTime, duration }` in seconds. It updates several times a second while playing (every 250 ms by default), so call it only in the components that show time, and keep those components small.

```tsx
import { usePlayer, useProgress } from 'makenoise/react';

export function SeekBar() {
  const player = usePlayer();
  const { currentTime, duration } = useProgress();

  return (
    <input
      type="range"
      min={0}
      max={duration}
      step="any"
      value={currentTime}
      onChange={(e) => player.seek(Number(e.target.value))}
    />
  );
}
```

Select a coarser value to re-render less often:

```tsx
const seconds = useProgress((p) => Math.floor(p.currentTime)); // re-renders once a second
```

## `usePlayerEvent(event, handler)`

Subscribes to a [player event](/api/player#events) for the component's lifetime. The latest `handler` is always called, so it can use current props and state without re-subscribing.

```tsx
import { usePlayerEvent } from 'makenoise/react';

export function Scrobbler({ userId }: { userId: string }) {
  usePlayerEvent('trackend', (item) => scrobble(userId, item.track));
  usePlayerEvent('error', (error) => console.warn('Skipped:', error.message));
  return null;
}
```

## Using `<mn-player>` {#using-mn-player}

`<mn-player>` works in JSX like any HTML element:

```tsx
<mn-player position="bottom-right" accent="blue" always-visible />
```

With TypeScript, declare the element once so JSX accepts it:

```ts
// mn-player.d.ts
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { AccentName, MakeNoisePlayerElement } from 'makenoise/elements';

interface MnPlayerAttributes extends DetailedHTMLProps<HTMLAttributes<MakeNoisePlayerElement>, MakeNoisePlayerElement> {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  theme?: 'auto' | 'light' | 'dark';
  accent?: AccentName;
  artwork?: boolean;
  quiet?: boolean;
  keyboard?: boolean | 'global';
  'always-visible'?: boolean;
  'no-font-download'?: boolean;
  'no-color-picker'?: boolean;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'mn-player': MnPlayerAttributes;
    }
  }
}
```

## Next.js and other SSR setups

See [Server-side rendering](./ssr).
