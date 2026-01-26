/**
 * Vue Composable for MakeNoise Player
 * 
 * Provides a Vue composable that subscribes to player state changes
 * and returns reactive state along with control methods.
 * 
 * Requirements: 12.1, 12.2, 12.3
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { MakeNoise } from '../../core/MakeNoise';
import type { PlayerState, Track, RepeatMode } from '../../core/types';

/**
 * Return type for useMakeNoise composable
 */
export interface UseMakeNoiseReturn {
  /** Reactive player state */
  state: Ref<PlayerState>;
  /** Reactive queue */
  queue: Ref<Track[]>;
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
 * Vue composable for MakeNoise player
 * 
 * Subscribes to player state changes and provides control methods.
 * Automatically cleans up event subscriptions when component unmounts.
 * 
 * Returns reactive refs for state and playlist that automatically
 * update when the player state changes.
 * 
 * @returns Reactive player state and control methods
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useMakeNoise } from '@makenoise/vue';
 * 
 * const { state, play, pause, playlist } = useMakeNoise();
 * </script>
 * 
 * <template>
 *   <div>
 *     <h1>{{ state.currentTrack?.title }}</h1>
 *     <button @click="play()">
 *       {{ state.isPlaying ? 'Pause' : 'Play' }}
 *     </button>
 *   </div>
 * </template>
 * ```
 */
export function useMakeNoise(): UseMakeNoiseReturn {
  // Get the singleton Player instance
  const player = MakeNoise.getInstance();

  // Create reactive refs for state and queue
  const state = ref<PlayerState>(player.getState());
  const queue = ref<Track[]>([...player.getQueue()]);

  // Handler for state changes
  const handleStateChange = () => {
    state.value = player.getState();
  };

  // Handler for queue changes
  const handleQueueChange = () => {
    queue.value = [...player.getQueue()];
  };

  // Subscribe to player events on mount
  onMounted(() => {
    player.on('statechange', handleStateChange);
    player.on('queuechange', handleQueueChange);
  });

  // Unsubscribe from player events on unmount
  onUnmounted(() => {
    player.off('statechange', handleStateChange);
    player.off('queuechange', handleQueueChange);
  });

  // Return reactive state, queue, and control methods
  return {
    state,
    queue,
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
}
