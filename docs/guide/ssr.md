# Server-side rendering

Every entry point (`makenoise`, `makenoise/elements` and the React, Vue and Svelte bindings) can be imported on the server without errors:

- `<mn-player>` is only registered in the browser. On the server, importing `makenoise/elements` does nothing.
- The default `HowlerEngine` ignores every call when there is no `window`. A player created on the server keeps its state but plays nothing.
- The OS media controls are only connected where the Media Session API exists.

## Guidelines

**Create the player in a module of its own**, as on the client. In frameworks that render components on the server too, that module may be evaluated on the server once, and that module-level player is then shared by every request the server handles.

**Only call player actions in the browser:** in event handlers, effects and `onMounted`-style hooks, which don't run during server rendering. Then the server's copy stays empty, nothing leaks from one request to another, and the server-rendered HTML matches the first client render.

**Keep the queue a browser concern.** Server-rendered HTML doesn't carry the player's state to the client. To keep the queue across reloads, [save the session](./persistence) in the browser and restore it there.

## Next.js (App Router)

Mark the module that creates the player, and the components that use the hooks, as client code:

```ts
// app/player.ts
'use client';

import { createPlayer } from 'makenoise';
import 'makenoise/elements';

export const player = createPlayer();
```

```tsx
// app/now-playing.tsx
'use client';

import { usePlayer, usePlayerState } from 'makenoise/react';
import './player';

export function NowPlaying() {
  const player = usePlayer();
  const playing = usePlayerState((s) => s.playing);
  return <button onClick={player.toggle}>{playing ? 'Pause' : 'Play'}</button>;
}
```

```tsx
// app/layout.tsx
import type { ReactNode } from 'react';
import { NowPlaying } from './now-playing';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <NowPlaying />
        <mn-player />
      </body>
    </html>
  );
}
```

Putting the player UI in the root layout keeps it mounted across route changes. With TypeScript, declare `<mn-player>` for JSX as shown in [React](./react#using-mn-player).

## Restoring a session

A session saved in `localStorage` is only available in the browser, so restore it there, for example in an effect:

```tsx
'use client';

import { useEffect } from 'react';
import { player } from './player';

export function RestoreSession() {
  useEffect(() => {
    const saved = localStorage.getItem('player-session');
    if (saved) player.restore(JSON.parse(saved));
  }, []);
  return null;
}
```

Restoring after hydration also keeps the first client render identical to the server HTML.
