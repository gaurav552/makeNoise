import type { QueueItem, RepeatMode, Track } from './types';

/**
 * The queue model. Pure data and pure functions — no audio, no events, no DOM.
 *
 * Rules that keep it correct:
 *  - `items` is always the actual play order ("what you see is what plays").
 *  - The current entry is tracked by `qid`, never by index, so inserting or removing
 *    entries anywhere can't make the player lose its place.
 *  - Shuffling reorders only what's up next and remembers the original order in
 *    `originalOrder`; turning shuffle off restores it.
 *  - Every function returns a new state and never mutates its input or the tracks.
 */
export interface QueueState<T extends Track = Track> {
  readonly items: readonly QueueItem<T>[];
  readonly currentQid: string | null;
  readonly shuffle: boolean;
  readonly repeat: RepeatMode;
  /** qids in un-shuffled order. Non-null only while shuffle is on. */
  readonly originalOrder: readonly string[] | null;
}

/** Returns a float in [0, 1). Injectable so tests can be deterministic. */
export type Random = () => number;

export interface LoadOptions {
  /** Index into the given tracks to start at. When shuffling and omitted, a random track starts. */
  startIndex?: number;
  /** Defaults to the queue's current shuffle setting. */
  shuffle?: boolean;
}

/** `next`: current moved to another entry. `repeat`: the same entry should restart. `end`: nothing left to play. */
export type AdvanceResult = 'next' | 'repeat' | 'end';

/** `previous`: current moved back. `restart`: stay on the current entry and restart it. */
export type RetreatResult = 'previous' | 'restart';

const session = Math.random().toString(36).slice(2, 7);
let counter = 0;

export function createQid(): string {
  counter += 1;
  return `${session}-${counter.toString(36)}`;
}

export function createItems<T extends Track>(tracks: readonly T[]): QueueItem<T>[] {
  return tracks.map((track) => ({ qid: createQid(), track }));
}

export function emptyQueue<T extends Track = Track>(): QueueState<T> {
  return { items: [], currentQid: null, shuffle: false, repeat: 'off', originalOrder: null };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function currentIndex(q: QueueState<Track>): number {
  if (q.currentQid === null) return -1;
  return q.items.findIndex((item) => item.qid === q.currentQid);
}

export function currentItem<T extends Track>(q: QueueState<T>): QueueItem<T> | null {
  return q.items[currentIndex(q)] ?? null;
}

/** Entries before the current one. */
export function history<T extends Track>(q: QueueState<T>): readonly QueueItem<T>[] {
  const index = currentIndex(q);
  return index <= 0 ? [] : q.items.slice(0, index);
}

/** Entries after the current one, in the order they will play. */
export function upcoming<T extends Track>(q: QueueState<T>): readonly QueueItem<T>[] {
  return q.items.slice(currentIndex(q) + 1);
}

// ---------------------------------------------------------------------------
// Replacing the queue
// ---------------------------------------------------------------------------

/** Replace the whole queue with `tracks` (e.g. the user pressed play on a playlist). */
export function load<T extends Track>(
  q: QueueState<T>,
  tracks: readonly T[],
  options: LoadOptions = {},
  random: Random = Math.random,
): QueueState<T> {
  const shuffle = options.shuffle ?? q.shuffle;
  const items = createItems(tracks);
  if (items.length === 0) return { ...emptyQueue<T>(), shuffle, repeat: q.repeat, originalOrder: shuffle ? [] : null };

  if (!shuffle) {
    const start = clamp(options.startIndex ?? 0, 0, items.length - 1);
    return { items, currentQid: items[start]!.qid, shuffle, repeat: q.repeat, originalOrder: null };
  }

  const originalOrder = items.map((item) => item.qid);
  let order: QueueItem<T>[];
  if (options.startIndex === undefined) {
    order = shuffled(items, random);
  } else {
    const start = clamp(options.startIndex, 0, items.length - 1);
    const first = items[start]!;
    order = [first, ...shuffled(items.filter((_, i) => i !== start), random)];
  }
  return { items: order, currentQid: order[0]!.qid, shuffle, repeat: q.repeat, originalOrder };
}

// ---------------------------------------------------------------------------
// Editing the queue
// ---------------------------------------------------------------------------

/** Append to the end of the queue. */
export function add<T extends Track>(q: QueueState<T>, tracks: readonly T[]): QueueState<T> {
  const added = createItems(tracks);
  if (added.length === 0) return q;
  return {
    ...q,
    items: [...q.items, ...added],
    originalOrder: q.originalOrder && [...q.originalOrder, ...added.map((item) => item.qid)],
  };
}

/** Insert right after the current entry (or at the start if nothing is current). */
export function addNext<T extends Track>(q: QueueState<T>, tracks: readonly T[]): QueueState<T> {
  const added = createItems(tracks);
  if (added.length === 0) return q;
  const at = currentIndex(q) + 1;
  const items = [...q.items.slice(0, at), ...added, ...q.items.slice(at)];

  let originalOrder = q.originalOrder;
  if (originalOrder) {
    const originalAt = q.currentQid === null ? 0 : originalOrder.indexOf(q.currentQid) + 1;
    originalOrder = [
      ...originalOrder.slice(0, originalAt),
      ...added.map((item) => item.qid),
      ...originalOrder.slice(originalAt),
    ];
  }
  return { ...q, items, originalOrder };
}

/**
 * Remove entries. If the current entry is removed, the next remaining entry becomes
 * current (or nothing, if it was the last).
 */
export function remove<T extends Track>(q: QueueState<T>, qids: string | readonly string[]): QueueState<T> {
  const removing = new Set(typeof qids === 'string' ? [qids] : qids);
  if (!q.items.some((item) => removing.has(item.qid))) return q;

  let currentQid = q.currentQid;
  if (currentQid !== null && removing.has(currentQid)) {
    const index = currentIndex(q);
    currentQid = q.items.slice(index + 1).find((item) => !removing.has(item.qid))?.qid ?? null;
  }
  return {
    ...q,
    items: q.items.filter((item) => !removing.has(item.qid)),
    currentQid,
    originalOrder: q.originalOrder && q.originalOrder.filter((qid) => !removing.has(qid)),
  };
}

/**
 * Move an entry so it ends up at `toIndex` in the play order. The current entry stays
 * current, even if it is the one being moved.
 */
export function move<T extends Track>(q: QueueState<T>, qid: string, toIndex: number): QueueState<T> {
  const from = q.items.findIndex((item) => item.qid === qid);
  if (from === -1) return q;
  const to = clamp(Math.trunc(toIndex), 0, q.items.length - 1);
  if (from === to) return q;
  const items = q.items.slice();
  const [moved] = items.splice(from, 1);
  items.splice(to, 0, moved!);
  return { ...q, items };
}

/** Remove everything after the current entry. */
export function clearUpcoming<T extends Track>(q: QueueState<T>): QueueState<T> {
  const after = upcoming(q);
  return after.length === 0 ? q : remove(q, after.map((item) => item.qid));
}

/** Remove everything. Shuffle and repeat settings are kept. */
export function clear<T extends Track>(q: QueueState<T>): QueueState<T> {
  return { ...q, items: [], currentQid: null, originalOrder: q.shuffle ? [] : null };
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

export function setRepeat<T extends Track>(q: QueueState<T>, repeat: RepeatMode): QueueState<T> {
  return q.repeat === repeat ? q : { ...q, repeat };
}

/**
 * Shuffle on: history and the current entry stay put, everything up next is shuffled,
 * and the original order is remembered.
 * Shuffle off: the original order is restored. Entries removed meanwhile stay removed,
 * entries added meanwhile keep the position they were added at.
 */
export function setShuffle<T extends Track>(q: QueueState<T>, shuffle: boolean, random: Random = Math.random): QueueState<T> {
  if (q.shuffle === shuffle) return q;

  if (shuffle) {
    const at = currentIndex(q) + 1;
    return {
      ...q,
      shuffle: true,
      items: [...q.items.slice(0, at), ...shuffled(q.items.slice(at), random)],
      originalOrder: q.items.map((item) => item.qid),
    };
  }

  const byQid = new Map(q.items.map((item) => [item.qid, item]));
  const restored: QueueItem<T>[] = [];
  for (const qid of q.originalOrder ?? []) {
    const item = byQid.get(qid);
    if (item) {
      restored.push(item);
      byQid.delete(qid);
    }
  }
  // Anything not accounted for (shouldn't happen) keeps its relative order at the end.
  restored.push(...byQid.values());
  return { ...q, shuffle: false, items: restored, originalOrder: null };
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/** Make `qid` the current entry. */
export function jumpTo<T extends Track>(q: QueueState<T>, qid: string): QueueState<T> {
  if (q.currentQid === qid || !q.items.some((item) => item.qid === qid)) return q;
  return { ...q, currentQid: qid };
}

/**
 * The entry that will play after the current one ends by itself, if that can be
 * known in advance: `null` at the end of the queue, on repeat-one (the current entry
 * plays again), and when a shuffled queue wraps around (it is reshuffled first).
 */
export function peekNext<T extends Track>(q: QueueState<T>): QueueItem<T> | null {
  const index = currentIndex(q);
  if (index === -1 || q.repeat === 'one') return null;
  const following = q.items[index + 1];
  if (following) return following;
  if (q.repeat === 'all' && !q.shuffle && q.items[0] !== q.items[index]) return q.items[0] ?? null;
  return null;
}

/**
 * Move to the next entry.
 * `auto` means the track finished by itself; `user` means the user pressed next.
 * Repeat-one only repeats on `auto` — pressing next always moves on.
 */
export function advance<T extends Track>(
  q: QueueState<T>,
  reason: 'auto' | 'user',
  random: Random = Math.random,
): { queue: QueueState<T>; result: AdvanceResult } {
  if (q.items.length === 0) return { queue: q, result: 'end' };

  const index = currentIndex(q);
  if (index === -1) return { queue: { ...q, currentQid: q.items[0]!.qid }, result: 'next' };
  if (reason === 'auto' && q.repeat === 'one') return { queue: q, result: 'repeat' };

  const following = q.items[index + 1];
  if (following) return { queue: { ...q, currentQid: following.qid }, result: 'next' };

  if (q.repeat === 'off') return { queue: q, result: 'end' };

  // Wrap around. When shuffling, reshuffle the whole queue for the new pass, without
  // letting the track that just played come up first again.
  let items = q.items;
  if (q.shuffle && items.length > 1) {
    const last = items[index]!;
    const rest = shuffled(items.filter((item) => item !== last), random);
    const insertAt = 1 + Math.floor(random() * rest.length);
    items = [...rest.slice(0, insertAt), last, ...rest.slice(insertAt)];
  }
  const first = items[0]!;
  return {
    queue: { ...q, items, currentQid: first.qid },
    result: first.qid === q.currentQid ? 'repeat' : 'next',
  };
}

/** Move to the previous entry, wrapping to the end when repeat is on. */
export function retreat<T extends Track>(q: QueueState<T>): { queue: QueueState<T>; result: RetreatResult } {
  const index = currentIndex(q);
  if (index > 0) return { queue: { ...q, currentQid: q.items[index - 1]!.qid }, result: 'previous' };
  if (index === 0 && q.repeat !== 'off' && q.items.length > 1) {
    return { queue: { ...q, currentQid: q.items[q.items.length - 1]!.qid }, result: 'previous' };
  }
  return { queue: q, result: 'restart' };
}

// ---------------------------------------------------------------------------

function shuffled<X>(list: readonly X[], random: Random): X[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
