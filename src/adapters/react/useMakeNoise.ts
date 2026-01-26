/**
 * React Hook for MakeNoise Player
 * 
 * Provides a React hook that subscribes to player state changes
 * and returns the current state along with memoized control methods.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.6
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import { MakeNoise } from '../../core/MakeNoise';
import type { PlayerState, Track, RepeatMode } from '../../core/types';

/**
 * Return type for useMakeNoise hook
 */
export interface UseMakeNoiseReturn {
  /** Current player state */
  state: PlayerState;
  /** Current queue */
  queue: Track[];
  /** Play a track or resume playback */
  play: (trackOrIndex?: Track | number) => Promise<void>;
  /** Pause playback */
  pause: () => void;
  /** Toggle between play and pause */
  togglePlayPause: () => void;
  /** Seek to a specific time */
  seek: (time: number) => void;
  /** Set volume level (0-1) */
  setVolume: (volume: number) => void;
  /** Set playback rate */
  setPlaybackRate: (rate: number) => void;
  /** Play next track in queue */
  next: () => void;
  /** Play previous track in queue */
  previous: () => void;
  /** Add track(s) to end of queue */
  addToQueue: (track: Track | Track[]) => void;
  /** Add track(s) to play next (after current track) */
  playNext: (track: Track | Track[]) => void;
  /** Remove track from queue */
  removeFromQueue: (index: number) => void;
  /** Clear entire queue */
  clearQueue: () => void;
  /** Reorder queue by moving track from one position to another */
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  /** Load tracks into queue, optionally replacing existing queue */
  loadTracksToQueue: (tracks: Track[], playImmediately?: boolean) => void;
  /** Jump to specific position in queue */
  jumpToQueueIndex: (index: number, autoPlay?: boolean) => void;
  /** Set repeat mode */
  setRepeatMode: (mode: RepeatMode) => void;
  /** Toggle shuffle mode */
  toggleShuffle: () => void;
}

/**
 * React hook for MakeNoise player
 * 
 * Subscribes to player state changes and provides control methods.
 * Automatically cleans up event subscriptions when component unmounts.
 * 
 * Control methods are memoized to prevent unnecessary re-renders.
 * 
 * @returns Player state and control methods
 * 
 * @example
 * ```tsx
 * function MyPlayer() {
 *   const { state, play, pause, playlist } = useMakeNoise();
 *   
 *   return (
 *     <div>
 *       <h1>{state.currentTrack?.title}</h1>
 *       <button onClick={() => play()}>
 *         {state.isPlaying ? 'Pause' : 'Play'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMakeNoise(): UseMakeNoiseReturn {
  // Use ref to hold Player instance (persists across renders)
  // Initialize on first render using lazy initialization
  const playerRef = useRef<MakeNoise | null>(null);
  
  if (!playerRef.current) {
    playerRef.current = MakeNoise.getInstance();
  }

  // State for player state (triggers re-renders on changes)
  const [state, setState] = useState<PlayerState>(() => {
    return playerRef.current!.getState();
  });

  // State for queue (triggers re-renders on changes)
  const [queue, setQueue] = useState<Track[]>(() => {
    return [...playerRef.current!.getQueue()];
  });

  // Subscribe to player events on mount, unsubscribe on unmount
  useEffect(() => {
    const player = playerRef.current!;

    // Handler for state changes
    const handleStateChange = () => {
      setState(player.getState());
    };

    // Handler for queue changes
    const handleQueueChange = () => {
      setQueue([...player.getQueue()]);
    };

    // Subscribe to events
    player.on('statechange', handleStateChange);
    player.on('queuechange', handleQueueChange);

    // Cleanup: unsubscribe from events when component unmounts
    return () => {
      player.off('statechange', handleStateChange);
      player.off('queuechange', handleQueueChange);
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Memoize control methods to prevent unnecessary re-renders
  // These methods don't depend on any state, so they can be memoized once
  const controls = useMemo(() => {
    const player = playerRef.current!;
    
    return {
      play: (trackOrIndex?: Track | number) => player.play(trackOrIndex),
      pause: () => player.pause(),
      togglePlayPause: () => player.togglePlayPause(),
      seek: (time: number) => player.seek(time),
      setVolume: (volume: number) => player.setVolume(volume),
      setPlaybackRate: (rate: number) => player.setPlaybackRate(rate),
      next: () => player.next(),
      previous: () => player.previous(),
      addToQueue: (track: Track | Track[]) => player.addToQueue(track),
      playNext: (track: Track | Track[]) => player.playNext(track),
      removeFromQueue: (index: number) => player.removeFromQueue(index),
      clearQueue: () => player.clearQueue(),
      reorderQueue: (fromIndex: number, toIndex: number) => player.reorderQueue(fromIndex, toIndex),
      loadTracksToQueue: (tracks: Track[], playImmediately?: boolean) => player.loadTracksToQueue(tracks, playImmediately),
      jumpToQueueIndex: (index: number, autoPlay?: boolean) => player.jumpToQueueIndex(index, autoPlay),
      setRepeatMode: (mode: RepeatMode) => player.setRepeatMode(mode),
      toggleShuffle: () => player.toggleShuffle(),
    };
  }, []); // Empty dependency array - memoize once

  // Return state, queue, and control methods
  return {
    state,
    queue,
    ...controls,
  };
}
