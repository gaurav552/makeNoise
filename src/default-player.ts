import type { Player } from './player.js';

/**
 * The first player created becomes the default, so UI elements can find it
 * without being wired up by hand. Assign `element.player` to use a different one.
 */
let current: Player<any> | null = null;
const waiting = new Set<(player: Player<any> | null) => void>();

export function getDefaultPlayer(): Player<any> | null {
  return current;
}

export function setDefaultPlayer(player: Player<any> | null): void {
  if (current === player) return;
  current = player;
  for (const listener of [...waiting]) listener(player);
}

/** Calls `listener` whenever the default player changes. Returns an unsubscribe function. */
export function onDefaultPlayer(listener: (player: Player<any> | null) => void): () => void {
  waiting.add(listener);
  return () => {
    waiting.delete(listener);
  };
}
