// @vitest-environment jsdom
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPlayer, type Player } from '../src/player';
import Probe from './svelte/Probe.svelte';
import WithPlayer from './svelte/WithPlayer.svelte';
import { FakeEngine, tracks } from './helpers';

const players: Player[] = [];
const mounted: Record<string, unknown>[] = [];

function makePlayer() {
  const player = createPlayer({ engine: new FakeEngine(), mediaSession: false });
  players.push(player);
  return player;
}

function render(component: typeof Probe | typeof WithPlayer, props: Record<string, unknown> = {}) {
  const target = document.createElement('div');
  const instance = mount(component as typeof Probe, { target, props });
  mounted.push(instance);
  flushSync();
  return { target, instance };
}

afterEach(() => {
  for (const instance of mounted.splice(0)) unmount(instance);
  for (const player of players.splice(0)) player.destroy();
});

describe('svelte binding', () => {
  it('follows the default player state and progress', () => {
    const player = makePlayer();
    const { target } = render(Probe);
    expect(target.textContent).toBe('idle|-|0');
    player.play(tracks(2));
    player.seek(12);
    flushSync();
    expect(target.textContent).toBe('playing|t1|12');
    player.next();
    flushSync();
    expect(target.textContent).toBe('playing|t2|0');
  });

  it('uses the player from setPlayer()', () => {
    makePlayer();
    const other = makePlayer();
    other.play(tracks(1, 'other'));
    const { target } = render(WithPlayer, { player: other });
    expect(target.textContent).toBe('playing|other1|0');
  });

  it('subscribes to events until the component is destroyed', () => {
    const player = makePlayer();
    const onplay = vi.fn();
    const { instance } = render(Probe, { onplay });
    player.play(tracks(1));
    expect(onplay).toHaveBeenCalledTimes(1);
    unmount(instance);
    mounted.splice(mounted.indexOf(instance), 1);
    player.pause();
    player.play();
    expect(onplay).toHaveBeenCalledTimes(1);
  });

  it('the player is still a plain Svelte store', () => {
    const player = makePlayer();
    const seen: string[] = [];
    const off = player.subscribe((state) => seen.push(state.status));
    player.play(tracks(1));
    off();
    expect(seen[0]).toBe('idle');
    expect(seen.at(-1)).toBe('playing');
  });
});
