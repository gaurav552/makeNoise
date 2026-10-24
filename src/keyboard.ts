import type { Player } from './player.js';

export type KeyboardAction =
  | 'toggle'
  | 'seekForward'
  | 'seekBackward'
  | 'next'
  | 'previous'
  | 'volumeUp'
  | 'volumeDown'
  | 'mute'
  | 'shuffle'
  | 'repeat';

export interface KeyboardOptions {
  /**
   * Keys per action, like `'k'`, `' '` (Space), `'ArrowRight'` or `'Shift+N'`.
   * Replaces the defaults for the actions given; `false` or `[]` turns an action off.
   */
  keys?: Partial<Record<KeyboardAction, readonly string[] | false>>;
  /** Seconds per seek step (default 5). */
  seekStep?: number;
  /** Volume per step, 0..1 (default 0.1). */
  volumeStep?: number;
}

export const defaultKeys: Readonly<Record<KeyboardAction, readonly string[]>> = {
  toggle: [' ', 'k'],
  seekForward: ['ArrowRight', 'l'],
  seekBackward: ['ArrowLeft', 'j'],
  next: ['Shift+N'],
  previous: ['Shift+P'],
  volumeUp: ['ArrowUp'],
  volumeDown: ['ArrowDown'],
  mute: ['m'],
  shuffle: ['s'],
  repeat: ['r'],
};

/**
 * Keyboard shortcuts for a player, active only while focus is inside `scope`.
 * Pass `document` to make them page-wide. Returns a function that removes them.
 *
 * Keys typed into text fields, sliders and other form controls are left alone, as
 * are Space and Enter on buttons and links, and anything already handled
 * (`event.defaultPrevented`).
 */
export function bindKeyboard(player: Player<any>, scope: HTMLElement | Document, options: KeyboardOptions = {}): () => void {
  const seekStep = options.seekStep ?? 5;
  const volumeStep = options.volumeStep ?? 0.1;
  const bindings = new Map<string, KeyboardAction>();
  for (const action of Object.keys(defaultKeys) as KeyboardAction[]) {
    const keys = options.keys?.[action] ?? defaultKeys[action];
    for (const key of keys || []) bindings.set(normalize(key), action);
  }

  const run: Record<KeyboardAction, () => void> = {
    toggle: () => player.toggle(),
    seekForward: () => player.seek(player.progress.get().currentTime + seekStep),
    seekBackward: () => player.seek(player.progress.get().currentTime - seekStep),
    next: () => player.next(),
    previous: () => player.previous(),
    volumeUp: () => player.setVolume(Math.min(1, player.getState().volume + volumeStep)),
    volumeDown: () => player.setVolume(Math.max(0, player.getState().volume - volumeStep)),
    mute: () => player.toggleMute(),
    shuffle: () => player.toggleShuffle(),
    repeat: () => player.cycleRepeat(),
  };

  const onKeyDown = (event: Event) => {
    const e = event as KeyboardEvent;
    // Some synthetic keydowns (e.g. Chrome autofill) have no `key`.
    if (typeof e.key !== 'string') return;
    if (e.defaultPrevented || e.isComposing || (e.repeat && !isRepeatable(e.key))) return;
    const action = bindings.get(keyOf(e));
    if (!action || !player.getState().current) return;
    // Inside shadow DOM `target` is the host; the first entry of the path is the real target.
    const target = (e.composedPath()[0] ?? e.target) as Element | null;
    if (ignoredTarget(target, e.key)) return;
    e.preventDefault();
    run[action]();
  };

  scope.addEventListener('keydown', onKeyDown);
  return () => scope.removeEventListener('keydown', onKeyDown);
}

function keyOf(e: KeyboardEvent): string {
  const parts = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.metaKey) parts.push('meta');
  if (e.shiftKey && !isSymbol(e.key)) parts.push('shift');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

/** Shift is already part of symbols like '?' and '+', so it only counts for letters and named keys. */
function isSymbol(key: string): boolean {
  return key.length === 1 && key.toLowerCase() === key.toUpperCase();
}

/** `'Shift+N'` → `'shift+n'`, with modifiers in a fixed order so they match `keyOf`. */
function normalize(binding: string): string {
  // Split on '+' only when something follows it, so '+', 'Ctrl++' and ' ' keep their key.
  const parts = binding.split(/\+(?=.)/);
  let key = parts.pop()!;
  if (key.toLowerCase() === 'space') key = ' ';
  const modifiers = new Set(parts.map((part) => part.trim().toLowerCase()));
  if (isSymbol(key)) modifiers.delete('shift');
  const order = ['ctrl', 'alt', 'meta', 'shift'].filter((m) => modifiers.has(m));
  return [...order, key.toLowerCase()].join('+');
}

function isRepeatable(key: string): boolean {
  return key.startsWith('Arrow');
}

const EDITABLE = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  ...['slider', 'textbox', 'searchbox', 'spinbutton', 'combobox'].map((role) => `[role="${role}"]`),
].join(', ');

function ignoredTarget(target: Element | null, key: string): boolean {
  if (!target || !(target instanceof Element)) return false;
  if (target.closest(EDITABLE)) return true;
  // A custom element without an open shadow root may hide a text field in a closed one;
  // a missed shortcut is better than swallowing a typed letter.
  if (target.localName.includes('-') && !target.shadowRoot && key.length === 1) return true;
  // Space and Enter activate buttons and links; let them.
  return (key === ' ' || key === 'Enter') && !!target.closest('button, a[href], summary, [role="button"], [role="link"]');
}
