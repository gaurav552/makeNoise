import { getCurrentScope, hasInjectionContext, inject, onScopeDispose, provide, shallowRef, type InjectionKey, type Ref } from 'vue';
import { getDefaultPlayer } from '../default-player';
import type { Player, PlayerEvents } from '../player';
import type { ReadableStore } from '../store';
import type { PlayerState, ProgressState, Track } from '../types';

/** For `app.provide(playerKey, player)`, to give the whole app a player other than the default. */
export const playerKey: InjectionKey<Player<any>> = Symbol('makenoise');

/** Gives this component and its descendants a player other than the default. Call in `setup`. */
export function providePlayer<T extends Track>(player: Player<T>): void {
  provide(playerKey, player);
}

/** The provided player, else the first player created with `createPlayer()`. */
export function usePlayer<T extends Track = Track>(): Player<T> {
  const player = (hasInjectionContext() ? inject(playerKey, null) : null) ?? getDefaultPlayer();
  if (!player) {
    throw new Error('[makenoise] No player found. Call createPlayer() before mounting, or providePlayer(player).');
  }
  return player;
}

/**
 * A read-only ref to the player state. Pass a selector to update only when that part
 * changes: `usePlayerState((s) => s.current)`. The selector should return a value from
 * the state (or a primitive), not a new object, or the ref updates on every change.
 * Unsubscribes when the component (or effect scope) is disposed; outside one it stays
 * subscribed for good, so call it in `setup` or inside an `effectScope()`.
 */
export function usePlayerState<T extends Track = Track>(): Readonly<Ref<PlayerState<T>>>;
export function usePlayerState<T extends Track = Track, R = unknown>(selector: (state: PlayerState<T>) => R): Readonly<Ref<R>>;
export function usePlayerState<T extends Track, R>(selector?: (state: PlayerState<T>) => R) {
  return useStore(usePlayer<T>().state, selector);
}

/** A read-only ref to `{ currentTime, duration }`, updated several times a second while playing. */
export function useProgress(): Readonly<Ref<ProgressState>>;
export function useProgress<R>(selector: (progress: ProgressState) => R): Readonly<Ref<R>>;
export function useProgress<R>(selector?: (progress: ProgressState) => R) {
  return useStore(usePlayer().progress, selector);
}

/** Subscribes to a player event until the component (or effect scope) is disposed. Returns an unsubscribe function. */
export function usePlayerEvent<K extends keyof PlayerEvents<T>, T extends Track = Track>(
  event: K,
  handler: (...args: PlayerEvents<T>[K]) => void,
): () => void {
  const off = usePlayer<T>().on(event, handler);
  if (getCurrentScope()) onScopeDispose(off);
  return off;
}

function useStore<S, R>(store: ReadableStore<S>, selector?: (state: S) => R): Readonly<Ref<R | S>> {
  const select = selector ?? ((state: S) => state);
  // A shallow ref only notifies when the value is actually different.
  const value = shallowRef<R | S>(select(store.get()));
  // During SSR scopes are never disposed, so subscribing would leak a listener per render.
  if (typeof window === 'undefined') return value;
  const off = store.listen((state) => {
    value.value = select(state);
  });
  if (getCurrentScope()) onScopeDispose(off);
  return value;
}
