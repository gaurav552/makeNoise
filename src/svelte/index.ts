import { getContext, hasContext, onDestroy, setContext } from 'svelte';
import { createSubscriber } from 'svelte/reactivity';
import { getDefaultPlayer } from '../default-player.js';
import type { Player, PlayerEvents } from '../player.js';
import type { ReadableStore } from '../store.js';
import type { PlayerState, ProgressState, Track } from '../types.js';

// The player itself is already a Svelte store (`$player` works), and so are
// `player.state` and `player.progress`. These helpers add context and runes-style access.

const KEY = Symbol('makenoise');

/** Gives this component and its descendants a player other than the default. Call during component init. */
export function setPlayer<T extends Track>(player: Player<T>): void {
  setContext(KEY, player);
}

/** The player from `setPlayer()`, else the first player created with `createPlayer()`. Call during component init. */
export function getPlayer<T extends Track = Track>(): Player<T> {
  const player = (hasContext(KEY) ? getContext<Player<T>>(KEY) : null) ?? getDefaultPlayer();
  if (!player) {
    throw new Error('[makenoise] No player found. Call createPlayer() before mounting, or setPlayer(player).');
  }
  return player;
}

/** Reactive in runes mode: read `.current` in markup, `$derived` or `$effect`. */
export interface Current<S> {
  readonly current: S;
}

/**
 * `const playback = usePlayerState();` then `playback.current.status` stays up to date.
 * (Avoid naming it `state`: in runes mode that clashes with the `$state` rune.)
 */
export function usePlayerState<T extends Track = Track>(player: Player<T> = getPlayer<T>()): Current<PlayerState<T>> {
  return fromStore(player.state);
}

/** `const progress = useProgress();` then `progress.current.currentTime`. Updates several times a second while playing. */
export function useProgress(player: Player<any> = getPlayer()): Current<ProgressState> {
  return fromStore(player.progress);
}

/** Subscribes to a player event until the component is destroyed. Call during component init. */
export function onPlayerEvent<K extends keyof PlayerEvents<T>, T extends Track = Track>(
  event: K,
  handler: (...args: PlayerEvents<T>[K]) => void,
  player: Player<T> = getPlayer<T>(),
): void {
  // Registered first, so nothing is left subscribed if this is called outside component init (which throws).
  let off = () => {};
  onDestroy(() => off());
  off = player.on(event, handler);
}

function fromStore<S>(store: ReadableStore<S>): Current<S> {
  // Subscribes only while something reactive is reading `current`.
  const track = createSubscriber((update) => store.listen(() => update()));
  return {
    get current() {
      track();
      return store.get();
    },
  };
}
