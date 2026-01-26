/**
 * MakeNoise.js Type Definitions
 * 
 * Core TypeScript interfaces and types for the MakeNoise audio player library.
 */

/**
 * Represents a media track with metadata
 */
export interface Track {
  /** Unique identifier for the track */
  id: string;
  /** Audio file URL */
  src: string;
  /** Track title */
  title: string;
  /** Artist name (optional) */
  artist?: string;
  /** Album artwork URL (optional) */
  artwork?: string;
  /** Duration in seconds (optional, auto-detected) */
  duration?: number;
  /** Allow custom metadata extensions */
  [key: string]: any;
}

/**
 * Repeat mode options for playlist playback
 */
export type RepeatMode = 'none' | 'one' | 'all';

/**
 * Error codes for player errors
 */
export type PlayerErrorCode = 
  | 'MEDIA_LOAD_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNSUPPORTED_FORMAT'
  | 'STATE_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Player error information
 */
export interface PlayerError {
  /** Error code identifying the error type */
  code: PlayerErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional error details (optional) */
  details?: {
    context: string;
    timestamp: number;
    state?: any;
    originalError?: Error;
  };
}

/**
 * Complete player state
 */
export interface PlayerState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether audio is paused */
  isPaused: boolean;
  /** Whether audio is loading */
  isLoading: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration of current track in seconds */
  duration: number;
  /** Volume level (0-1) */
  volume: number;
  /** Playback rate (0.5-2.0 typically) */
  playbackRate: number;
  /** Currently playing track */
  currentTrack: Track | null;
  /** Index of current track in queue */
  currentQueueIndex: number;
  /** Total number of tracks in queue */
  queueLength: number;
  /** Repeat mode setting */
  repeatMode: RepeatMode;
  /** Whether shuffle mode is enabled */
  isShuffling: boolean;
  /** Current error if any */
  error: PlayerError | null;
}

/**
 * Player event names
 */
export type PlayerEvents =
  | 'play'
  | 'pause'
  | 'ended'
  | 'timeupdate'
  | 'durationchange'
  | 'volumechange'
  | 'ratechange'
  | 'trackchange'
  | 'queuechange'
  | 'error'
  | 'statechange'
  | 'loading'
  | 'loadeddata'
  | 'seeking'
  | 'seeked';

/**
 * Event handler function type
 */
export type EventHandler = (payload?: any) => void;

/**
 * Event emitter interface
 */
export interface EventEmitter {
  /** Subscribe to an event */
  on(event: PlayerEvents, handler: EventHandler): void;
  /** Unsubscribe from an event */
  off(event: PlayerEvents, handler: EventHandler): void;
  /** Emit an event with optional payload */
  emit(event: PlayerEvents, payload?: any): void;
  /** Remove all listeners for an event or all events */
  removeAllListeners(event?: PlayerEvents): void;
}

/**
 * Player configuration options
 */
export interface PlayerConfig {
  /** Whether to persist state to localStorage (default: true) */
  persistState?: boolean;
  /** Key used for localStorage persistence (default: 'makenoise_state') */
  persistenceKey?: string;
  /** Enable keyboard shortcuts (default: true) */
  enableKeyboardShortcuts?: boolean;
  /** Enable Media Session API integration (default: true) */
  enableMediaSession?: boolean;
  /** Initial volume level 0-1 (default: 1.0) */
  initialVolume?: number;
  /** Preload strategy for audio element (default: 'metadata') */
  preloadStrategy?: 'none' | 'metadata' | 'auto';
}

/**
 * Simplified track representation for persistence
 */
export interface SimplifiedTrack {
  id: string;
  src: string;
  title: string;
  artist?: string;
  artwork?: string;
}

/**
 * Persisted state schema for localStorage
 */
export interface PersistedState {
  /** Schema version for migrations */
  version: string;
  /** ID of current track */
  currentTrackId: string | null;
  /** Current playback position */
  currentTime: number;
  /** Volume level */
  volume: number;
  /** Playback rate */
  playbackRate: number;
  /** Repeat mode */
  repeatMode: RepeatMode;
  /** Shuffle state */
  isShuffling: boolean;
  /** Simplified queue */
  queue: SimplifiedTrack[];
  /** Current queue index */
  currentQueueIndex: number;
}
