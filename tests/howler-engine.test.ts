// @vitest-environment jsdom
// Runs the real Howler. jsdom can't decode audio, but Howler reports sources it can't
// pick a codec for while it is still constructing, which is the path that matters here.
import { describe, expect, it } from 'vitest';
import { HowlerEngine } from '../src/engine/howler';
import type { EngineHandlers } from '../src/engine/types';

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

function recorder() {
  const calls: string[] = [];
  const handlers: EngineHandlers = {
    load: () => calls.push('load'),
    loadError: (message) => calls.push(`error: ${message}`),
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    end: () => calls.push('end'),
    playError: () => calls.push('playError'),
    unlock: () => calls.push('unlock'),
  };
  return { calls, handlers };
}

// No file extension and no `format` hint: Howler can't pick a decoder.
const undecodable = { src: '/api/stream/42' };

describe('HowlerEngine', () => {
  it('reports load errors Howler raises while constructing', async () => {
    const engine = new HowlerEngine();
    const { calls, handlers } = recorder();
    engine.load(undecodable, handlers);
    await settle();
    expect(calls).toEqual(['error: No codec support for selected audio sources.']);
  });

  it('reports the error of a preload that failed before it was needed', async () => {
    const engine = new HowlerEngine();
    engine.preload(undecodable);
    await settle();
    const { calls, handlers } = recorder();
    engine.load(undecodable, handlers);
    await settle();
    expect(calls).toEqual(['error: No codec support for selected audio sources.']);
  });

  it('reports the error of a preload that fails right after it is adopted', async () => {
    const engine = new HowlerEngine();
    engine.preload(undecodable);
    const { calls, handlers } = recorder();
    engine.load(undecodable, handlers); // same tick: the error is still in flight
    await settle();
    expect(calls).toEqual(['error: No codec support for selected audio sources.']);
  });

  it('keeps events of a replaced track and of a preload away from the current handlers', async () => {
    const engine = new HowlerEngine();
    const first = recorder();
    engine.load(undecodable, first.handlers);
    const second = recorder();
    engine.load({ src: '/api/stream/43' }, second.handlers);
    engine.preload({ src: '/api/stream/44' });
    await settle();
    // Every one of them fails; only the current track's error may arrive, once.
    expect(first.calls).toEqual([]);
    expect(second.calls).toHaveLength(1);
  });
});
