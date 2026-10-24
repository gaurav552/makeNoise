# Concepts

## Your app owns the playlists

MakeNoise has no playlist model. Your application keeps its playlists however it likes and hands tracks to the player when the user presses play. The player copies the array it receives and never modifies your track objects. It also stores nothing: whether and where the queue is saved is up to you (see [Saving the session](./persistence)).

## Tracks and queue entries

A `Track` is your data:

```ts
interface Track {
  id: string;                        // your id; need not be unique within a queue
  src: string | readonly string[];   // several URLs are tried in order, e.g. ['a.webm', 'a.mp3']
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  duration?: number;                 // seconds, shown until the real duration is loaded
  format?: string | readonly string[];
}
```

Add your own fields by passing your type to `createPlayer`. It flows through the state, events and actions:

```ts
import { createPlayer, type Track } from 'makenoise';

interface MyTrack extends Track {
  albumId: string;
  explicit: boolean;
}

export const player = createPlayer<MyTrack>();

player.on('trackchange', (current) => {
  console.log(current?.track.albumId);
});
```

When a track enters the queue it is wrapped in a `QueueItem`:

```ts
interface QueueItem<T extends Track = Track> {
  readonly qid: string;
  readonly track: T;
}
```

The `qid` is unique per entry. The same song can be queued twice, and each copy can still be removed, moved or jumped to on its own. Every queue operation takes a `qid`, never an index:

```ts
const { queue } = player.getState();

player.jumpTo(queue[3].qid);
player.remove(queue[5].qid);
player.move(queue[1].qid, 4);   // ends up at index 4 of state.queue
```

::: tip URLs without an extension
Howler picks the decoder from the file extension. A URL like `/api/stream/42` needs a format hint: `{ id: '42', src: '/api/stream/42', format: 'mp3' }`.
:::

## What you see is what plays

`state.queue` is always the real play order: **history, then the current entry, then up next**. `state.currentIndex` marks the current entry (or is `-1`). If you render `state.queue` in order, the list on screen matches what the player will do.

| Action | Effect |
|---|---|
| Shuffle on | History and the current track stay put. *Up next* is shuffled, and the original order is remembered. |
| Shuffle off | The original order is restored. Entries removed in the meantime stay removed; entries added keep their place. |
| Repeat `off` | Stops after the last track (`status: 'ended'`). Pressing play starts over. |
| Repeat `all` | Wraps to the first track. When shuffled, it reshuffles for each pass, and the track that just played never comes up first again. |
| Repeat `one` | The track restarts when it ends, but `next()` still moves on. |
| `previous()` | More than 3 seconds in (`restartThreshold`): restart the track. Otherwise go to the previous one. On the first track it restarts, or wraps to the last track when repeat is on. |
| Remove the current entry | The next remaining entry becomes current, and keeps playing if the player was playing. If nothing comes after it, the player goes idle. |
| `playNext()` | Inserts right after the current entry. |
| `clearUpcoming()` | Removes everything after the current entry. |
| `clearQueue()` | Stops and empties the queue. Shuffle and repeat settings are kept. |
| A track fails to load | An `error` event fires and the player skips ahead. See below. |

`play(tracks, { shuffle: true })` turns shuffle on and starts on a random track. With `startIndex` as well, that track plays first and the rest are shuffled. Without the `shuffle` option, `play()` keeps the current shuffle setting.

## Status and `playing`

`state.status` describes the audio:

| Status | Meaning |
|---|---|
| `idle` | Nothing loaded |
| `loading` | The current track is loading |
| `playing` | Audio is audible |
| `paused` | Paused by the user, or not started yet |
| `ended` | The queue played to the end |
| `error` | The current track failed and could not be skipped |

`state.playing` is the player's *intent* to play. It is already `true` while a track is still loading, so use it for the play/pause button; using `status === 'playing'` would make the button flicker on every track change.

## Errors and skipping

When a track fails to load, the player sets `state.error`, emits an `error` event and, with `skipOnError` on (the default), moves to the next entry, if there is one. It counts consecutive failures and gives up once every entry in the queue has failed in a row, instead of looping forever. When it can't skip, `status` becomes `'error'`. Calling `play()` after that retries the current track.

```ts
player.on('error', (error) => {
  showToast(`Skipped ${error.item?.track.title ?? 'a track'}: ${error.message}`);
});
```

With `createPlayer({ skipOnError: false })` the player stops on the failed track with `status: 'error'`.

`state.error` describes the current entry, so the next successful load clears it. When the player skips a broken track, `state.error` is already gone by the time the next track plays: show "skipped" notices from the `error` event, as above, and use `state.error` for the case where playback stopped (`status: 'error'`).

A browser that refuses to start playback is not an error. It sets `state.blocked` and emits `blocked`; see below.

## Autoplay blocking

Browsers may refuse to start audio that wasn't triggered by a user interaction, for example when you restore a session with `autoplay: true` on page load. When that happens:

- `state.blocked` becomes `true`, `state.playing` becomes `false` and `status` is `'paused'`,
- the `blocked` event fires,
- playback starts by itself on the next user interaction with the page (Howler unlocks the audio).

`<mn-player>` shows "Press play to start" when this happens. In your own UI, use `state.blocked` to show a hint:

```ts
player.on('blocked', () => {
  showHint('Click anywhere to start the music');
});
```

Calling `play()` from a click handler also clears it.

## Preloading the next track

Shortly before the current track ends, the player asks the engine to start fetching the next one, so it starts without a gap. The `preloadNext` option sets how many seconds before the end this happens (default `20`). `false` turns it off:

```ts
createPlayer({ preloadNext: 30 });    // start earlier, for slow connections
createPlayer({ preloadNext: false }); // never fetch ahead
```

The next track is re-checked on every progress update, so queue edits made after preloading are picked up. Nothing is preloaded when the next track can't be known in advance: at the end of the queue, on repeat `one`, and when a shuffled queue is about to wrap and reshuffle.

The default `HowlerEngine` supports preloading. A [custom engine](/api/engine) can implement the optional `preload()` method.

## OS media controls

With the default `mediaSession: true`, the player connects to the Media Session API: the track title, artist, album and artwork show up on the lock screen and in the OS media overlay, and hardware media keys work (play, pause, stop, previous, next, seek). Pass `mediaSession: false` to turn this off, for example when your app manages the media session itself.
