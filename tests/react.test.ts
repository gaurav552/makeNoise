// @vitest-environment jsdom
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPlayer, type Player } from '../src/player';
import { PlayerProvider, usePlayer, usePlayerEvent, usePlayerState, useProgress } from '../src/react';
import { FakeEngine, tracks } from './helpers';

const players: Player[] = [];

function makePlayer() {
  const player = createPlayer({ engine: new FakeEngine(), mediaSession: false });
  players.push(player);
  return player;
}

afterEach(() => {
  cleanup();
  for (const player of players.splice(0)) player.destroy();
});

describe('usePlayer', () => {
  it('uses the default player', () => {
    const player = makePlayer();
    const { result } = renderHook(() => usePlayer());
    expect(result.current).toBe(player);
  });

  it('prefers the player from <PlayerProvider>', () => {
    makePlayer();
    const other = makePlayer();
    const wrapper = ({ children }: { children: ReactNode }) => createElement(PlayerProvider, { player: other }, children);
    const { result } = renderHook(() => usePlayer(), { wrapper });
    expect(result.current).toBe(other);
  });

  it('throws a helpful error when there is no player', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => usePlayer())).toThrow(/No player found/);
    vi.restoreAllMocks();
  });
});

it('keeps working when the default player is destroyed, and picks up its replacement', () => {
  const player = makePlayer();
  player.play(tracks(1));
  const { result } = renderHook(() => usePlayerState((s) => s.current?.track.id ?? null), { reactStrictMode: true });
  expect(result.current).toBe('t1');
  act(() => player.destroy());
  expect(result.current).toBe('t1');
  let next!: Player;
  act(() => {
    next = makePlayer();
  });
  act(() => next.play(tracks(1, 'n')));
  expect(result.current).toBe('n1');
});

describe('usePlayerState', () => {
  it('follows the player state', () => {
    const player = makePlayer();
    const { result } = renderHook(() => usePlayerState());
    expect(result.current.status).toBe('idle');
    act(() => player.play(tracks(3)));
    expect(result.current.status).toBe('playing');
    expect(result.current.queue).toHaveLength(3);
  });

  it('re-renders only when the selected value changes', () => {
    const player = makePlayer();
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return usePlayerState((s) => s.shuffle);
    });
    const before = renders;
    act(() => player.setVolume(0.3));
    act(() => player.setRepeat('all'));
    expect(renders).toBe(before);
    act(() => player.toggleShuffle());
    expect(result.current).toBe(true);
    expect(renders).toBe(before + 1);
  });
});

describe('useProgress', () => {
  it('follows progress and supports selectors', () => {
    const player = makePlayer();
    player.play(tracks(1));
    const { result } = renderHook(() => ({
      progress: useProgress(),
      seconds: useProgress((p) => Math.floor(p.currentTime)),
    }));
    act(() => player.seek(42.6));
    expect(result.current.progress.currentTime).toBe(42.6);
    expect(result.current.seconds).toBe(42);
  });
});

describe('usePlayerEvent', () => {
  it('calls the latest handler and unsubscribes on unmount', () => {
    const player = makePlayer();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(({ handler }) => usePlayerEvent('play', handler), {
      initialProps: { handler: first },
    });
    rerender({ handler: second });
    act(() => player.play(tracks(1)));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    unmount();
    act(() => {
      player.pause();
      player.play();
    });
    expect(second).toHaveBeenCalledTimes(1);
  });
});

it('renders a component bound to the player', () => {
  const player = makePlayer();
  function NowPlaying() {
    const title = usePlayerState((s) => s.current?.track.title ?? 'nothing');
    return createElement('p', null, title);
  }
  const { container } = render(createElement(NowPlaying));
  expect(container.textContent).toBe('nothing');
  act(() => player.play(tracks(2)));
  expect(container.textContent).toBe('t1');
  act(() => player.next());
  expect(container.textContent).toBe('t2');
});
