# Keyboard shortcuts

`bindKeyboard()` adds keyboard shortcuts for a player. It returns a function that removes them.

```ts
import { bindKeyboard } from 'makenoise';
import { player } from './player';

const unbind = bindKeyboard(player, document.querySelector<HTMLElement>('#player-area')!);

// later
unbind();
```

## Scope

The second argument decides where the shortcuts work:

- **An element:** only while keyboard focus is inside that element. Use this when the page has other things that respond to the same keys, or when the player is one part of a larger app.
- **`document`:** anywhere on the page.

```ts
bindKeyboard(player, document.querySelector<HTMLElement>('#player-area')!); // only while focus is inside
bindKeyboard(player, document);                                              // page-wide
```

The shortcuts listen for `keydown` on the scope, so events from inside shadow DOM (such as `<mn-player>`) are handled too.

## Default keys

| Keys | Action |
|---|---|
| <kbd>Space</kbd>, <kbd>K</kbd> | Play / pause |
| <kbd>→</kbd>, <kbd>L</kbd> | Seek forward 5 s |
| <kbd>←</kbd>, <kbd>J</kbd> | Seek back 5 s |
| <kbd>Shift</kbd>+<kbd>N</kbd> | Next track |
| <kbd>Shift</kbd>+<kbd>P</kbd> | Previous track |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Volume up / down by 10% |
| <kbd>M</kbd> | Mute / unmute |
| <kbd>S</kbd> | Shuffle on / off |
| <kbd>R</kbd> | Cycle repeat: off → all → one |

Letters are matched case-insensitively, but modifiers must match exactly: <kbd>Ctrl</kbd>+<kbd>K</kbd> or <kbd>Shift</kbd>+<kbd>K</kbd> don't trigger <kbd>K</kbd>. Holding a key down only repeats the arrow keys.

The defaults are exported as `defaultKeys`.

## What gets ignored

The shortcuts stay out of the way of the rest of the page. A key press is ignored when:

- it is typed into a text field, textarea, select, slider, or any `contenteditable` element or element with `role="slider"` or `role="textbox"`,
- it is <kbd>Space</kbd> or <kbd>Enter</kbd> on a button, link, `<summary>`, or an element with `role="button"` or `role="link"` (so they still activate),
- the app already handled it and called `event.preventDefault()`,
- an input method editor is composing text,
- the queue is empty (nothing is current).

When a shortcut runs, it calls `preventDefault()`, so <kbd>Space</kbd> doesn't also scroll the page.

## Customizing

Pass options as the third argument:

```ts
bindKeyboard(player, document, {
  keys: {
    toggle: ['p'],            // replaces Space and K
    next: ['Shift+ArrowRight'],
    previous: ['Shift+ArrowLeft'],
    mute: false,              // turns the mute shortcut off
  },
  seekStep: 10,               // seconds per seek (default 5)
  volumeStep: 0.05,           // volume per step, 0..1 (default 0.1)
});
```

Keys are written like `KeyboardEvent.key` values: `'k'`, `' '` (Space), `'ArrowRight'`, `'Enter'`. Add modifiers with `+`: `'Shift+N'`, `'Ctrl+ArrowUp'`, `'Alt+m'`, `'Meta+k'`. Modifier order doesn't matter.

For each action you list, your keys replace the defaults. `false` or `[]` turns the action off. Actions you don't list keep their default keys.

The actions are `toggle`, `seekForward`, `seekBackward`, `next`, `previous`, `volumeUp`, `volumeDown`, `mute`, `shuffle` and `repeat` (the `KeyboardAction` type).

::: tip Symbols
For keys that already need <kbd>Shift</kbd> to type, like `?` or `>`, write the symbol itself without `Shift+`: `keys: { next: ['>'] }`.
:::

## On `<mn-player>`

The element can bind the default shortcuts for you with the `keyboard` attribute:

```html
<!-- while focus is inside the player -->
<mn-player keyboard></mn-player>

<!-- anywhere on the page -->
<mn-player keyboard="global"></mn-player>
```

Changing or removing the attribute rebinds or unbinds the shortcuts. The element always uses the default keys and steps; to customize them, leave the attribute off and call `bindKeyboard()` yourself.
