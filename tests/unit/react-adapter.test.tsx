/**
 * Unit tests for React adapter
 * 
 * Tests the useMakeNoise hook and MediaPlayerProvider context.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React, { createElement } from 'react';
import { useMakeNoise } from '../../src/adapters/react/useMakeNoise';
import { MediaPlayerProvider, useMediaPlayer } from '../../src/adapters/react/MediaPlayerContext';
import { MakeNoise } from '../../src/core/MakeNoise';
import type { Track } from '../../src/core/types';

// Reset singleton between tests
beforeEach(() => {
  // Clear localStorage
  localStorage.clear();
  
  // Reset singleton instance
  (MakeNoise as any)._instance = null;
});

afterEach(() => {
  // Reset singleton instance
  (MakeNoise as any)._instance = null;
});

describe('useMakeNoise hook', () => {
  it('should return initial player state', () => {
    const { result } = renderHook(() => useMakeNoise());

    expect(result.current.state).toBeDefined();
    expect(result.current.state.isPlaying).toBe(false);
    expect(result.current.state.isPaused).toBe(true);
    expect(result.current.state.volume).toBe(1);
    expect(result.current.queue).toEqual([]);
  });

  it('should return control methods', () => {
    const { result } = renderHook(() => useMakeNoise());

    expect(typeof result.current.play).toBe('function');
    expect(typeof result.current.pause).toBe('function');
    expect(typeof result.current.togglePlayPause).toBe('function');
    expect(typeof result.current.seek).toBe('function');
    expect(typeof result.current.setVolume).toBe('function');
    expect(typeof result.current.setPlaybackRate).toBe('function');
    expect(typeof result.current.next).toBe('function');
    expect(typeof result.current.previous).toBe('function');
    expect(typeof result.current.addToQueue).toBe('function');
    expect(typeof result.current.playNext).toBe('function');
    expect(typeof result.current.removeFromQueue).toBe('function');
    expect(typeof result.current.clearQueue).toBe('function');
    expect(typeof result.current.reorderQueue).toBe('function');
    expect(typeof result.current.loadTracksToQueue).toBe('function');
    expect(typeof result.current.jumpToQueueIndex).toBe('function');
    expect(typeof result.current.setRepeatMode).toBe('function');
    expect(typeof result.current.toggleShuffle).toBe('function');
  });

  it('should update state when volume changes', async () => {
    const { result } = renderHook(() => useMakeNoise());

    act(() => {
      result.current.setVolume(0.5);
    });

    await waitFor(() => {
      expect(result.current.state.volume).toBe(0.5);
    });
  });

  it('should update queue when tracks are added', async () => {
    const { result } = renderHook(() => useMakeNoise());

    const track: Track = {
      id: '1',
      src: 'https://example.com/track1.mp3',
      title: 'Test Track',
      artist: 'Test Artist',
    };

    act(() => {
      result.current.addToQueue(track);
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]).toMatchObject({
        id: '1',
        title: 'Test Track',
      });
    });
  });

  it('should maintain same control method references across re-renders', () => {
    const { result, rerender } = renderHook(() => useMakeNoise());

    const initialPlay = result.current.play;
    const initialPause = result.current.pause;

    // Trigger a re-render by changing volume
    act(() => {
      result.current.setVolume(0.8);
    });

    rerender();

    // Control methods should maintain referential equality
    expect(result.current.play).toBe(initialPlay);
    expect(result.current.pause).toBe(initialPause);
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useMakeNoise());

    const player = MakeNoise.getInstance();
    const eventEmitter = (player as any)._eventEmitter;
    
    // Get initial listener count
    const initialStateChangeListeners = eventEmitter._events.get('statechange')?.size || 0;
    const initialqueueChangeListeners = eventEmitter._events.get('queuechange')?.size || 0;

    unmount();

    // After unmount, listeners should be removed
    const finalStateChangeListeners = eventEmitter._events.get('statechange')?.size || 0;
    const finalqueueChangeListeners = eventEmitter._events.get('queuechange')?.size || 0;

    expect(finalStateChangeListeners).toBeLessThan(initialStateChangeListeners);
    expect(finalqueueChangeListeners).toBeLessThan(initialqueueChangeListeners);
  });
});

describe('MediaPlayerProvider and useMediaPlayer', () => {
  it('should provide player instance to child components', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(MediaPlayerProvider, null, children);

    const { result } = renderHook(() => useMediaPlayer(), { wrapper });

    expect(result.current).toBeInstanceOf(MakeNoise);
  });

  it('should throw error when useMediaPlayer is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      renderHook(() => useMediaPlayer());
    }).toThrow('useMediaPlayer must be used within a MediaPlayerProvider');

    console.error = originalError;
  });

  it('should provide same player instance to multiple hooks', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(MediaPlayerProvider, null, children);

    const { result: result1 } = renderHook(() => useMediaPlayer(), { wrapper });
    const { result: result2 } = renderHook(() => useMediaPlayer(), { wrapper });

    expect(result1.current).toBe(result2.current);
  });
});
