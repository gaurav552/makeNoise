// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, effectScope, h, nextTick, watch } from 'vue';
import { createPlayer, type Player } from '../src/player';
import { playerKey, providePlayer, usePlayer, usePlayerEvent, usePlayerState, useProgress } from '../src/vue';
import { FakeEngine, tracks } from './helpers';

const players: Player[] = [];

function makePlayer() {
  const player = createPlayer({ engine: new FakeEngine(), mediaSession: false });
  players.push(player);
  return player;
}

afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
});

/** Mounts a component and returns what its setup produced. */
function withSetup<R>(setup: () => R, configure?: (app: ReturnType<typeof createApp>) => void) {
  let result!: R;
  const app = createApp(defineComponent({ setup: () => ((result = setup()), () => null) }));
  configure?.(app);
  app.mount(document.createElement('div'));
  return { result, app };
}

describe('usePlayer', () => {
  it('uses the default player, even outside a component', () => {
    const player = makePlayer();
    expect(usePlayer()).toBe(player);
    expect(withSetup(() => usePlayer()).result).toBe(player);
  });

  it('prefers a player provided to the app', () => {
    makePlayer();
    const other = makePlayer();
    const { result } = withSetup(usePlayer, (app) => app.provide(playerKey, other));
    expect(result).toBe(other);
  });

  it('prefers a player provided by an ancestor', () => {
    makePlayer();
    const other = makePlayer();
    let found: Player | null = null;
    const Child = defineComponent({ setup: () => ((found = usePlayer()), () => null) });
    const Parent = defineComponent({ setup: () => (providePlayer(other), () => h(Child)) });
    createApp(Parent).mount(document.createElement('div'));
    expect(found).toBe(other);
  });

  it('throws a helpful error when there is no player', () => {
    expect(() => usePlayer()).toThrow(/No player found/);
  });
});

describe('usePlayerState', () => {
  it('follows the player state and stops with its scope', () => {
    const player = makePlayer();
    const scope = effectScope();
    const state = scope.run(() => usePlayerState())!;
    expect(state.value.status).toBe('idle');
    player.play(tracks(3));
    expect(state.value.status).toBe('playing');
    scope.stop();
    player.pause();
    expect(state.value.status).toBe('playing');
  });

  it('notifies watchers only when the selected value changes', async () => {
    const player = makePlayer();
    const scope = effectScope();
    const seen: boolean[] = [];
    scope.run(() => watch(usePlayerState((s) => s.shuffle), (value) => seen.push(value)));
    player.setVolume(0.2);
    player.toggleShuffle();
    await nextTick();
    expect(seen).toEqual([true]);
    scope.stop();
  });
});

describe('useProgress', () => {
  it('follows progress and supports selectors', () => {
    const player = makePlayer();
    player.play(tracks(1));
    const scope = effectScope();
    const [progress, seconds] = scope.run(() => [useProgress(), useProgress((p) => Math.floor(p.currentTime))] as const)!;
    player.seek(42.6);
    expect(progress.value.currentTime).toBe(42.6);
    expect(seconds.value).toBe(42);
    scope.stop();
  });
});

describe('usePlayerEvent', () => {
  it('unsubscribes when the scope stops', () => {
    const player = makePlayer();
    const handler = vi.fn();
    const scope = effectScope();
    scope.run(() => usePlayerEvent('play', handler));
    player.play(tracks(1));
    expect(handler).toHaveBeenCalledTimes(1);
    scope.stop();
    player.pause();
    player.play();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
