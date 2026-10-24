# Player API

Everything on this page is exported from `makenoise`.

## `createPlayer(options?)`

```ts
function createPlayer<T extends Track = Track>(options?: PlayerOptions): Player<T>;
```

Creates a player. The first player created becomes the default player, which `<mn-player>` and the framework bindings use unless told otherwise.

```ts
import { createPlayer, HowlerEngine } from 'makenoise';

export const player = createPlayer({
  volume: 0.8,
  repeat: 'all',
  preloadNext: 30,
  engine: new HowlerEngine({ html5: true }),
});
```

### Options

| Option | Type | Default | |
|---|---|---|---|
| `volume` | `number` | `1` | Initial volume, 0 to 1 |
| `muted` | `boolean` | `false` | Start muted |
| `rate` | `number` | `1` | Initial playback rate, 0.5 to 4 |
| `shuffle` | `boolean` | `false` | Initial shuffle mode |
| `repeat` | `'off' \| 'all' \| 'one'` | `'off'` | Initial repeat mode |
| `skipOnError` | `boolean` | `true` | Skip to the next track when one fails to load |
| `restartThreshold` | `number` | `3` | Seconds into a track after which `previous()` restarts it instead of going back |
| `progressInterval` | `number` | `250` | Milliseconds between `progress` updates while playing |
| `preloadNext` | `number \| false` | `20` | Start fetching the next track this many seconds before the current one ends. `false` turns it off. |
| `mediaSession` | `boolean` | `true` | Connect to OS media controls, the lock screen and media keys |
| `engine` | `AudioEngine` | `new HowlerEngine()` | The audio backend. See [Audio engine](./engine). |
| `random` | `() => number` | `Math.random` | Random source for shuffling. Useful for deterministic tests. |

Out-of-range `volume` and `rate` values are clamped, here and in `setVolume()` / `setRate()`.

## Playback

| Method | |
|---|---|
| `play()` | Resume. If nothing is current, start the queue from its first entry. After the queue ended, play what was added since, or start over. After an error, retry the current track. |
| `play(tracks, options?)` | Replace the queue with one track or an array and play it. Your array is copied, never modified. |
| `pause()` | Pause. |
| `toggle()` | Pause if playing (or about to play), else `play()`. |
| `stop()` | Pause and rewind the current track to 0. |
| `next()` | Go to the next entry. At the end with repeat `off`, the queue ends. |
| `previous()` | Restart the track if more than `restartThreshold` seconds in, else go to the previous entry. |
| `jumpTo(qid)` | Make a queue entry current and play it. On the current entry, restart it. |
| `seek(seconds)` | Seek within the current track. Clamped to `0..duration`. |

### `PlayOptions`

```ts
player.play(tracks, { startIndex: 2, shuffle: false, autoplay: true });
```

| Option | Default | |
|---|---|---|
| `startIndex` | `0` | Index into the given tracks to start at. With `shuffle` and no `startIndex`, a random track starts. |
| `shuffle` | the current shuffle setting | Turn shuffle on or off for this queue |
| `autoplay` | `true` | With `false`, the first track is loaded paused |

## Settings

| Method | |
|---|---|
| `setVolume(volume)` | 0 to 1. Setting a volume above 0 also unmutes. |
| `setMuted(muted)` | |
| `toggleMute()` | |
| `setRate(rate)` | Playback rate, 0.5 to 4 |
| `setShuffle(shuffle)` | See [What you see is what plays](/guide/concepts#what-you-see-is-what-plays) |
| `toggleShuffle()` | |
| `setRepeat(repeat)` | `'off'`, `'all'` or `'one'` |
| `cycleRepeat()` | off → all → one → off |

## Queue

Every queue operation takes a `qid` (the id of a queue entry), never an index. See [Tracks and queue entries](/guide/concepts#tracks-and-queue-entries).

| Method | |
|---|---|
| `addToQueue(tracks)` | Append one track or an array to the end. If the queue was empty, the first new entry becomes current (loaded, paused). |
| `playNext(tracks)` | Insert right after the current entry. Same rule for an empty queue. |
| `remove(qid \| qids)` | Remove one or several entries. If the current entry is removed, the next remaining one becomes current. |
| `move(qid, toIndex)` | Move an entry so it ends up at `toIndex` in `state.queue`. The current entry stays current. |
| `clearUpcoming()` | Remove everything after the current entry. |
| `clearQueue()` | Stop and empty the queue. Shuffle and repeat are kept. |

```ts
const { queue, currentIndex } = player.getState();
const upNext = queue.slice(currentIndex + 1);

player.move(upNext[2].qid, currentIndex + 1); // make it play next
player.remove(upNext.map((item) => item.qid)); // same as clearUpcoming()
```

## Session

| Method | |
|---|---|
| `serialize()` | Returns a `PlayerSession`: a JSON-friendly snapshot of the queue, position and settings. |
| `restore(session, { autoplay? })` | Loads a session from `serialize()`. Loads paused unless `autoplay` is `true`. |
| `destroy()` | Stops playback, releases the audio, disconnects media controls and removes all event handlers. If this was the default player, there is no default player afterwards. |

See [Saving the session](/guide/persistence) for the session format and examples.

## State

```ts
player.state: ReadableStore<PlayerState>
player.getState(): PlayerState            // same as player.state.get()
player.subscribe(listener): () => void    // same as player.state.subscribe(listener)
```

`state` changes on discrete events only: the track, the queue, play and pause, and settings. It is safe to bind your whole UI to it.

### `PlayerState`

```ts
interface PlayerState<T extends Track = Track> {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  /** Intent to play: true while loading, too. Use it for the play/pause button. */
  playing: boolean;
  current: QueueItem<T> | null;
  /** Index of `current` in `queue`, or -1. */
  currentIndex: number;
  /** The queue in play order: history, then the current entry, then up next. */
  queue: readonly QueueItem<T>[];
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  /** 0..1 */
  volume: number;
  muted: boolean;
  rate: number;
  /** The browser blocked autoplay; playback starts on the next user interaction. */
  blocked: boolean;
  error: PlayerError | null;
}

interface PlayerError {
  /** 'load': the file could not be fetched or decoded. Blocked autoplay is not an error; see `blocked`. */
  type: 'load';
  message: string;
  item: QueueItem | null;
}
```

See [Status and `playing`](/guide/concepts#status-and-playing) for what each status means.

## Progress

```ts
player.progress: ReadableStore<ProgressState>
```

### `ProgressState`

```ts
interface ProgressState {
  /** Seconds */
  currentTime: number;
  /** Seconds; 0 until known */
  duration: number;
}
```

`progress` updates every `progressInterval` ms (250 by default) while playing, and on seek, pause and track changes. Subscribe to it only where you show time. Until a track has loaded, `duration` is the track's own `duration` field if you provided one, else `0`.

## Events

```ts
player.on(event, handler): () => void   // returns an unsubscribe function
player.once(event, handler): () => void // runs at most once
player.off(event, handler): void
```

| Event | Arguments | When |
|---|---|---|
| `trackchange` | `current: QueueItem \| null, previous: QueueItem \| null` | The current entry changed |
| `queuechange` | `queue: readonly QueueItem[]` | Entries were added, removed or reordered |
| `play` | `item: QueueItem` | Audio started playing |
| `pause` | `item: QueueItem` | Playback paused |
| `trackend` | `item: QueueItem` | A track played to its end by itself |
| `queueend` | none | The last track ended and there is nothing more to play |
| `seek` | `time: number` | `seek()` moved the position |
| `error` | `error: PlayerError` | A track failed to load |
| `blocked` | none | The browser blocked autoplay. Playback starts on the next user interaction. |

```ts
const off = player.on('trackchange', (current, previous) => {
  console.log(`${previous?.track.title} → ${current?.track.title}`);
});

player.once('queueend', () => showRecommendations());
```

A handler that throws is logged to the console and never breaks playback or other handlers.

## Store contract

`player.state` and `player.progress` are `ReadableStore`s:

```ts
interface ReadableStore<S> {
  get(): S;                                          // the current snapshot
  subscribe(listener: (state: S) => void): () => void; // calls listener now and on every change
  listen(listener: (state: S) => void): () => void;    // calls listener on every change only
}
```

Snapshots are immutable: a new object when something changed, the same object otherwise. `subscribe` matches the Svelte store contract, so `$player` works in Svelte. See [Other frameworks](/guide/other-frameworks) for adapting the stores elsewhere.

## Other exports

| Export | |
|---|---|
| `bindKeyboard`, `defaultKeys` | [Keyboard shortcuts](/guide/keyboard) |
| `HowlerEngine` | [The default audio engine](./engine#howlerengine) |
| `getDefaultPlayer()` | The default player, or `null` |
| `setDefaultPlayer(player)` | Replace the default player (or clear it with `null`). `<mn-player>` elements without an assigned player and the React hooks follow the change. The Vue and Svelte helpers look up the default player once, when the component is set up. |
| `onDefaultPlayer(listener)` | Calls `listener` whenever the default player changes. Returns an unsubscribe function. |
| `createStore(initial)` | The store implementation, for your own state |
| `queue` | The pure queue functions the player is built on (namespace) |

Types: `Track`, `QueueItem`, `RepeatMode`, `PlaybackStatus`, `PlayerError`, `PlayerState`, `ProgressState`, `Player`, `PlayerOptions`, `PlayOptions`, `PlayerEvents`, `PlayerSession`, `ReadableStore`, `QueueState`, `KeyboardAction`, `KeyboardOptions`, `AudioEngine`, `EngineHandlers`, `EngineSource`, `HowlerEngineOptions`.
