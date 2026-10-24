# The player UI: `<mn-player>`

`<mn-player>` is a small player that lives in a corner of the page and stays out of the way. Import `makenoise/elements` once to register it:

```ts
import 'makenoise/elements';
```

```html
<mn-player position="bottom-right" accent="teal"></mn-player>
```

It uses the first player created with `createPlayer()`. If that player is created after the element is on the page, the element picks it up when it appears.

## How it behaves

- **Collapsed:** a 48px medallion with a play/pause button on a soft accent-tinted disc, inside a thin progress ring. After a few seconds without attention it fades back a little. When the track changes, its title shows beside the medallion for a moment.
- **Hover or keyboard focus:** it unfolds into a compact card with the title (up to two lines), a seek bar, previous/next, shuffle, repeat, volume and a queue button. The dot in the card's corner opens the color picker. Moving away folds it back, and <kbd>Escape</kbd> closes it. On touch screens, the first tap opens it.
- **Queue:** opens above the card and stays open until you close it. Drag the handle to reorder, or focus a row and use <kbd>Alt</kbd>+<kbd>↑</kbd> / <kbd>Alt</kbd>+<kbd>↓</kbd>. <kbd>Delete</kbd> removes the entry, <kbd>Enter</kbd> plays it. Played tracks are tucked away behind "Show N played".
- **Hidden** while the queue is empty, unless `always-visible` is set.

## Attributes

| Attribute | Values |
|---|---|
| `position` | `bottom-left` (default), `bottom-right`, `top-left`, `top-right` |
| `theme` | `auto` (default, follows the OS), `light`, `dark` |
| `always-visible` | Show the medallion even when nothing is queued |
| `quiet` | Don't show the title when the track changes |
| `accent` | `red` (default), `orange`, `green`, `teal`, `blue`, `purple` |
| `no-color-picker` | Hide the color picker. The listener's saved color is not restored either. |
| `artwork` | Show the current track's `artwork` in the medallion instead of the plain disc |
| `no-font-download` | Don't fetch Nunito Sans from Google Fonts (see [Fonts](#fonts)) |
| `keyboard` | Keyboard shortcuts while focus is in the player. `keyboard="global"` makes them page-wide. See [Keyboard shortcuts](./keyboard). |

Boolean attributes are on when present: `<mn-player always-visible quiet>`.

`no-color-picker` and `no-font-download` are read when the element is added to the page, so set them in your markup rather than toggling them later.

## Colors

There are six built-in pastel accents. Listeners can pick one from the dot in the card. Their choice:

- is saved in `localStorage` under the key `makenoise-accent`,
- takes priority over the `accent` attribute the next time the element is added to a page,
- fires an `accentchange` event, so your app can save it elsewhere too.

```ts
const element = document.querySelector('mn-player')!;

element.addEventListener('accentchange', (event) => {
  const { accent } = (event as CustomEvent<{ accent: string }>).detail;
  saveUserPreference('playerColor', accent); // 'red' | 'orange' | 'green' | 'teal' | 'blue' | 'purple'
});
```

The event bubbles and crosses shadow DOM boundaries.

With `no-color-picker`, the picker is hidden and only the `accent` attribute (or the `--mn-accent` property) decides.

The palette is exported as `accents` from `makenoise/elements`, with the `AccentName` type:

```ts
import { accents, type AccentName } from 'makenoise/elements';

accents.red;    // '#e3726c'
accents.orange; // '#eb9a5c'
accents.green;  // '#6fb98a'
accents.teal;   // '#5fb5b0'
accents.blue;   // '#6f9fe0'
accents.purple; // '#a68ad8'
```

## Styling

### Custom properties

Set `--mn-*` custom properties on the element. They override the built-in values:

```css
mn-player {
  --mn-accent: #2f6f5e;                    /* any color; overrides the accent attribute */
  --mn-font-title: 'Your Font', sans-serif;
  --mn-width: 360px;
  --mn-offset-x: 24px;
  --mn-offset-y: 24px;
}
```

| Property | Default | |
|---|---|---|
| `--mn-accent` | the `accent` color, `#e3726c` | Accent color |
| `--mn-accent-ink` | the accent darkened 40% on light themes; the accent itself on dark | Accent for text and icons |
| `--mn-surface` | `rgb(251 249 245 / 0.84)` | Translucent background; the page blurs through it |
| `--mn-surface-solid` | `#fbf9f5` | Background where `backdrop-filter` isn't supported |
| `--mn-text` | `#1e1b17` | Text color |
| `--mn-muted` | `rgb(30 27 23 / 0.6)` | Secondary text |
| `--mn-line` | `rgb(30 27 23 / 0.12)` | Borders and dividers |
| `--mn-hover` | `rgb(30 27 23 / 0.06)` | Hover background |
| `--mn-highlight` | `rgb(255 255 255 / 0.5)` | Inner top highlight of surfaces |
| `--mn-shadow` | a soft two-layer shadow | Shadow of surfaces |
| `--mn-font-title` | Nunito Sans, then system fonts | Song titles |
| `--mn-font-ui` | Nunito Sans, then system fonts | Everything else |
| `--mn-title-weight` | `300` | Song titles are Light by default |
| `--mn-width` | `340px` | Width of the card and queue |
| `--mn-radius` | `24px` | Corner radius of the card and queue |
| `--mn-offset-x` | `20px` | Distance from the left or right edge |
| `--mn-offset-y` | `20px` | Distance from the top or bottom edge |
| `--mn-rest-opacity` | `0.55` | How far the idle medallion fades back |
| `--mn-z` | `2147483000` | `z-index` |

The defaults above are for the light theme. The dark theme (`theme="dark"`, or `auto` on a dark OS) sets its own values for the colors; your values on the element override both.

### `::part()`

Inner elements are exposed as parts: `hud` (the wrapper), `card`, `queue`, `medallion`, `title`, `artist`, `seek`, `controls` and `whisper` (the title that shows beside the medallion).

```css
mn-player::part(title) {
  font-style: italic;
}

mn-player::part(card) {
  border-radius: 12px;
}
```

## Fonts

The player uses [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans). When the element is added to the page, it adds the Google Fonts stylesheet to the document head once. It skips that if the page already has a `<link>` to Nunito Sans or a loaded font face with that name.

Add `no-font-download` to keep it from contacting Google, for privacy or a strict Content-Security-Policy. Then either self-host Nunito Sans, or let it fall back to the system font. You can also choose your own fonts with `--mn-font-title` and `--mn-font-ui`.

```html
<mn-player no-font-download></mn-player>
```

## Properties and methods

| Member | |
|---|---|
| `player` | The player the element controls. Defaults to the first player created. Assign another player (or `null`) to switch. |
| `expand()` | Open the card. It stays open until `collapse()` or until the pointer leaves. |
| `collapse()` | Close the card and the queue. |
| `toggleQueue(open?)` | Open or close the queue panel. Without an argument it toggles. |

```ts
import { createPlayer } from 'makenoise';
import type { MakeNoisePlayerElement } from 'makenoise/elements';
import 'makenoise/elements';

export const main = createPlayer();                            // the default player
const preview = createPlayer({ mediaSession: false });

const element = document.querySelector<MakeNoisePlayerElement>('#preview-player')!;
element.player = preview; // this element now controls the second player
element.toggleQueue(true);
```

`document.querySelector('mn-player')` (by tag name) is typed as `MakeNoisePlayerElement` automatically.

`makenoise/elements` also exports `MakeNoisePlayerElement` (the class) and `defineElements()`, which registers the element. Importing the module already calls it, it is safe to call more than once, and it does nothing during server-side rendering.

## Using it in a framework

The element works in any framework, but some need a hint that it's a custom element:

- **Vue:** tell the template compiler that `mn-` tags are custom elements. See [Vue](./vue#using-mn-player).
- **React:** `<mn-player>` works in JSX. With TypeScript, declare it in `JSX.IntrinsicElements`. See [React](./react#using-mn-player).
- **Svelte:** works as is.

## Building your own UI

To build a completely different UI, skip `<mn-player>` and use the [state, progress and actions](/api/player) directly. The framework bindings make that short: see [React](./react), [Vue](./vue) and [Svelte](./svelte).
