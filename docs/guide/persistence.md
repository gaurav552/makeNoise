# Saving the session

The library stores nothing by itself. Your app decides whether to save the queue and where: `localStorage`, IndexedDB, your server, or nowhere.

## `serialize()` and `restore()`

`player.serialize()` returns a plain, JSON-friendly snapshot of the queue and settings. `player.restore(session)` loads one back.

```ts
import type { PlayerSession } from 'makenoise';
import { player } from './player';

const KEY = 'player-session';

// Save
localStorage.setItem(KEY, JSON.stringify(player.serialize()));

// Restore
const saved = localStorage.getItem(KEY);
if (saved) player.restore(JSON.parse(saved) as PlayerSession);
```

`restore()` loads the current track **paused** at the saved position, so nothing starts playing on page load. Pass `{ autoplay: true }` to start playing:

```ts
player.restore(session, { autoplay: true });
```

Browsers usually block audio that starts without a user interaction. If that happens, the player sets `state.blocked` and starts on the next click or key press. See [Autoplay blocking](./concepts#autoplay-blocking).

## What a session contains

```ts
interface PlayerSession<T extends Track = Track> {
  version: 1;
  items: QueueItem<T>[];          // the queue in play order, with qids
  currentQid: string | null;
  originalOrder: string[] | null; // the order to restore when shuffle is turned off
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  position: number;               // seconds into the current track
  volume: number;
  muted: boolean;
  rate: number;
}
```

A few things to know:

- **Whole tracks are saved,** including your own fields. They must be JSON-serializable if you store the session as JSON. Large `artwork` data URLs make the session large; consider storing URLs instead.
- **Queue entry ids are kept.** A `qid` your app remembered before saving still points to the same entry after `restore()`.
- **Shuffle state survives.** The shuffled order and the original order are both restored, so turning shuffle off later still goes back to the original order.
- **Invalid data is tolerated.** A session whose `version` isn't `1` is ignored. Entries without a `qid` or `track` are dropped. If `currentQid` isn't in the queue, the first entry becomes current.
- **Restoring replaces** the queue and settings (volume, muted, rate, shuffle, repeat).

## When to save

`progress` changes several times a second, so don't save on every progress update. Save when the queue or settings change, and once more when the page is hidden, to capture the latest position:

```ts
import { player } from './player';

const KEY = 'player-session';

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(player.serialize()));
  } catch {
    // Storage full or unavailable: skip this save.
  }
}

// Restore before anything else touches the queue.
try {
  const saved = localStorage.getItem(KEY);
  if (saved) player.restore(JSON.parse(saved));
} catch {
  localStorage.removeItem(KEY);
}

player.state.listen(save);  // queue, current track, settings
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save();
});
```

`state.listen()` doesn't fire for playback position. It fires on play and pause, though, which also captures the position whenever the user pauses.

## Per-user sessions

Because the session is plain data, you can send it to your server to resume on another device:

```ts
await fetch('/api/me/player-session', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(player.serialize()),
});
```

Track URLs may need refreshing before you restore them elsewhere, for example signed URLs that expire. Map over `session.items` and replace `track.src` before calling `restore()`.
