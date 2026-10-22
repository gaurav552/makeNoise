/**
 * The smallest store every framework can consume:
 *  - Svelte:  `subscribe` follows the Svelte store contract, so `$store` just works.
 *  - React:   `useSyncExternalStore(store.listen, store.get)`.
 *  - Vue, Solid, Angular: copy `get()` into a ref/signal from `listen`.
 *
 * State objects are immutable snapshots: a new object on every change, the same
 * object otherwise. That is what lets frameworks skip re-renders safely.
 */
export interface ReadableStore<S> {
  /** The current snapshot. */
  get(): S;
  /** Calls `listener` now and on every change (Svelte store contract). Returns an unsubscribe function. */
  subscribe(listener: (state: S) => void): () => void;
  /** Calls `listener` on every change only. Returns an unsubscribe function. */
  listen(listener: (state: S) => void): () => void;
}

export interface WritableStore<S> extends ReadableStore<S> {
  /** Shallow-merges `patch`; notifies listeners only if a value actually changed. */
  update(patch: Partial<S>): void;
  readonly: ReadableStore<S>;
}

export function createStore<S extends object>(initial: S): WritableStore<S> {
  let state = initial;
  const listeners = new Set<(state: S) => void>();

  const get = () => state;
  const listen = (listener: (state: S) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const subscribe = (listener: (state: S) => void) => {
    const unsubscribe = listen(listener);
    listener(state);
    return unsubscribe;
  };
  const update = (patch: Partial<S>) => {
    let changed = false;
    for (const key in patch) {
      if (!Object.is(patch[key], state[key])) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...patch };
    for (const listener of [...listeners]) listener(state);
  };

  return { get, subscribe, listen, update, readonly: { get, subscribe, listen } };
}

/** Event name → listener argument tuple. */
export type EventMap<E> = { [K in keyof E]: unknown[] };

type AnyHandler = (...args: unknown[]) => void;

export class Emitter<E extends EventMap<E>> {
  private handlers = new Map<keyof E, Set<AnyHandler>>();

  /** Returns an unsubscribe function. */
  on<K extends keyof E>(event: K, handler: (...args: E[K]) => void): () => void {
    let set = this.handlers.get(event);
    if (!set) this.handlers.set(event, (set = new Set()));
    set.add(handler as unknown as AnyHandler);
    return () => this.off(event, handler);
  }

  once<K extends keyof E>(event: K, handler: (...args: E[K]) => void): () => void {
    const off = this.on(event, (...args) => {
      off();
      handler(...args);
    });
    return off;
  }

  off<K extends keyof E>(event: K, handler: (...args: E[K]) => void): void {
    this.handlers.get(event)?.delete(handler as unknown as AnyHandler);
  }

  emit<K extends keyof E>(event: K, ...args: E[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        handler(...(args as unknown[]));
      } catch (error) {
        // A broken listener in the app must never break playback.
        console.error(`[makenoise] "${String(event)}" listener threw:`, error);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
