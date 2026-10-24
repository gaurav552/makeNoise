import { createContext, createElement, useContext, useEffect, useInsertionEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { getDefaultPlayer, onDefaultPlayer } from '../default-player.js';
import type { Player, PlayerEvents } from '../player.js';
import type { ReadableStore } from '../store.js';
import type { PlayerState, ProgressState, Track } from '../types.js';

const PlayerContext = createContext<Player<any> | null>(null);

export interface PlayerProviderProps<T extends Track = Track> {
  player: Player<T>;
  children?: ReactNode;
}

/**
 * Optional. Hooks use the first player created with `createPlayer()` by default;
 * wrap a subtree in a provider to give it a different one.
 */
export function PlayerProvider<T extends Track = Track>({ player, children }: PlayerProviderProps<T>) {
  return createElement(PlayerContext.Provider, { value: player }, children);
}

/** The player from the nearest `<PlayerProvider>`, else the default player. */
export function usePlayer<T extends Track = Track>(): Player<T> {
  const provided = useContext(PlayerContext);
  const fallback = useSyncExternalStore(onDefaultPlayer, getDefaultPlayer, getDefaultPlayer);
  // Keep the last player if the default one is destroyed (logout, HMR) until a new
  // one is created, instead of crashing every component that uses it.
  const last = useRef<Player<any> | null>(null);
  const player = provided ?? fallback ?? last.current;
  last.current = player;
  if (!player) {
    throw new Error(
      '[makenoise] No player found. Call createPlayer() before rendering, or wrap your app in <PlayerProvider player={player}>.',
    );
  }
  return player;
}

/**
 * Re-renders when the player state changes. Pass a selector to re-render only when
 * that part changes: `usePlayerState((s) => s.current)`. The selector should return
 * a value from the state (or a primitive), not a new object.
 */
export function usePlayerState<T extends Track = Track>(): PlayerState<T>;
export function usePlayerState<T extends Track = Track, R = unknown>(selector: (state: PlayerState<T>) => R): R;
export function usePlayerState<T extends Track, R>(selector?: (state: PlayerState<T>) => R): R | PlayerState<T> {
  return useStore(usePlayer<T>().state, selector);
}

/**
 * Re-renders several times a second while playing. Use it only in the components
 * that show time, or select a coarser value: `useProgress((p) => Math.floor(p.currentTime))`.
 */
export function useProgress(): ProgressState;
export function useProgress<R>(selector: (progress: ProgressState) => R): R;
export function useProgress<R>(selector?: (progress: ProgressState) => R): R | ProgressState {
  return useStore(usePlayer().progress, selector);
}

/** Subscribes to a player event for the component's lifetime. The latest `handler` is always called. */
export function usePlayerEvent<K extends keyof PlayerEvents<T>, T extends Track = Track>(
  event: K,
  handler: (...args: PlayerEvents<T>[K]) => void,
): void {
  const player = usePlayer<T>();
  const latest = useRef(handler);
  // Updated before any effect runs, so events emitted from effects reach the current handler.
  useInsertionEffect(() => {
    latest.current = handler;
  });
  useEffect(() => player.on(event, (...args) => latest.current(...args)), [player, event]);
}

function useStore<S, R>(store: ReadableStore<S>, selector?: (state: S) => R): R | S {
  // Remember the last result per snapshot, so an inline selector doesn't produce
  // a "new" value on every getSnapshot call (which React treats as an endless update).
  const cache = useRef<{ state: S; selector: typeof selector; value: R | S } | null>(null);
  const getSnapshot = () => {
    const state = store.get();
    const last = cache.current;
    if (last && last.state === state && last.selector === selector) return last.value;
    const value = selector ? selector(state) : state;
    const kept = last && Object.is(last.value, value) ? last.value : value;
    cache.current = { state, selector, value: kept };
    return kept;
  };
  return useSyncExternalStore(store.listen, getSnapshot, getSnapshot);
}
