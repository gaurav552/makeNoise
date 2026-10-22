import { describe, expect, it } from 'vitest';
import * as Q from '../src/queue';
import type { QueueState } from '../src/queue';
import { seeded, tracks } from './helpers';

const ids = (q: QueueState) => q.items.map((item) => item.track.id);
const current = (q: QueueState) => Q.currentItem(q)?.track.id ?? null;
const qidOf = (q: QueueState, id: string) => q.items.find((item) => item.track.id === id)!.qid;

describe('load', () => {
  it('copies the tracks and never mutates the input array', () => {
    const list = tracks(3);
    const snapshot = JSON.stringify(list);
    const q = Q.load(Q.emptyQueue(), list);
    expect(ids(q)).toEqual(['t1', 't2', 't3']);
    expect(current(q)).toBe('t1');
    expect(q.items).not.toBe(list);
    expect(JSON.stringify(list)).toBe(snapshot);
    expect(Object.isFrozen(list)).toBe(false);
  });

  it('starts at startIndex', () => {
    expect(current(Q.load(Q.emptyQueue(), tracks(5), { startIndex: 3 }))).toBe('t4');
  });

  it('clamps an out-of-range startIndex', () => {
    expect(current(Q.load(Q.emptyQueue(), tracks(3), { startIndex: 99 }))).toBe('t3');
    expect(current(Q.load(Q.emptyQueue(), tracks(3), { startIndex: -5 }))).toBe('t1');
  });

  it('gives every entry a unique qid, even for duplicate tracks', () => {
    const [a] = tracks(1);
    const q = Q.load(Q.emptyQueue(), [a!, a!, a!]);
    expect(new Set(q.items.map((item) => item.qid)).size).toBe(3);
  });

  it('handles an empty list', () => {
    const q = Q.load(Q.emptyQueue(), []);
    expect(q.items).toEqual([]);
    expect(q.currentQid).toBeNull();
  });

  it('shuffled with startIndex: that track plays first, the rest are shuffled', () => {
    const q = Q.load(Q.emptyQueue(), tracks(10), { startIndex: 4, shuffle: true }, seeded());
    expect(current(q)).toBe('t5');
    expect(Q.currentIndex(q)).toBe(0);
    expect([...ids(q)].sort()).toEqual([...ids(Q.load(Q.emptyQueue(), tracks(10)))].sort());
    expect(ids(q)).not.toEqual(['t5', 't1', 't2', 't3', 't4', 't6', 't7', 't8', 't9', 't10']);
  });

  it('shuffled without startIndex: a random track plays first', () => {
    const firsts = new Set<string>();
    const random = seeded(7);
    for (let i = 0; i < 20; i++) firsts.add(current(Q.load(Q.emptyQueue(), tracks(10), { shuffle: true }, random))!);
    expect(firsts.size).toBeGreaterThan(1);
  });

  it('keeps the existing shuffle and repeat settings', () => {
    const base = Q.setRepeat(Q.setShuffle(Q.emptyQueue(), true), 'all');
    const q = Q.load(base, tracks(5), {}, seeded());
    expect(q.shuffle).toBe(true);
    expect(q.repeat).toBe('all');
    expect(q.originalOrder).toHaveLength(5);
  });
});

describe('add / addNext', () => {
  it('add appends to the end', () => {
    const q = Q.add(Q.load(Q.emptyQueue(), tracks(2)), tracks(2, 'x'));
    expect(ids(q)).toEqual(['t1', 't2', 'x1', 'x2']);
    expect(current(q)).toBe('t1');
  });

  it('addNext inserts right after the current entry', () => {
    let q = Q.load(Q.emptyQueue(), tracks(4), { startIndex: 1 });
    q = Q.addNext(q, tracks(2, 'x'));
    expect(ids(q)).toEqual(['t1', 't2', 'x1', 'x2', 't3', 't4']);
    expect(current(q)).toBe('t2');
  });

  it('addNext on a queue with nothing current inserts at the start', () => {
    const q = Q.addNext(Q.emptyQueue(), tracks(2));
    expect(ids(q)).toEqual(['t1', 't2']);
    expect(q.currentQid).toBeNull();
  });

  it('additions while shuffled survive turning shuffle off, in a sensible place', () => {
    let q = Q.load(Q.emptyQueue(), tracks(5), { startIndex: 0 });
    q = Q.setShuffle(q, true, seeded());
    q = Q.addNext(q, tracks(1, 'next'));
    q = Q.add(q, tracks(1, 'end'));
    expect(ids(q)[1]).toBe('next1');
    expect(ids(q).at(-1)).toBe('end1');
    q = Q.setShuffle(q, false);
    expect(ids(q)).toEqual(['t1', 'next1', 't2', 't3', 't4', 't5', 'end1']);
  });
});

describe('remove', () => {
  it('removes upcoming and history entries without changing the current one', () => {
    let q = Q.load(Q.emptyQueue(), tracks(5), { startIndex: 2 });
    q = Q.remove(q, [qidOf(q, 't1'), qidOf(q, 't5')]);
    expect(ids(q)).toEqual(['t2', 't3', 't4']);
    expect(current(q)).toBe('t3');
    expect(Q.currentIndex(q)).toBe(1);
  });

  it('removing the current entry makes the next one current', () => {
    let q = Q.load(Q.emptyQueue(), tracks(4), { startIndex: 1 });
    q = Q.remove(q, qidOf(q, 't2'));
    expect(current(q)).toBe('t3');
  });

  it('removing the current entry together with the following ones skips past all of them', () => {
    let q = Q.load(Q.emptyQueue(), tracks(5), { startIndex: 1 });
    q = Q.remove(q, [qidOf(q, 't2'), qidOf(q, 't3')]);
    expect(current(q)).toBe('t4');
  });

  it('removing the current last entry leaves nothing current', () => {
    let q = Q.load(Q.emptyQueue(), tracks(3), { startIndex: 2 });
    q = Q.remove(q, qidOf(q, 't3'));
    expect(q.currentQid).toBeNull();
    expect(ids(q)).toEqual(['t1', 't2']);
  });

  it('removes only the chosen copy of a duplicated track', () => {
    const [a, b] = tracks(2);
    let q = Q.load(Q.emptyQueue(), [a!, b!, a!]);
    q = Q.remove(q, q.items[2]!.qid);
    expect(ids(q)).toEqual(['t1', 't2']);
    expect(current(q)).toBe('t1');
  });

  it('ignores unknown qids', () => {
    const q = Q.load(Q.emptyQueue(), tracks(3));
    expect(Q.remove(q, 'nope')).toBe(q);
  });
});

describe('move', () => {
  it('moves an entry to the target index', () => {
    let q = Q.load(Q.emptyQueue(), tracks(5));
    q = Q.move(q, qidOf(q, 't5'), 1);
    expect(ids(q)).toEqual(['t1', 't5', 't2', 't3', 't4']);
    q = Q.move(q, qidOf(q, 't1'), 4);
    expect(ids(q)).toEqual(['t5', 't2', 't3', 't4', 't1']);
  });

  it('the current entry stays current when others move around it', () => {
    let q = Q.load(Q.emptyQueue(), tracks(5), { startIndex: 2 });
    q = Q.move(q, qidOf(q, 't5'), 0);
    expect(current(q)).toBe('t3');
    expect(Q.currentIndex(q)).toBe(3);
  });

  it('moving the current entry keeps it current', () => {
    let q = Q.load(Q.emptyQueue(), tracks(5), { startIndex: 0 });
    q = Q.move(q, qidOf(q, 't1'), 3);
    expect(current(q)).toBe('t1');
    expect(Q.upcoming(q).map((item) => item.track.id)).toEqual(['t5']);
  });

  it('clamps the index', () => {
    let q = Q.load(Q.emptyQueue(), tracks(3));
    q = Q.move(q, qidOf(q, 't1'), 100);
    expect(ids(q)).toEqual(['t2', 't3', 't1']);
  });

  it('does not change the original order used to unshuffle', () => {
    let q = Q.load(Q.emptyQueue(), tracks(5), { startIndex: 0 });
    q = Q.setShuffle(q, true, seeded());
    q = Q.move(q, q.items[4]!.qid, 1);
    expect(ids(Q.setShuffle(q, false))).toEqual(['t1', 't2', 't3', 't4', 't5']);
  });
});

describe('shuffle', () => {
  it('keeps history and the current entry in place, shuffles only what is up next', () => {
    let q = Q.load(Q.emptyQueue(), tracks(10), { startIndex: 3 });
    q = Q.setShuffle(q, true, seeded());
    expect(ids(q).slice(0, 4)).toEqual(['t1', 't2', 't3', 't4']);
    expect(current(q)).toBe('t4');
    expect(ids(q).slice(4)).not.toEqual(['t5', 't6', 't7', 't8', 't9', 't10']);
    expect([...ids(q).slice(4)].sort()).toEqual(['t10', 't5', 't6', 't7', 't8', 't9']);
  });

  it('turning shuffle off restores the original order and keeps the current entry', () => {
    let q = Q.load(Q.emptyQueue(), tracks(8), { startIndex: 2 });
    q = Q.setShuffle(q, true, seeded());
    q = Q.jumpTo(q, q.items[6]!.qid);
    const playing = current(q);
    q = Q.setShuffle(q, false);
    expect(ids(q)).toEqual(['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']);
    expect(current(q)).toBe(playing);
    expect(q.originalOrder).toBeNull();
  });

  it('shuffle → remove → unshuffle drops the removed entries', () => {
    let q = Q.load(Q.emptyQueue(), tracks(6));
    q = Q.setShuffle(q, true, seeded());
    q = Q.remove(q, [qidOf(q, 't2'), qidOf(q, 't5')]);
    q = Q.setShuffle(q, false);
    expect(ids(q)).toEqual(['t1', 't3', 't4', 't6']);
  });

  it('works on an empty queue', () => {
    let q = Q.setShuffle(Q.emptyQueue(), true);
    q = Q.add(q, tracks(3));
    q = Q.setShuffle(q, false);
    expect(ids(q)).toEqual(['t1', 't2', 't3']);
  });

  it('is a no-op when the setting does not change', () => {
    const q = Q.load(Q.emptyQueue(), tracks(3));
    expect(Q.setShuffle(q, false)).toBe(q);
  });
});

describe('advance', () => {
  it('moves to the next entry', () => {
    const { queue, result } = Q.advance(Q.load(Q.emptyQueue(), tracks(3)), 'auto');
    expect(result).toBe('next');
    expect(current(queue)).toBe('t2');
  });

  it('ends at the last entry with repeat off', () => {
    const q = Q.load(Q.emptyQueue(), tracks(3), { startIndex: 2 });
    expect(Q.advance(q, 'auto').result).toBe('end');
    expect(Q.advance(q, 'user').result).toBe('end');
  });

  it('wraps to the first entry with repeat all', () => {
    const q = Q.setRepeat(Q.load(Q.emptyQueue(), tracks(3), { startIndex: 2 }), 'all');
    const { queue, result } = Q.advance(q, 'auto');
    expect(result).toBe('next');
    expect(current(queue)).toBe('t1');
  });

  it('repeat all with a single entry repeats it', () => {
    const q = Q.setRepeat(Q.load(Q.emptyQueue(), tracks(1)), 'all');
    expect(Q.advance(q, 'auto').result).toBe('repeat');
  });

  it('repeat one repeats when the track ends by itself, but next still moves on', () => {
    const q = Q.setRepeat(Q.load(Q.emptyQueue(), tracks(3)), 'one');
    expect(Q.advance(q, 'auto').result).toBe('repeat');
    const { queue, result } = Q.advance(q, 'user');
    expect(result).toBe('next');
    expect(current(queue)).toBe('t2');
  });

  it('repeat one: pressing next on the last entry wraps around', () => {
    const q = Q.setRepeat(Q.load(Q.emptyQueue(), tracks(3), { startIndex: 2 }), 'one');
    expect(current(Q.advance(q, 'user').queue)).toBe('t1');
  });

  it('wrapping while shuffled reshuffles, and the last track does not play first again', () => {
    const random = seeded(3);
    let q = Q.setRepeat(Q.load(Q.emptyQueue(), tracks(6), { shuffle: true }, random), 'all');
    for (let pass = 0; pass < 20; pass++) {
      q = Q.jumpTo(q, q.items.at(-1)!.qid);
      const last = current(q);
      const { queue } = Q.advance(q, 'auto', random);
      expect(current(queue)).not.toBe(last);
      expect(Q.currentIndex(queue)).toBe(0);
      expect(queue.items).toHaveLength(6);
      q = queue;
    }
  });

  it('starts at the first entry when nothing is current', () => {
    const q = Q.add(Q.emptyQueue(), tracks(2));
    const { queue, result } = Q.advance(q, 'user');
    expect(result).toBe('next');
    expect(current(queue)).toBe('t1');
  });

  it('ends on an empty queue', () => {
    expect(Q.advance(Q.emptyQueue(), 'user').result).toBe('end');
  });

  it('plays through a reordered queue in the visible order', () => {
    let q = Q.load(Q.emptyQueue(), tracks(4));
    q = Q.move(q, qidOf(q, 't4'), 1);
    const played: (string | null)[] = [current(q)];
    for (;;) {
      const { queue, result } = Q.advance(q, 'auto');
      if (result === 'end') break;
      q = queue;
      played.push(current(q));
    }
    expect(played).toEqual(['t1', 't4', 't2', 't3']);
  });
});

describe('retreat', () => {
  it('moves to the previous entry', () => {
    const { queue, result } = Q.retreat(Q.load(Q.emptyQueue(), tracks(3), { startIndex: 2 }));
    expect(result).toBe('previous');
    expect(current(queue)).toBe('t2');
  });

  it('restarts on the first entry with repeat off', () => {
    expect(Q.retreat(Q.load(Q.emptyQueue(), tracks(3))).result).toBe('restart');
  });

  it('wraps to the last entry with repeat on', () => {
    const q = Q.setRepeat(Q.load(Q.emptyQueue(), tracks(3)), 'all');
    expect(current(Q.retreat(q).queue)).toBe('t3');
  });
});

describe('clearing', () => {
  it('clearUpcoming keeps history and the current entry', () => {
    let q = Q.load(Q.emptyQueue(), tracks(5), { startIndex: 2 });
    q = Q.clearUpcoming(q);
    expect(ids(q)).toEqual(['t1', 't2', 't3']);
    expect(current(q)).toBe('t3');
  });

  it('clearUpcoming while shuffled also clears them from the original order', () => {
    let q = Q.load(Q.emptyQueue(), tracks(5), { startIndex: 2 });
    q = Q.setShuffle(q, true, seeded());
    q = Q.clearUpcoming(Q.add(q, tracks(1, 'x')));
    q = Q.setShuffle(q, false);
    expect(ids(q)).toEqual(['t1', 't2', 't3']);
  });

  it('clear empties the queue but keeps the settings', () => {
    let q = Q.setRepeat(Q.load(Q.emptyQueue(), tracks(3), { shuffle: true }), 'one');
    q = Q.clear(q);
    expect(q.items).toEqual([]);
    expect(q.currentQid).toBeNull();
    expect(q.shuffle).toBe(true);
    expect(q.repeat).toBe('one');
  });
});

describe('history / upcoming', () => {
  it('split the queue around the current entry', () => {
    const q = Q.load(Q.emptyQueue(), tracks(5), { startIndex: 2 });
    expect(Q.history(q).map((item) => item.track.id)).toEqual(['t1', 't2']);
    expect(Q.upcoming(q).map((item) => item.track.id)).toEqual(['t4', 't5']);
  });

  it('with nothing current, everything is upcoming', () => {
    const q = Q.add(Q.emptyQueue(), tracks(2));
    expect(Q.history(q)).toEqual([]);
    expect(Q.upcoming(q)).toHaveLength(2);
  });
});
