// Type-level checks, enforced by `npm run typecheck`. The callbacks below are never run.
import { describe, expectTypeOf, it } from 'vitest';
import type { Player } from '../src/player';
import { usePlayerEvent as useReactEvent } from '../src/react';
import { onPlayerEvent } from '../src/svelte';
import type { PlayerError, QueueItem, Track } from '../src/types';
import { usePlayerEvent as useVueEvent } from '../src/vue';

interface MyTrack extends Track {
  bpm: number;
}

describe('types', () => {
  it('infers a custom track type from an annotated event handler', () => {
    const check = (player: Player<MyTrack>) => {
      useReactEvent('trackend', (item: QueueItem<MyTrack>) => expectTypeOf(item.track.bpm).toBeNumber());
      useVueEvent('trackchange', (current: QueueItem<MyTrack> | null) => expectTypeOf(current!.track.bpm).toBeNumber());
      onPlayerEvent('trackend', (item: QueueItem<MyTrack>) => expectTypeOf(item.track.bpm).toBeNumber());
      onPlayerEvent('trackend', (item) => expectTypeOf(item.track.bpm).toBeNumber(), player);
      // Without either, handlers get the default Track.
      // @ts-expect-error bpm is not on Track
      useReactEvent('trackend', (item) => item.track.bpm);
    };
    expectTypeOf(check).toBeFunction();
  });

  it('only reports load errors', () => {
    expectTypeOf<PlayerError['type']>().toEqualTypeOf<'load'>();
  });
});
