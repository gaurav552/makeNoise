/**
 * MakeNoise.js Constants
 * 
 * Default configuration values and constant definitions for the MakeNoise audio player.
 */

import type { PlayerConfig, PlayerState } from './types';

/**
 * Default localStorage key for state persistence
 */
export const DEFAULT_PERSISTENCE_KEY = 'makenoise_state';

/**
 * Current schema version for persisted state
 */
export const PERSISTENCE_SCHEMA_VERSION = '1.0.0';

/**
 * Default player configuration
 */
export const DEFAULT_PLAYER_CONFIG: Required<PlayerConfig> = {
  persistState: true,
  persistenceKey: DEFAULT_PERSISTENCE_KEY,
  enableKeyboardShortcuts: true,
  enableMediaSession: true,
  initialVolume: 1.0,
  preloadStrategy: 'metadata',
};

/**
 * Default initial player state
 */
export const DEFAULT_PLAYER_STATE: PlayerState = {
  isPlaying: false,
  isPaused: true,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 1.0,
  playbackRate: 1.0,
  currentTrack: null,
  currentQueueIndex: -1,
  queueLength: 0,
  repeatMode: 'none',
  isShuffling: false,
  error: null,
};

/**
 * Player event names
 */
export const PLAYER_EVENTS = {
  PLAY: 'play',
  PAUSE: 'pause',
  ENDED: 'ended',
  TIMEUPDATE: 'timeupdate',
  DURATIONCHANGE: 'durationchange',
  VOLUMECHANGE: 'volumechange',
  RATECHANGE: 'ratechange',
  TRACKCHANGE: 'trackchange',
  QUEUECHANGE: 'queuechange',
  ERROR: 'error',
  STATECHANGE: 'statechange',
  LOADING: 'loading',
  LOADEDDATA: 'loadeddata',
  SEEKING: 'seeking',
  SEEKED: 'seeked',
} as const;

/**
 * Keyboard shortcut key codes
 */
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_PLAY_PAUSE: ' ',      // Space
  TOGGLE_MUTE: 'm',
  SEEK_FORWARD: 'ArrowRight',
  SEEK_BACKWARD: 'ArrowLeft',
  VOLUME_UP: 'ArrowUp',
  VOLUME_DOWN: 'ArrowDown',
} as const;

/**
 * Seek increment in seconds for keyboard shortcuts
 */
export const SEEK_INCREMENT = 10;

/**
 * Volume increment for keyboard shortcuts
 */
export const VOLUME_INCREMENT = 0.1;

/**
 * Debounce delay for state persistence on timeupdate (milliseconds)
 */
export const PERSISTENCE_DEBOUNCE_DELAY = 5000;

/**
 * Threshold in seconds for previous track behavior
 * If currentTime > this value, previous() restarts current track
 */
export const PREVIOUS_TRACK_THRESHOLD = 3;

/**
 * Minimum and maximum volume values
 */
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;

/**
 * Typical playback rate range
 */
export const PLAYBACK_RATE_MIN = 0.5;
export const PLAYBACK_RATE_MAX = 2.0;
