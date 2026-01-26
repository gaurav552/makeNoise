/**
 * MakeNoise.js - Framework-agnostic global media player library
 * 
 * Main library entry point exporting all public APIs.
 * 
 * @packageDocumentation
 */

// Export main player class
export { MakeNoise } from './core/MakeNoise';

// Export event emitter
export { SimpleEventEmitter } from './core/EventEmitter';

// Export all types and interfaces
export type {
  Track,
  RepeatMode,
  PlayerErrorCode,
  PlayerError,
  PlayerState,
  PlayerEvents,
  EventHandler,
  EventEmitter,
  PlayerConfig,
  SimplifiedTrack,
  PersistedState,
} from './core/types';

// Export constants
export {
  DEFAULT_PERSISTENCE_KEY,
  PERSISTENCE_SCHEMA_VERSION,
  DEFAULT_PLAYER_CONFIG,
  DEFAULT_PLAYER_STATE,
  PLAYER_EVENTS,
  KEYBOARD_SHORTCUTS,
  SEEK_INCREMENT,
  VOLUME_INCREMENT,
  PERSISTENCE_DEBOUNCE_DELAY,
  PREVIOUS_TRACK_THRESHOLD,
  VOLUME_MIN,
  VOLUME_MAX,
  PLAYBACK_RATE_MIN,
  PLAYBACK_RATE_MAX,
} from './core/constants';

// Export Web Component UI
export { PlayerUIElement } from './ui/PlayerUI';

// Note: Adapters (React, Vue) should be imported from their respective subpaths
// e.g., import { ... } from 'makenoise/react'

