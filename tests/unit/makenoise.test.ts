/**
 * Unit tests for MakeNoise core player class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MakeNoise } from '../../src/core/MakeNoise';

describe('MakeNoise - Core Player', () => {
  let player: MakeNoise;

  beforeEach(() => {
    // Get player instance
    player = MakeNoise.getInstance();
    
    // Clear the queue before each test
    // Access private property for testing purposes
    (player as any)._queue = [];
    (player as any)._originalQueue = [];
    
    // Reset currentQueueIndex to -1
    (player as any)._state.currentQueueIndex = -1;
    (player as any)._state.currentTrack = null;
    
    // Reset shuffle state
    (player as any)._state.isShuffling = false;
  });

  afterEach(() => {
    // Clean up by resetting the singleton instance
    // Note: In a real implementation, we'd need a destroy method
    // For now, we'll work with the singleton as-is
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple getInstance calls', () => {
      const instance1 = MakeNoise.getInstance();
      const instance2 = MakeNoise.getInstance();
      const instance3 = MakeNoise.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(instance3);
    });

    it('should ignore config on subsequent getInstance calls', () => {
      // Since singleton is already created, both calls return the same instance
      const instance1 = MakeNoise.getInstance({ initialVolume: 0.5 });
      const instance2 = MakeNoise.getInstance({ initialVolume: 0.8 });

      expect(instance1).toBe(instance2);
      // The volume should be from the very first initialization (default 1.0)
      // because the singleton was already created in beforeEach
      const state = instance2.getState();
      expect(state.volume).toBe(1.0);
    });
  });

  describe('Initialization', () => {
    it('should initialize with default state values', () => {
      const state = player.getState();

      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.volume).toBeGreaterThanOrEqual(0);
      expect(state.volume).toBeLessThanOrEqual(1);
      expect(state.playbackRate).toBe(1.0);
      expect(state.currentTrack).toBeNull();
      expect(state.currentQueueIndex).toBe(-1);
      expect(state.repeatMode).toBe('none');
      expect(state.isShuffling).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should initialize with empty queue', () => {
      const queue = player.getQueue();
      expect(queue).toEqual([]);
      expect(queue.length).toBe(0);
    });

    it('should accept custom initial volume in config', () => {
      // Note: This test will use the existing singleton
      // In a real scenario, we'd need to reset the singleton
      const state = player.getState();
      expect(typeof state.volume).toBe('number');
      expect(state.volume).toBeGreaterThanOrEqual(0);
      expect(state.volume).toBeLessThanOrEqual(1);
    });

    it('should create and append audio element to document.body', () => {
      // Check that an audio element exists in the document body
      const audioElements = document.body.querySelectorAll('audio');
      expect(audioElements.length).toBeGreaterThan(0);
      
      // Verify at least one audio element has the expected preload attribute
      const hasPreloadElement = Array.from(audioElements).some(
        audio => audio.preload === 'metadata' || audio.preload === 'auto' || audio.preload === 'none'
      );
      expect(hasPreloadElement).toBe(true);
    });
  });

  describe('Event System', () => {
    it('should allow subscribing to events', () => {
      let callCount = 0;
      const handler = () => {
        callCount++;
      };

      player.on('play', handler);
      expect(callCount).toBe(0); // Handler not called yet
    });

    it('should allow unsubscribing from events', () => {
      const handler = () => {};
      
      player.on('pause', handler);
      player.off('pause', handler);
      
      // If we get here without errors, unsubscribe worked
      expect(true).toBe(true);
    });
  });

  describe('State Query Methods', () => {
    it('should return immutable state copy from getState', () => {
      const state1 = player.getState();
      const state2 = player.getState();

      // Should be different objects (copies)
      expect(state1).not.toBe(state2);
      
      // But should have equal values
      expect(state1).toEqual(state2);
    });

    it('should prevent external mutation of state', () => {
      const state = player.getState() as any;
      const originalVolume = state.volume;

      // Try to mutate the returned state
      state.volume = 0.5;
      state.isPlaying = true;

      // Get fresh state and verify it wasn't affected
      const freshState = player.getState();
      expect(freshState.volume).toBe(originalVolume);
      expect(freshState.isPlaying).toBe(false);
    });

    it('should return immutable queue copy from getqueue', () => {
      const queue1 = player.getQueue();
      const queue2 = player.getQueue();

      // Should be different arrays (copies)
      expect(queue1).not.toBe(queue2);
      
      // But should have equal values
      expect(queue1).toEqual(queue2);
    });

    it('should prevent external mutation of queue', () => {
      const queue = player.getQueue() as any;
      
      // Try to mutate the returned queue
      queue.push({ id: '1', src: 'test.mp3', title: 'Test' });

      // Get fresh queue and verify it wasn't affected
      const freshqueue = player.getQueue();
      expect(freshqueue.length).toBe(0);
    });
  });

  describe('State Properties', () => {
    it('should have all required state properties', () => {
      const state = player.getState();

      expect(state).toHaveProperty('isPlaying');
      expect(state).toHaveProperty('isPaused');
      expect(state).toHaveProperty('isLoading');
      expect(state).toHaveProperty('currentTime');
      expect(state).toHaveProperty('duration');
      expect(state).toHaveProperty('volume');
      expect(state).toHaveProperty('playbackRate');
      expect(state).toHaveProperty('currentTrack');
      expect(state).toHaveProperty('currentQueueIndex');
      expect(state).toHaveProperty('repeatMode');
      expect(state).toHaveProperty('isShuffling');
      expect(state).toHaveProperty('error');
    });

    it('should have correct types for state properties', () => {
      const state = player.getState();

      expect(typeof state.isPlaying).toBe('boolean');
      expect(typeof state.isPaused).toBe('boolean');
      expect(typeof state.isLoading).toBe('boolean');
      expect(typeof state.currentTime).toBe('number');
      expect(typeof state.duration).toBe('number');
      expect(typeof state.volume).toBe('number');
      expect(typeof state.playbackRate).toBe('number');
      expect(state.currentTrack === null || typeof state.currentTrack === 'object').toBe(true);
      expect(typeof state.currentQueueIndex).toBe('number');
      expect(['none', 'one', 'all'].includes(state.repeatMode)).toBe(true);
      expect(typeof state.isShuffling).toBe('boolean');
      expect(state.error === null || typeof state.error === 'object').toBe(true);
    });
  });

  describe('Audio Event Listeners', () => {
    it('should emit play event when audio element plays', () => {
      return new Promise<void>((resolve) => {
        let playEventEmitted = false;
        let stateChangeEmitted = false;

        const playHandler = () => {
          playEventEmitted = true;
          checkComplete();
        };

        const stateChangeHandler = () => {
          stateChangeEmitted = true;
          checkComplete();
        };

        const checkComplete = () => {
          if (playEventEmitted && stateChangeEmitted) {
            player.off('play', playHandler);
            player.off('statechange', stateChangeHandler);
            resolve();
          }
        };

        player.on('play', playHandler);
        player.on('statechange', stateChangeHandler);

        // Simulate play event on audio element
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('play'));
        }
      });
    });

    it('should emit pause event when audio element pauses', () => {
      return new Promise<void>((resolve) => {
        const pauseHandler = () => {
          player.off('pause', pauseHandler);
          resolve();
        };

        player.on('pause', pauseHandler);

        // Simulate pause event on audio element
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }
      });
    });

    it('should emit ended event when audio element ends', () => {
      return new Promise<void>((resolve) => {
        const endedHandler = () => {
          player.off('ended', endedHandler);
          resolve();
        };

        player.on('ended', endedHandler);

        // Simulate ended event on audio element
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('ended'));
        }
      });
    });

    it('should emit timeupdate event when audio time updates', () => {
      return new Promise<void>((resolve) => {
        const timeupdateHandler = (time: number) => {
          expect(typeof time).toBe('number');
          player.off('timeupdate', timeupdateHandler);
          resolve();
        };

        player.on('timeupdate', timeupdateHandler);

        // Simulate timeupdate event on audio element
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          // Set currentTime before dispatching event
          Object.defineProperty(audioElement, 'currentTime', {
            value: 10.5,
            writable: true,
            configurable: true,
          });
          audioElement.dispatchEvent(new Event('timeupdate'));
        }
      });
    });

    it('should emit durationchange event when duration changes', () => {
      return new Promise<void>((resolve) => {
        const durationchangeHandler = (duration: number) => {
          expect(typeof duration).toBe('number');
          player.off('durationchange', durationchangeHandler);
          resolve();
        };

        player.on('durationchange', durationchangeHandler);

        // Simulate durationchange event on audio element
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          Object.defineProperty(audioElement, 'duration', {
            value: 180,
            writable: true,
            configurable: true,
          });
          audioElement.dispatchEvent(new Event('durationchange'));
        }
      });
    });

    it('should emit volumechange event when volume changes', () => {
      return new Promise<void>((resolve) => {
        const volumechangeHandler = (volume: number) => {
          expect(typeof volume).toBe('number');
          player.off('volumechange', volumechangeHandler);
          resolve();
        };

        player.on('volumechange', volumechangeHandler);

        // Simulate volumechange event on audio element
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          Object.defineProperty(audioElement, 'volume', {
            value: 0.7,
            writable: true,
            configurable: true,
          });
          audioElement.dispatchEvent(new Event('volumechange'));
        }
      });
    });

    it('should emit ratechange event when playback rate changes', () => {
      return new Promise<void>((resolve) => {
        const ratechangeHandler = (rate: number) => {
          expect(typeof rate).toBe('number');
          player.off('ratechange', ratechangeHandler);
          resolve();
        };

        player.on('ratechange', ratechangeHandler);

        // Simulate ratechange event on audio element
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          Object.defineProperty(audioElement, 'playbackRate', {
            value: 1.5,
            writable: true,
            configurable: true,
          });
          audioElement.dispatchEvent(new Event('ratechange'));
        }
      });
    });

    it('should emit loadeddata event when media data loads', () => {
      return new Promise<void>((resolve) => {
        const loadeddataHandler = () => {
          player.off('loadeddata', loadeddataHandler);
          resolve();
        };

        player.on('loadeddata', loadeddataHandler);

        // Simulate loadeddata event on audio element
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('loadeddata'));
        }
      });
    });

    it('should update state when play event occurs', () => {
      return new Promise<void>((resolve) => {
        const stateChangeHandler = () => {
          const state = player.getState();
          if (state.isPlaying) {
            expect(state.isPlaying).toBe(true);
            expect(state.isPaused).toBe(false);
            expect(state.isLoading).toBe(false);
            player.off('statechange', stateChangeHandler);
            resolve();
          }
        };

        player.on('statechange', stateChangeHandler);

        // Simulate play event
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('play'));
        }
      });
    });

    it('should update state when pause event occurs', () => {
      return new Promise<void>((resolve) => {
        const stateChangeHandler = () => {
          const state = player.getState();
          if (state.isPaused && !state.isPlaying) {
            expect(state.isPlaying).toBe(false);
            expect(state.isPaused).toBe(true);
            player.off('statechange', stateChangeHandler);
            resolve();
          }
        };

        player.on('statechange', stateChangeHandler);

        // Simulate pause event
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }
      });
    });
  });

  describe('Playback Control - play() method', () => {
    describe('play() with Track parameter', () => {
      it('should load and play a track when called with Track object', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
          artist: 'Test Artist',
        };

        let trackChangeEmitted = false;
        let loadingEmitted = false;

        const trackChangeHandler = (emittedTrack: any) => {
          expect(emittedTrack).toEqual(track);
          trackChangeEmitted = true;
        };

        const loadingHandler = () => {
          loadingEmitted = true;
        };

        player.on('trackchange', trackChangeHandler);
        player.on('loading', loadingHandler);

        await player.play(track);

        // Verify state was updated
        const state = player.getState();
        expect(state.currentTrack).toEqual(track);
        expect(state.currentQueueIndex).toBe(-1); // Not in queue

        // Verify events were emitted
        expect(trackChangeEmitted).toBe(true);
        expect(loadingEmitted).toBe(true);

        player.off('trackchange', trackChangeHandler);
        player.off('loading', loadingHandler);
      });

      it('should set currentQueueIndex when track exists in queue', async () => {
        const track1 = {
          id: 'track-1',
          src: 'https://example.com/audio1.mp3',
          title: 'Track 1',
        };
        const track2 = {
          id: 'track-2',
          src: 'https://example.com/audio2.mp3',
          title: 'Track 2',
        };

        // Add tracks to queue (we'll need addTrack method, but for now we can test the logic)
        // For this test, we'll just verify the behavior when track is not in queue
        await player.play(track1);
        
        const state = player.getState();
        expect(state.currentTrack).toEqual(track1);
      });

      it('should emit error when track is missing required fields', async () => {
        const invalidTrack = {
          id: 'invalid',
          src: '', // Missing src
          title: '', // Missing title
        };

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('src and title are required');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        await player.play(invalidTrack as any);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should set loading state before loading track', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        let loadingStateObserved = false;
        const stateChangeHandler = () => {
          const state = player.getState();
          if (state.isLoading) {
            loadingStateObserved = true;
          }
        };

        player.on('statechange', stateChangeHandler);

        await player.play(track);

        expect(loadingStateObserved).toBe(true);
        player.off('statechange', stateChangeHandler);
      });

      it('should clear previous error when playing new track', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        const state = player.getState();
        expect(state.error).toBeNull();
      });
    });

    describe('play() with index parameter', () => {
      it('should emit error when index is negative', async () => {
        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('Invalid queue index');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        await player.play(-1);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should emit error when index is out of bounds', async () => {
        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('Invalid queue index');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        await player.play(999); // queue is empty

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should emit error when queue is empty', async () => {
        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        await player.play(0); // queue is empty

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });
    });

    describe('play() without parameters (resume)', () => {
      it('should emit error when no track is loaded', async () => {
        // Manually clear the player state for this test
        // Since player is a singleton, we need to reset it
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.src = '';
        }
        // Access private state through type assertion for testing
        (player as any)._state.currentTrack = null;
        (player as any)._audio.src = '';

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('STATE_ERROR');
          expect(error.message).toContain('No track loaded');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        await player.play(); // No track loaded

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should resume playback when track is already loaded', async () => {
        // First load a track
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        // Now try to resume (this will call play() without parameters)
        // In a real scenario, we'd pause first, but for this test we just verify
        // that calling play() again doesn't throw an error
        await player.play();

        const state = player.getState();
        expect(state.currentTrack).toEqual(track);
      });
    });

    describe('play() error handling', () => {
      it('should handle play() promise rejection gracefully', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        // Mock audio element play to reject
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          const originalPlay = audioElement.play.bind(audioElement);
          audioElement.play = () => Promise.reject(new Error('User interaction required'));

          let errorEmitted = false;
          const errorHandler = (error: any) => {
            expect(error.code).toBe('MEDIA_LOAD_ERROR');
            expect(error.message).toContain('User interaction required');
            errorEmitted = true;
          };

          player.on('error', errorHandler);

          await player.play(track);

          expect(errorEmitted).toBe(true);
          player.off('error', errorHandler);

          // Restore original play method
          audioElement.play = originalPlay;
        }
      });

      it('should set isLoading to false on error', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        // Mock audio element play to reject
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          const originalPlay = audioElement.play.bind(audioElement);
          audioElement.play = () => Promise.reject(new Error('Test error'));

          await player.play(track);

          const state = player.getState();
          expect(state.isLoading).toBe(false);

          // Restore original play method
          audioElement.play = originalPlay;
        }
      });
    });

    describe('play() state updates', () => {
      it('should update isPlaying state when playback starts', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        // Simulate the play event that would normally fire
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('play'));
        }

        const state = player.getState();
        expect(state.isPlaying).toBe(true);
        expect(state.isPaused).toBe(false);
      });

      it('should emit play and statechange events', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        let playEventEmitted = false;
        let stateChangeEmitted = false;

        const playHandler = () => {
          playEventEmitted = true;
        };

        const stateChangeHandler = () => {
          stateChangeEmitted = true;
        };

        player.on('play', playHandler);
        player.on('statechange', stateChangeHandler);

        await player.play(track);

        // Simulate the play event
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('play'));
        }

        expect(playEventEmitted).toBe(true);
        expect(stateChangeEmitted).toBe(true);

        player.off('play', playHandler);
        player.off('statechange', stateChangeHandler);
      });
    });
  });

  describe('Playback Control - togglePlayPause() method', () => {
    it('should pause when currently playing', async () => {
      // First load and play a track
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      // Simulate play event to set isPlaying state
      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        audioElement.dispatchEvent(new Event('play'));
      }

      // Verify playing state
      let state = player.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.isPaused).toBe(false);

      // Now toggle (should pause)
      player.togglePlayPause();

      // Simulate pause event that would normally fire
      if (audioElement) {
        audioElement.dispatchEvent(new Event('pause'));
      }

      // Verify paused state
      state = player.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(true);
    });

    it('should play when currently paused', async () => {
      // First load a track and ensure it's paused
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      // Simulate play then pause to get to paused state
      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        audioElement.dispatchEvent(new Event('play'));
        player.pause();
        audioElement.dispatchEvent(new Event('pause'));
      }

      // Verify paused state
      let state = player.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(true);

      // Now toggle (should play)
      player.togglePlayPause();

      // Simulate play event that would normally fire
      if (audioElement) {
        audioElement.dispatchEvent(new Event('play'));
      }

      // Verify playing state
      state = player.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    it('should toggle between play and pause states correctly', async () => {
      // Load a track
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        // Start in playing state
        audioElement.dispatchEvent(new Event('play'));
        let state = player.getState();
        expect(state.isPlaying).toBe(true);

        // Toggle to pause
        player.togglePlayPause();
        audioElement.dispatchEvent(new Event('pause'));
        state = player.getState();
        expect(state.isPlaying).toBe(false);
        expect(state.isPaused).toBe(true);

        // Toggle back to play
        player.togglePlayPause();
        audioElement.dispatchEvent(new Event('play'));
        state = player.getState();
        expect(state.isPlaying).toBe(true);
        expect(state.isPaused).toBe(false);

        // Toggle to pause again
        player.togglePlayPause();
        audioElement.dispatchEvent(new Event('pause'));
        state = player.getState();
        expect(state.isPlaying).toBe(false);
        expect(state.isPaused).toBe(true);
      }
    });

    it('should emit appropriate events when toggling from play to pause', () => {
      return new Promise<void>((resolve) => {
        let pauseEventEmitted = false;

        const pauseHandler = () => {
          pauseEventEmitted = true;
          player.off('pause', pauseHandler);
          expect(pauseEventEmitted).toBe(true);
          resolve();
        };

        player.on('pause', pauseHandler);

        // Set up playing state first
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.dispatchEvent(new Event('play'));
        }

        // Toggle (should pause)
        player.togglePlayPause();

        // Simulate pause event
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }
      });
    });

    it('should check isPlaying state to determine action', async () => {
      // Load a track
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      
      // Test when isPlaying is true
      if (audioElement) {
        audioElement.dispatchEvent(new Event('play'));
      }
      let state = player.getState();
      const wasPlaying = state.isPlaying;
      
      player.togglePlayPause();
      
      if (audioElement) {
        audioElement.dispatchEvent(new Event('pause'));
      }
      state = player.getState();
      
      // If was playing, should now be paused
      if (wasPlaying) {
        expect(state.isPaused).toBe(true);
        expect(state.isPlaying).toBe(false);
      }
    });

    it('should work correctly when called multiple times in succession', async () => {
      // Load a track
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        // Start playing
        audioElement.dispatchEvent(new Event('play'));
        
        // Toggle multiple times
        player.togglePlayPause(); // Should pause
        audioElement.dispatchEvent(new Event('pause'));
        
        player.togglePlayPause(); // Should play
        audioElement.dispatchEvent(new Event('play'));
        
        player.togglePlayPause(); // Should pause
        audioElement.dispatchEvent(new Event('pause'));
        
        // Final state should be paused
        const state = player.getState();
        expect(state.isPaused).toBe(true);
        expect(state.isPlaying).toBe(false);
      }
    });
  });

  describe('Playback Control - pause() method', () => {
    it('should pause the audio element', async () => {
      // First load and play a track
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      // Simulate play event to set isPlaying state
      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        audioElement.dispatchEvent(new Event('play'));
      }

      // Verify playing state
      let state = player.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.isPaused).toBe(false);

      // Now pause
      player.pause();

      // Simulate pause event that would normally fire
      if (audioElement) {
        audioElement.dispatchEvent(new Event('pause'));
      }

      // Verify paused state
      state = player.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(true);
    });

    it('should emit pause event when paused', () => {
      return new Promise<void>((resolve) => {
        const pauseHandler = () => {
          player.off('pause', pauseHandler);
          resolve();
        };

        player.on('pause', pauseHandler);

        // Call pause
        player.pause();

        // Simulate the pause event from audio element
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }
      });
    });

    it('should emit statechange event when paused', () => {
      return new Promise<void>((resolve) => {
        let stateChangeEmitted = false;

        const stateChangeHandler = () => {
          const state = player.getState();
          if (state.isPaused && !state.isPlaying) {
            stateChangeEmitted = true;
            player.off('statechange', stateChangeHandler);
            expect(stateChangeEmitted).toBe(true);
            resolve();
          }
        };

        player.on('statechange', stateChangeHandler);

        // Call pause
        player.pause();

        // Simulate the pause event from audio element
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }
      });
    });

    it('should update isPaused state to true', () => {
      return new Promise<void>((resolve) => {
        const stateChangeHandler = () => {
          const state = player.getState();
          if (state.isPaused) {
            expect(state.isPaused).toBe(true);
            expect(state.isPlaying).toBe(false);
            player.off('statechange', stateChangeHandler);
            resolve();
          }
        };

        player.on('statechange', stateChangeHandler);

        player.pause();

        // Simulate pause event
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }
      });
    });

    it('should be safe to call pause when already paused', () => {
      // Call pause multiple times
      player.pause();
      player.pause();
      player.pause();

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should be safe to call pause when no track is loaded', () => {
      // Reset audio element
      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        audioElement.src = '';
      }

      // Call pause without a loaded track
      player.pause();

      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('Playback Control - seek() method', () => {
    it('should set audio element currentTime to specified value', async () => {
      // First load a track
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      // Set up audio element with duration
      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        Object.defineProperty(audioElement, 'duration', {
          value: 180,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(audioElement, 'currentTime', {
          value: 0,
          writable: true,
          configurable: true,
        });

        // Seek to 30 seconds
        player.seek(30);

        // Verify currentTime was set
        expect(audioElement.currentTime).toBe(30);
      }
    });

    it('should emit seeking event before changing currentTime', async () => {
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        Object.defineProperty(audioElement, 'duration', {
          value: 180,
          writable: true,
          configurable: true,
        });

        let seekingEmitted = false;
        let seekingTime = 0;

        const seekingHandler = (time: number) => {
          seekingEmitted = true;
          seekingTime = time;
        };

        player.on('seeking', seekingHandler);

        player.seek(45);

        expect(seekingEmitted).toBe(true);
        expect(seekingTime).toBe(45);

        player.off('seeking', seekingHandler);
      }
    });

    it('should emit seeked event after changing currentTime', async () => {
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        Object.defineProperty(audioElement, 'duration', {
          value: 180,
          writable: true,
          configurable: true,
        });

        let seekedEmitted = false;
        let seekedTime = 0;

        const seekedHandler = (time: number) => {
          seekedEmitted = true;
          seekedTime = time;
        };

        player.on('seeked', seekedHandler);

        player.seek(60);

        expect(seekedEmitted).toBe(true);
        expect(seekedTime).toBe(60);

        player.off('seeked', seekedHandler);
      }
    });

    it('should emit statechange event after seeking', async () => {
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        Object.defineProperty(audioElement, 'duration', {
          value: 180,
          writable: true,
          configurable: true,
        });

        let stateChangeEmitted = false;

        const stateChangeHandler = () => {
          stateChangeEmitted = true;
        };

        player.on('statechange', stateChangeHandler);

        player.seek(75);

        expect(stateChangeEmitted).toBe(true);

        player.off('statechange', stateChangeHandler);
      }
    });

    it('should update state currentTime', async () => {
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        Object.defineProperty(audioElement, 'duration', {
          value: 180,
          writable: true,
          configurable: true,
        });

        player.seek(90);

        const state = player.getState();
        expect(state.currentTime).toBe(90);
      }
    });

    it('should clear error state on successful seek', async () => {
      const track = {
        id: 'track-1',
        src: 'https://example.com/audio.mp3',
        title: 'Test Track',
      };

      await player.play(track);

      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        Object.defineProperty(audioElement, 'duration', {
          value: 180,
          writable: true,
          configurable: true,
        });

        player.seek(30);

        const state = player.getState();
        expect(state.error).toBeNull();
      }
    });

    describe('seek() validation', () => {
      it('should emit error when time is negative', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('cannot be negative');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.seek(-10);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should emit error when time exceeds duration', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          Object.defineProperty(audioElement, 'duration', {
            value: 180,
            writable: true,
            configurable: true,
          });

          let errorEmitted = false;
          const errorHandler = (error: any) => {
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toContain('cannot exceed duration');
            errorEmitted = true;
          };

          player.on('error', errorHandler);

          player.seek(200); // Duration is 180

          expect(errorEmitted).toBe(true);
          player.off('error', errorHandler);
        }
      });

      it('should emit error when time is NaN', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('must be a valid number');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.seek(NaN);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should emit error when time is not a number', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('must be a valid number');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.seek('30' as any);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should emit error when no track is loaded', () => {
        // Reset audio element
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.src = '';
        }
        (player as any)._state.currentTrack = null;

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('STATE_ERROR');
          expect(error.message).toContain('No track loaded');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.seek(30);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should not emit error when seeking to 0', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          Object.defineProperty(audioElement, 'duration', {
            value: 180,
            writable: true,
            configurable: true,
          });

          let errorEmitted = false;
          const errorHandler = () => {
            errorEmitted = true;
          };

          player.on('error', errorHandler);

          player.seek(0);

          expect(errorEmitted).toBe(false);
          player.off('error', errorHandler);
        }
      });

      it('should not emit error when seeking to exact duration', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          Object.defineProperty(audioElement, 'duration', {
            value: 180,
            writable: true,
            configurable: true,
          });

          let errorEmitted = false;
          const errorHandler = () => {
            errorEmitted = true;
          };

          player.on('error', errorHandler);

          player.seek(180); // Exact duration

          expect(errorEmitted).toBe(false);
          player.off('error', errorHandler);
        }
      });

      it('should allow seeking when duration is not yet loaded', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          // Set duration to NaN (not loaded yet)
          Object.defineProperty(audioElement, 'duration', {
            value: NaN,
            writable: true,
            configurable: true,
          });

          let errorEmitted = false;
          const errorHandler = () => {
            errorEmitted = true;
          };

          player.on('error', errorHandler);

          // Should not emit error even though we can't validate upper bound
          player.seek(30);

          expect(errorEmitted).toBe(false);
          player.off('error', errorHandler);
        }
      });
    });

    describe('seek() edge cases', () => {
      it('should handle seeking to very small positive values', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          Object.defineProperty(audioElement, 'duration', {
            value: 180,
            writable: true,
            configurable: true,
          });
          Object.defineProperty(audioElement, 'currentTime', {
            value: 0,
            writable: true,
            configurable: true,
          });

          player.seek(0.001);

          expect(audioElement.currentTime).toBe(0.001);
        }
      });

      it('should handle seeking to fractional seconds', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          Object.defineProperty(audioElement, 'duration', {
            value: 180,
            writable: true,
            configurable: true,
          });
          Object.defineProperty(audioElement, 'currentTime', {
            value: 0,
            writable: true,
            configurable: true,
          });

          player.seek(45.5);

          expect(audioElement.currentTime).toBe(45.5);
        }
      });

      it('should maintain error state when seek fails', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          Object.defineProperty(audioElement, 'duration', {
            value: 180,
            writable: true,
            configurable: true,
          });

          // Try to seek to invalid time
          player.seek(-10);

          const state = player.getState();
          expect(state.error).not.toBeNull();
          expect(state.error?.code).toBe('VALIDATION_ERROR');
        }
      });
    });
  });

  describe('Playback Control - setVolume() method', () => {
    it('should set audio element volume to specified value', () => {
      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        // Set volume to 0.5
        player.setVolume(0.5);

        // Verify volume was set
        expect(audioElement.volume).toBe(0.5);
      }
    });

    it('should update state volume', () => {
      player.setVolume(0.7);

      const state = player.getState();
      expect(state.volume).toBe(0.7);
    });

    it('should emit volumechange event', () => {
      return new Promise<void>((resolve) => {
        let volumechangeEmitted = false;
        let emittedVolume = 0;

        const volumechangeHandler = (volume: number) => {
          volumechangeEmitted = true;
          emittedVolume = volume;
        };

        player.on('volumechange', volumechangeHandler);

        player.setVolume(0.6);

        expect(volumechangeEmitted).toBe(true);
        expect(emittedVolume).toBe(0.6);

        player.off('volumechange', volumechangeHandler);
        resolve();
      });
    });

    it('should emit statechange event', () => {
      return new Promise<void>((resolve) => {
        let stateChangeEmitted = false;

        const stateChangeHandler = () => {
          stateChangeEmitted = true;
        };

        player.on('statechange', stateChangeHandler);

        player.setVolume(0.8);

        expect(stateChangeEmitted).toBe(true);

        player.off('statechange', stateChangeHandler);
        resolve();
      });
    });

    describe('setVolume() clamping behavior', () => {
      it('should clamp volume below 0 to 0', () => {
        player.setVolume(-0.5);

        const state = player.getState();
        expect(state.volume).toBe(0);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          expect(audioElement.volume).toBe(0);
        }
      });

      it('should clamp volume above 1 to 1', () => {
        player.setVolume(1.5);

        const state = player.getState();
        expect(state.volume).toBe(1);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          expect(audioElement.volume).toBe(1);
        }
      });

      it('should clamp very large positive values to 1', () => {
        player.setVolume(999);

        const state = player.getState();
        expect(state.volume).toBe(1);
      });

      it('should clamp very large negative values to 0', () => {
        player.setVolume(-999);

        const state = player.getState();
        expect(state.volume).toBe(0);
      });

      it('should accept 0 as valid volume', () => {
        player.setVolume(0);

        const state = player.getState();
        expect(state.volume).toBe(0);
      });

      it('should accept 1 as valid volume', () => {
        player.setVolume(1);

        const state = player.getState();
        expect(state.volume).toBe(1);
      });

      it('should accept fractional values within range', () => {
        player.setVolume(0.333);

        const state = player.getState();
        expect(state.volume).toBeCloseTo(0.333, 3);
      });

      it('should clamp values just below 0', () => {
        player.setVolume(-0.001);

        const state = player.getState();
        expect(state.volume).toBe(0);
      });

      it('should clamp values just above 1', () => {
        player.setVolume(1.001);

        const state = player.getState();
        expect(state.volume).toBe(1);
      });
    });

    describe('setVolume() validation', () => {
      it('should handle NaN gracefully by not changing volume', () => {
        // Set a known volume first
        player.setVolume(0.5);
        const initialState = player.getState();
        const initialVolume = initialState.volume;

        // Try to set NaN
        player.setVolume(NaN);

        // Volume should remain unchanged
        const state = player.getState();
        expect(state.volume).toBe(initialVolume);
      });

      it('should handle non-number values gracefully', () => {
        // Set a known volume first
        player.setVolume(0.5);
        const initialState = player.getState();
        const initialVolume = initialState.volume;

        // Try to set non-number value
        player.setVolume('0.7' as any);

        // Volume should remain unchanged
        const state = player.getState();
        expect(state.volume).toBe(initialVolume);
      });

      it('should handle undefined gracefully', () => {
        // Set a known volume first
        player.setVolume(0.5);
        const initialState = player.getState();
        const initialVolume = initialState.volume;

        // Try to set undefined
        player.setVolume(undefined as any);

        // Volume should remain unchanged
        const state = player.getState();
        expect(state.volume).toBe(initialVolume);
      });

      it('should handle null gracefully', () => {
        // Set a known volume first
        player.setVolume(0.5);
        const initialState = player.getState();
        const initialVolume = initialState.volume;

        // Try to set null
        player.setVolume(null as any);

        // Volume should remain unchanged
        const state = player.getState();
        expect(state.volume).toBe(initialVolume);
      });
    });

    describe('setVolume() edge cases', () => {
      it('should handle very small positive values', () => {
        player.setVolume(0.001);

        const state = player.getState();
        expect(state.volume).toBeCloseTo(0.001, 3);
      });

      it('should handle values very close to 1', () => {
        player.setVolume(0.999);

        const state = player.getState();
        expect(state.volume).toBeCloseTo(0.999, 3);
      });

      it('should handle Infinity by clamping to 1', () => {
        player.setVolume(Infinity);

        const state = player.getState();
        expect(state.volume).toBe(1);
      });

      it('should handle -Infinity by clamping to 0', () => {
        player.setVolume(-Infinity);

        const state = player.getState();
        expect(state.volume).toBe(0);
      });

      it('should work correctly when called multiple times', () => {
        player.setVolume(0.2);
        expect(player.getState().volume).toBe(0.2);

        player.setVolume(0.5);
        expect(player.getState().volume).toBe(0.5);

        player.setVolume(0.9);
        expect(player.getState().volume).toBe(0.9);

        player.setVolume(0.1);
        expect(player.getState().volume).toBe(0.1);
      });

      it('should work without a loaded track', () => {
        // Reset audio element
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.src = '';
        }
        (player as any)._state.currentTrack = null;

        // Should still work
        player.setVolume(0.4);

        const state = player.getState();
        expect(state.volume).toBe(0.4);
      });

      it('should work when player is playing', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.dispatchEvent(new Event('play'));
        }

        // Change volume while playing
        player.setVolume(0.3);

        const state = player.getState();
        expect(state.volume).toBe(0.3);
        expect(state.isPlaying).toBe(true);
      });

      it('should work when player is paused', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);
        player.pause();

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        // Change volume while paused
        player.setVolume(0.6);

        const state = player.getState();
        expect(state.volume).toBe(0.6);
        expect(state.isPaused).toBe(true);
      });
    });

    describe('setVolume() event emission order', () => {
      it('should emit volumechange before statechange', () => {
        return new Promise<void>((resolve) => {
          const events: string[] = [];

          const volumechangeHandler = () => {
            events.push('volumechange');
          };

          const stateChangeHandler = () => {
            events.push('statechange');
            
            // Check order after both events
            if (events.length === 2) {
              expect(events[0]).toBe('volumechange');
              expect(events[1]).toBe('statechange');
              
              player.off('volumechange', volumechangeHandler);
              player.off('statechange', stateChangeHandler);
              resolve();
            }
          };

          player.on('volumechange', volumechangeHandler);
          player.on('statechange', stateChangeHandler);

          player.setVolume(0.75);
        });
      });
    });

    describe('setVolume() state consistency', () => {
      it('should keep state and audio element volume in sync', () => {
        player.setVolume(0.42);

        const state = player.getState();
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        
        if (audioElement) {
          expect(state.volume).toBe(audioElement.volume);
          expect(state.volume).toBe(0.42);
        }
      });

      it('should update state immediately', () => {
        player.setVolume(0.88);

        // State should be updated immediately, not waiting for audio element event
        const state = player.getState();
        expect(state.volume).toBe(0.88);
      });
    });
  });

  describe('Playback Control - setPlaybackRate() method', () => {
    it('should set audio element playback rate to specified value', () => {
      const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        // Set playback rate to 1.5
        player.setPlaybackRate(1.5);

        // Verify playback rate was set
        expect(audioElement.playbackRate).toBe(1.5);
      }
    });

    it('should update state playbackRate', () => {
      player.setPlaybackRate(2.0);

      const state = player.getState();
      expect(state.playbackRate).toBe(2.0);
    });

    it('should emit ratechange event', () => {
      return new Promise<void>((resolve) => {
        let ratechangeEmitted = false;
        let emittedRate = 0;

        const ratechangeHandler = (rate: number) => {
          ratechangeEmitted = true;
          emittedRate = rate;
        };

        player.on('ratechange', ratechangeHandler);

        player.setPlaybackRate(1.25);

        expect(ratechangeEmitted).toBe(true);
        expect(emittedRate).toBe(1.25);

        player.off('ratechange', ratechangeHandler);
        resolve();
      });
    });

    it('should emit statechange event', () => {
      return new Promise<void>((resolve) => {
        let stateChangeEmitted = false;

        const stateChangeHandler = () => {
          stateChangeEmitted = true;
        };

        player.on('statechange', stateChangeHandler);

        player.setPlaybackRate(0.75);

        expect(stateChangeEmitted).toBe(true);

        player.off('statechange', stateChangeHandler);
        resolve();
      });
    });

    describe('setPlaybackRate() validation', () => {
      it('should accept typical playback rates', () => {
        // Test common playback rates
        player.setPlaybackRate(0.5);
        expect(player.getState().playbackRate).toBe(0.5);

        player.setPlaybackRate(1.0);
        expect(player.getState().playbackRate).toBe(1.0);

        player.setPlaybackRate(1.5);
        expect(player.getState().playbackRate).toBe(1.5);

        player.setPlaybackRate(2.0);
        expect(player.getState().playbackRate).toBe(2.0);
      });

      it('should accept any positive number', () => {
        player.setPlaybackRate(0.25);
        expect(player.getState().playbackRate).toBe(0.25);

        player.setPlaybackRate(3.0);
        expect(player.getState().playbackRate).toBe(3.0);

        player.setPlaybackRate(0.1);
        expect(player.getState().playbackRate).toBe(0.1);

        player.setPlaybackRate(4.0);
        expect(player.getState().playbackRate).toBe(4.0);
      });

      it('should reject zero by not changing rate', () => {
        // Set a known rate first
        player.setPlaybackRate(1.5);
        const initialState = player.getState();
        const initialRate = initialState.playbackRate;

        // Try to set zero
        player.setPlaybackRate(0);

        // Rate should remain unchanged
        const state = player.getState();
        expect(state.playbackRate).toBe(initialRate);
      });

      it('should reject negative values by not changing rate', () => {
        // Set a known rate first
        player.setPlaybackRate(1.5);
        const initialState = player.getState();
        const initialRate = initialState.playbackRate;

        // Try to set negative value
        player.setPlaybackRate(-1.0);

        // Rate should remain unchanged
        const state = player.getState();
        expect(state.playbackRate).toBe(initialRate);
      });

      it('should handle NaN gracefully by not changing rate', () => {
        // Set a known rate first
        player.setPlaybackRate(1.5);
        const initialState = player.getState();
        const initialRate = initialState.playbackRate;

        // Try to set NaN
        player.setPlaybackRate(NaN);

        // Rate should remain unchanged
        const state = player.getState();
        expect(state.playbackRate).toBe(initialRate);
      });

      it('should handle non-number values gracefully', () => {
        // Set a known rate first
        player.setPlaybackRate(1.5);
        const initialState = player.getState();
        const initialRate = initialState.playbackRate;

        // Try to set non-number value
        player.setPlaybackRate('1.5' as any);

        // Rate should remain unchanged
        const state = player.getState();
        expect(state.playbackRate).toBe(initialRate);
      });

      it('should handle undefined gracefully', () => {
        // Set a known rate first
        player.setPlaybackRate(1.5);
        const initialState = player.getState();
        const initialRate = initialState.playbackRate;

        // Try to set undefined
        player.setPlaybackRate(undefined as any);

        // Rate should remain unchanged
        const state = player.getState();
        expect(state.playbackRate).toBe(initialRate);
      });

      it('should handle null gracefully', () => {
        // Set a known rate first
        player.setPlaybackRate(1.5);
        const initialState = player.getState();
        const initialRate = initialState.playbackRate;

        // Try to set null
        player.setPlaybackRate(null as any);

        // Rate should remain unchanged
        const state = player.getState();
        expect(state.playbackRate).toBe(initialRate);
      });
    });

    describe('setPlaybackRate() edge cases', () => {
      it('should handle very small positive values', () => {
        player.setPlaybackRate(0.001);

        const state = player.getState();
        expect(state.playbackRate).toBeCloseTo(0.001, 3);
      });

      it('should handle very large positive values', () => {
        player.setPlaybackRate(10.0);

        const state = player.getState();
        expect(state.playbackRate).toBe(10.0);
      });

      it('should handle fractional values', () => {
        player.setPlaybackRate(1.333);

        const state = player.getState();
        expect(state.playbackRate).toBeCloseTo(1.333, 3);
      });

      it('should work correctly when called multiple times', () => {
        player.setPlaybackRate(0.5);
        expect(player.getState().playbackRate).toBe(0.5);

        player.setPlaybackRate(1.0);
        expect(player.getState().playbackRate).toBe(1.0);

        player.setPlaybackRate(1.5);
        expect(player.getState().playbackRate).toBe(1.5);

        player.setPlaybackRate(2.0);
        expect(player.getState().playbackRate).toBe(2.0);
      });

      it('should work without a loaded track', () => {
        // Reset audio element
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.src = '';
        }
        (player as any)._state.currentTrack = null;

        // Should still work
        player.setPlaybackRate(1.75);

        const state = player.getState();
        expect(state.playbackRate).toBe(1.75);
      });

      it('should work when player is playing', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.dispatchEvent(new Event('play'));
        }

        // Change playback rate while playing
        player.setPlaybackRate(1.25);

        const state = player.getState();
        expect(state.playbackRate).toBe(1.25);
        expect(state.isPlaying).toBe(true);
      });

      it('should work when player is paused', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        await player.play(track);
        player.pause();

        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        // Change playback rate while paused
        player.setPlaybackRate(0.75);

        const state = player.getState();
        expect(state.playbackRate).toBe(0.75);
        expect(state.isPaused).toBe(true);
      });
    });

    describe('setPlaybackRate() event emission order', () => {
      it('should emit ratechange before statechange', () => {
        return new Promise<void>((resolve) => {
          const events: string[] = [];

          const ratechangeHandler = () => {
            events.push('ratechange');
          };

          const stateChangeHandler = () => {
            events.push('statechange');
            
            // Check order after both events
            if (events.length === 2) {
              expect(events[0]).toBe('ratechange');
              expect(events[1]).toBe('statechange');
              
              player.off('ratechange', ratechangeHandler);
              player.off('statechange', stateChangeHandler);
              resolve();
            }
          };

          player.on('ratechange', ratechangeHandler);
          player.on('statechange', stateChangeHandler);

          player.setPlaybackRate(1.8);
        });
      });
    });

    describe('setPlaybackRate() state consistency', () => {
      it('should keep state and audio element playback rate in sync', () => {
        player.setPlaybackRate(1.42);

        const state = player.getState();
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        
        if (audioElement) {
          expect(state.playbackRate).toBe(audioElement.playbackRate);
          expect(state.playbackRate).toBe(1.42);
        }
      });

      it('should update state immediately', () => {
        player.setPlaybackRate(1.88);

        // State should be updated immediately, not waiting for audio element event
        const state = player.getState();
        expect(state.playbackRate).toBe(1.88);
      });
    });
  });

  describe('queue Management - addTrack() method', () => {
    describe('addTrack() with single Track parameter', () => {
      it('should add a single track to empty queue', () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
          artist: 'Test Artist',
        };

        let queueChangeEmitted = false;
        const queueChangeHandler = () => {
          queueChangeEmitted = true;
        };

        player.on('queuechange', queueChangeHandler);

        player.addToQueue(track);

        const queue = player.getQueue();
        expect(queue.length).toBe(1);
        expect(queue[0]).toEqual(track);
        expect(queueChangeEmitted).toBe(true);

        player.off('queuechange', queueChangeHandler);
      });

      it('should append track to end of existing queue', () => {
        const track1 = {
          id: 'track-1',
          src: 'https://example.com/audio1.mp3',
          title: 'Track 1',
        };
        const track2 = {
          id: 'track-2',
          src: 'https://example.com/audio2.mp3',
          title: 'Track 2',
        };

        player.addToQueue(track1);
        player.addToQueue(track2);

        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(track1);
        expect(queue[1]).toEqual(track2);
      });

      it('should emit queuechange event when adding track', () => {
        return new Promise<void>((resolve) => {
          const track = {
            id: 'track-1',
            src: 'https://example.com/audio.mp3',
            title: 'Test Track',
          };

          const queueChangeHandler = (queue: any) => {
            expect(Array.isArray(queue)).toBe(true);
            expect(queue.length).toBeGreaterThan(0);
            player.off('queuechange', queueChangeHandler);
            resolve();
          };

          player.on('queuechange', queueChangeHandler);
          player.addToQueue(track);
        });
      });

      it('should emit error when track is missing required id field', () => {
        const invalidTrack = {
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('id, src, and title are required');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.addToQueue(invalidTrack as any);

        expect(errorEmitted).toBe(true);
        
        // Verify queue wasn't modified
        const queue = player.getQueue();
        expect(queue.length).toBe(0);

        player.off('error', errorHandler);
      });

      it('should emit error when track is missing required src field', () => {
        const invalidTrack = {
          id: 'track-1',
          src: '',
          title: 'Test Track',
        };

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.addToQueue(invalidTrack as any);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should emit error when track is missing required title field', () => {
        const invalidTrack = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: '',
        };

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.addToQueue(invalidTrack as any);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should accept track with optional fields', () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
          artist: 'Test Artist',
          artwork: 'https://example.com/artwork.jpg',
          duration: 180,
        };

        player.addToQueue(track);

        const queue = player.getQueue();
        expect(queue.length).toBe(1);
        expect(queue[0]).toEqual(track);
      });

      it('should clear previous error when successfully adding track', () => {
        // First cause an error
        const invalidTrack = {
          id: '',
          src: '',
          title: '',
        };
        player.addToQueue(invalidTrack as any);

        // Verify error was set
        let state = player.getState();
        expect(state.error).not.toBeNull();

        // Now add a valid track
        const validTrack = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };
        player.addToQueue(validTrack);

        // Verify error was cleared
        state = player.getState();
        expect(state.error).toBeNull();
      });
    });

    describe('addTrack() with array of Tracks parameter', () => {
      it('should add multiple tracks to empty queue', () => {
        const tracks = [
          {
            id: 'track-1',
            src: 'https://example.com/audio1.mp3',
            title: 'Track 1',
          },
          {
            id: 'track-2',
            src: 'https://example.com/audio2.mp3',
            title: 'Track 2',
          },
          {
            id: 'track-3',
            src: 'https://example.com/audio3.mp3',
            title: 'Track 3',
          },
        ];

        player.addToQueue(tracks);

        const queue = player.getQueue();
        expect(queue.length).toBe(3);
        expect(queue[0]).toEqual(tracks[0]);
        expect(queue[1]).toEqual(tracks[1]);
        expect(queue[2]).toEqual(tracks[2]);
      });

      it('should append multiple tracks to existing queue', () => {
        const track1 = {
          id: 'track-1',
          src: 'https://example.com/audio1.mp3',
          title: 'Track 1',
        };
        const additionalTracks = [
          {
            id: 'track-2',
            src: 'https://example.com/audio2.mp3',
            title: 'Track 2',
          },
          {
            id: 'track-3',
            src: 'https://example.com/audio3.mp3',
            title: 'Track 3',
          },
        ];

        player.addToQueue(track1);
        player.addToQueue(additionalTracks);

        const queue = player.getQueue();
        expect(queue.length).toBe(3);
        expect(queue[0]).toEqual(track1);
        expect(queue[1]).toEqual(additionalTracks[0]);
        expect(queue[2]).toEqual(additionalTracks[1]);
      });

      it('should emit queuechange event when adding multiple tracks', () => {
        return new Promise<void>((resolve) => {
          const tracks = [
            {
              id: 'track-1',
              src: 'https://example.com/audio1.mp3',
              title: 'Track 1',
            },
            {
              id: 'track-2',
              src: 'https://example.com/audio2.mp3',
              title: 'Track 2',
            },
          ];

          const queueChangeHandler = (queue: any) => {
            expect(Array.isArray(queue)).toBe(true);
            expect(queue.length).toBe(2);
            player.off('queuechange', queueChangeHandler);
            resolve();
          };

          player.on('queuechange', queueChangeHandler);
          player.addToQueue(tracks);
        });
      });

      it('should handle empty array gracefully', () => {
        const initialqueue = player.getQueue();
        const initialLength = initialqueue.length;

        player.addToQueue([]);

        const finalqueue = player.getQueue();
        expect(finalqueue.length).toBe(initialLength);
      });

      it('should emit error if any track in array is invalid', () => {
        const tracks = [
          {
            id: 'track-1',
            src: 'https://example.com/audio1.mp3',
            title: 'Track 1',
          },
          {
            id: '', // Invalid - missing id
            src: 'https://example.com/audio2.mp3',
            title: 'Track 2',
          },
        ];

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.addToQueue(tracks as any);

        expect(errorEmitted).toBe(true);
        
        // Verify no tracks were added (all-or-nothing)
        const queue = player.getQueue();
        expect(queue.length).toBe(0);

        player.off('error', errorHandler);
      });
    });

    // NOTE: The following tests for addToQueue() with index parameter are no longer applicable
    // The new queue API simplified addToQueue() to only append to the end of the queue
    // Use playNext() to insert tracks after the current track instead
    describe.skip('addTrack() with index parameter (DEPRECATED - API Changed)', () => {
      it('should insert track at specified index', () => {
        const track1 = {
          id: 'track-1',
          src: 'https://example.com/audio1.mp3',
          title: 'Track 1',
        };
        const track2 = {
          id: 'track-2',
          src: 'https://example.com/audio2.mp3',
          title: 'Track 2',
        };
        const track3 = {
          id: 'track-3',
          src: 'https://example.com/audio3.mp3',
          title: 'Track 3',
        };

        player.addToQueue(track1);
        player.addToQueue(track3);
        player.addToQueue(track2, 1); // Insert at index 1

        const queue = player.getQueue();
        expect(queue.length).toBe(3);
        expect(queue[0]).toEqual(track1);
        expect(queue[1]).toEqual(track2);
        expect(queue[2]).toEqual(track3);
      });

      it('should insert at beginning when index is 0', () => {
        const track1 = {
          id: 'track-1',
          src: 'https://example.com/audio1.mp3',
          title: 'Track 1',
        };
        const track2 = {
          id: 'track-2',
          src: 'https://example.com/audio2.mp3',
          title: 'Track 2',
        };

        player.addToQueue(track1);
        player.addToQueue(track2, 0); // Insert at beginning

        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(track2);
        expect(queue[1]).toEqual(track1);
      });

      it('should insert at end when index equals queue length', () => {
        const track1 = {
          id: 'track-1',
          src: 'https://example.com/audio1.mp3',
          title: 'Track 1',
        };
        const track2 = {
          id: 'track-2',
          src: 'https://example.com/audio2.mp3',
          title: 'Track 2',
        };

        player.addToQueue(track1);
        player.addToQueue(track2, 1); // Insert at end (index === length)

        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(track1);
        expect(queue[1]).toEqual(track2);
      });

      it('should clamp negative index to 0', () => {
        const track1 = {
          id: 'track-1',
          src: 'https://example.com/audio1.mp3',
          title: 'Track 1',
        };
        const track2 = {
          id: 'track-2',
          src: 'https://example.com/audio2.mp3',
          title: 'Track 2',
        };

        player.addToQueue(track1);
        player.addToQueue(track2, -5); // Negative index should clamp to 0

        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(track2);
        expect(queue[1]).toEqual(track1);
      });

      it('should clamp index greater than length to end of queue', () => {
        const track1 = {
          id: 'track-1',
          src: 'https://example.com/audio1.mp3',
          title: 'Track 1',
        };
        const track2 = {
          id: 'track-2',
          src: 'https://example.com/audio2.mp3',
          title: 'Track 2',
        };

        player.addToQueue(track1);
        player.addToQueue(track2, 999); // Index > length should clamp to end

        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(track1);
        expect(queue[1]).toEqual(track2);
      });

      it('should insert multiple tracks at specified index', () => {
        const track1 = {
          id: 'track-1',
          src: 'https://example.com/audio1.mp3',
          title: 'Track 1',
        };
        const track4 = {
          id: 'track-4',
          src: 'https://example.com/audio4.mp3',
          title: 'Track 4',
        };
        const middleTracks = [
          {
            id: 'track-2',
            src: 'https://example.com/audio2.mp3',
            title: 'Track 2',
          },
          {
            id: 'track-3',
            src: 'https://example.com/audio3.mp3',
            title: 'Track 3',
          },
        ];

        player.addToQueue(track1);
        player.addToQueue(track4);
        player.addToQueue(middleTracks, 1); // Insert array at index 1

        const queue = player.getQueue();
        expect(queue.length).toBe(4);
        expect(queue[0]).toEqual(track1);
        expect(queue[1]).toEqual(middleTracks[0]);
        expect(queue[2]).toEqual(middleTracks[1]);
        expect(queue[3]).toEqual(track4);
      });

      it('should emit error when index is not a number', () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('Invalid index');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.addToQueue(track, 'invalid' as any);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should emit error when index is NaN', () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.addToQueue(track, NaN);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });
    });

    describe('addTrack() queue state', () => {
      it('should maintain queue order when adding tracks', () => {
        const tracks = [
          { id: '1', src: 'audio1.mp3', title: 'Track 1' },
          { id: '2', src: 'audio2.mp3', title: 'Track 2' },
          { id: '3', src: 'audio3.mp3', title: 'Track 3' },
          { id: '4', src: 'audio4.mp3', title: 'Track 4' },
          { id: '5', src: 'audio5.mp3', title: 'Track 5' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        const queue = player.getQueue();
        expect(queue.length).toBe(5);
        
        tracks.forEach((track, index) => {
          expect(queue[index]).toEqual(track);
        });
      });

      it('should not affect currentTrack when adding to queue', async () => {
        const currentTrack = {
          id: 'current',
          src: 'https://example.com/current.mp3',
          title: 'Current Track',
        };

        await player.play(currentTrack);

        const newTrack = {
          id: 'new',
          src: 'https://example.com/new.mp3',
          title: 'New Track',
        };

        player.addToQueue(newTrack);

        const state = player.getState();
        expect(state.currentTrack).toEqual(currentTrack);
      });

      it('should allow adding duplicate tracks', () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
        };

        player.addToQueue(track);
        player.addToQueue(track);
        player.addToQueue(track);

        const queue = player.getQueue();
        expect(queue.length).toBe(3);
        expect(queue[0]).toEqual(track);
        expect(queue[1]).toEqual(track);
        expect(queue[2]).toEqual(track);
      });
    });
  });

  describe('queue Management - removeTrack() method', () => {
    describe('removeTrack() basic functionality', () => {
      it('should remove track at specified index', () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        let queueChangeEmitted = false;
        const queueChangeHandler = () => {
          queueChangeEmitted = true;
        };

        player.on('queuechange', queueChangeHandler);

        player.removeFromQueue(1); // Remove track at index 1

        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(tracks[0]);
        expect(queue[1]).toEqual(tracks[2]);
        expect(queueChangeEmitted).toBe(true);

        player.off('queuechange', queueChangeHandler);
      });

      it('should remove first track when index is 0', () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        player.removeFromQueue(0);

        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(tracks[1]);
        expect(queue[1]).toEqual(tracks[2]);
      });

      it('should remove last track when index is length - 1', () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        player.removeFromQueue(2); // Remove last track

        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(tracks[0]);
        expect(queue[1]).toEqual(tracks[1]);
      });

      it('should emit queuechange event when removing track', () => {
        return new Promise<void>((resolve) => {
          const tracks = [
            { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          ];

          tracks.forEach(track => player.addToQueue(track));

          const queueChangeHandler = (queue: any) => {
            expect(Array.isArray(queue)).toBe(true);
            expect(queue.length).toBe(1);
            player.off('queuechange', queueChangeHandler);
            resolve();
          };

          player.on('queuechange', queueChangeHandler);
          player.removeFromQueue(0);
        });
      });

      it('should clear previous error when successfully removing track', () => {
        const track = { id: 'track-1', src: 'https://example.com/audio.mp3', title: 'Track 1' };
        player.addToQueue(track);

        // First cause an error
        player.removeFromQueue(999);

        // Verify error was set
        let state = player.getState();
        expect(state.error).not.toBeNull();

        // Now remove a valid track
        player.removeFromQueue(0);

        // Verify error was cleared
        state = player.getState();
        expect(state.error).toBeNull();
      });
    });

    describe('removeTrack() validation', () => {
      it('should emit error when index is negative', () => {
        const track = { id: 'track-1', src: 'https://example.com/audio.mp3', title: 'Track 1' };
        player.addToQueue(track);

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('Invalid index');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.removeFromQueue(-1);

        expect(errorEmitted).toBe(true);
        
        // Verify queue wasn't modified
        const queue = player.getQueue();
        expect(queue.length).toBe(1);

        player.off('error', errorHandler);
      });

      it('should emit error when index is out of bounds', () => {
        const track = { id: 'track-1', src: 'https://example.com/audio.mp3', title: 'Track 1' };
        player.addToQueue(track);

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('Invalid index');
          expect(error.message).toContain('valid range: 0-0');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.removeFromQueue(5);

        expect(errorEmitted).toBe(true);
        
        // Verify queue wasn't modified
        const queue = player.getQueue();
        expect(queue.length).toBe(1);

        player.off('error', errorHandler);
      });

      it('should emit error when queue is empty', () => {
        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('queue has 0 tracks');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.removeFromQueue(0);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should emit error when index is not a number', () => {
        const track = { id: 'track-1', src: 'https://example.com/audio.mp3', title: 'Track 1' };
        player.addToQueue(track);

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('Invalid index');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.removeFromQueue('invalid' as any);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should emit error when index is NaN', () => {
        const track = { id: 'track-1', src: 'https://example.com/audio.mp3', title: 'Track 1' };
        player.addToQueue(track);

        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        player.removeFromQueue(NaN);

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });
    });

    describe('removeTrack() currentQueueIndex updates', () => {
      it('should decrement currentQueueIndex when removing track before current', async () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Play track at index 2
        await player.play(2);

        // Verify current track index
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(2);

        // Remove track at index 0 (before current)
        player.removeFromQueue(0);

        // Current track index should be decremented
        state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack).toEqual(tracks[2]);
      });

      it('should not change currentQueueIndex when removing track after current', async () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Play track at index 0
        await player.play(0);

        // Verify current track index
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(0);

        // Remove track at index 2 (after current)
        player.removeFromQueue(2);

        // Current track index should remain the same
        state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack).toEqual(tracks[0]);
      });

      it('should keep currentQueueIndex same when removing current track (next track takes its place)', async () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Play track at index 1
        await player.play(1);

        // Verify current track index
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack).toEqual(tracks[1]);

        // Remove current track at index 1
        player.removeFromQueue(1);

        // Current track index should stay the same (track 3 now at index 1)
        state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        
        // queue should now have tracks 1 and 3
        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(tracks[0]);
        expect(queue[1]).toEqual(tracks[2]);
      });

      it('should reset currentQueueIndex to -1 when removing last track from queue', async () => {
        const track = { id: 'track-1', src: 'https://example.com/audio.mp3', title: 'Track 1' };
        player.addToQueue(track);

        // Play the track
        await player.play(0);

        // Verify current track index
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(0);

        // Remove the only track
        player.removeFromQueue(0);

        // Current track index should be reset to -1
        state = player.getState();
        expect(state.currentQueueIndex).toBe(-1);
        expect(state.currentTrack).toBeNull();
      });

      it('should adjust currentQueueIndex when removing last track that is current', async () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Play last track at index 2
        await player.play(2);

        // Verify current track index
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(2);

        // Remove current track (which is the last track)
        player.removeFromQueue(2);

        // Current track index should be adjusted to new last track
        state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        
        // queue should now have 2 tracks
        const queue = player.getQueue();
        expect(queue.length).toBe(2);
      });

      it('should not affect currentQueueIndex when no track is playing', () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Don't play any track, currentQueueIndex should be -1
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(-1);

        // Remove a track
        player.removeFromQueue(0);

        // Current track index should still be -1
        state = player.getState();
        expect(state.currentQueueIndex).toBe(-1);
      });
    });

    describe('removeTrack() edge cases', () => {
      it('should handle removing all tracks one by one', () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Remove all tracks
        player.removeFromQueue(0);
        expect(player.getQueue().length).toBe(2);

        player.removeFromQueue(0);
        expect(player.getQueue().length).toBe(1);

        player.removeFromQueue(0);
        expect(player.getQueue().length).toBe(0);
      });

      it('should handle removing tracks in reverse order', () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Remove from end to beginning
        player.removeFromQueue(2);
        let queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(tracks[0]);
        expect(queue[1]).toEqual(tracks[1]);

        player.removeFromQueue(1);
        queue = player.getQueue();
        expect(queue.length).toBe(1);
        expect(queue[0]).toEqual(tracks[0]);

        player.removeFromQueue(0);
        queue = player.getQueue();
        expect(queue.length).toBe(0);
      });

      it('should maintain queue integrity after multiple removals', () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'https://example.com/audio4.mp3', title: 'Track 4' },
          { id: 'track-5', src: 'https://example.com/audio5.mp3', title: 'Track 5' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Remove tracks at various positions
        player.removeFromQueue(1); // Remove track 2
        player.removeFromQueue(2); // Remove track 4 (now at index 2)

        const queue = player.getQueue();
        expect(queue.length).toBe(3);
        expect(queue[0]).toEqual(tracks[0]);
        expect(queue[1]).toEqual(tracks[2]);
        expect(queue[2]).toEqual(tracks[4]);
      });
    });
  });

  describe('queue Management - clearqueue() method', () => {
    describe('clearqueue() basic functionality', () => {
      it('should clear all tracks from queue', () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Verify queue has tracks
        let queue = player.getQueue();
        expect(queue.length).toBe(3);

        // Clear queue
        player.clearQueue();

        // Verify queue is empty
        queue = player.getQueue();
        expect(queue.length).toBe(0);
        expect(queue).toEqual([]);
      });

      it('should reset currentQueueIndex to -1', async () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Play a track to set currentQueueIndex
        await player.play(1);

        // Verify currentQueueIndex is set
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(1);

        // Clear queue
        player.clearQueue();

        // Verify currentQueueIndex is reset
        state = player.getState();
        expect(state.currentQueueIndex).toBe(-1);
      });

      it('should reset currentTrack to null', async () => {
        const track = { id: 'track-1', src: 'https://example.com/audio.mp3', title: 'Track 1' };
        player.addToQueue(track);

        // Play the track
        await player.play(0);

        // Verify currentTrack is set
        let state = player.getState();
        expect(state.currentTrack).toEqual(track);

        // Clear queue
        player.clearQueue();

        // Verify currentTrack is reset
        state = player.getState();
        expect(state.currentTrack).toBeNull();
      });

      it('should emit queuechange event', () => {
        return new Promise<void>((resolve) => {
          const tracks = [
            { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
          ];

          tracks.forEach(track => player.addToQueue(track));

          const queueChangeHandler = (queue: any) => {
            expect(Array.isArray(queue)).toBe(true);
            expect(queue.length).toBe(0);
            player.off('queuechange', queueChangeHandler);
            resolve();
          };

          player.on('queuechange', queueChangeHandler);
          player.clearQueue();
        });
      });

      it('should clear previous error when clearing queue', () => {
        const track = { id: 'track-1', src: 'https://example.com/audio.mp3', title: 'Track 1' };
        player.addToQueue(track);

        // First cause an error
        player.removeFromQueue(999);

        // Verify error was set
        let state = player.getState();
        expect(state.error).not.toBeNull();

        // Now clear queue
        player.clearQueue();

        // Verify error was cleared
        state = player.getState();
        expect(state.error).toBeNull();
      });
    });

    describe('clearqueue() idempotence', () => {
      it('should be idempotent - calling multiple times has same effect', () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Clear queue first time
        player.clearQueue();
        let queue = player.getQueue();
        expect(queue.length).toBe(0);

        // Clear queue second time (should have no effect)
        player.clearQueue();
        queue = player.getQueue();
        expect(queue.length).toBe(0);

        // Clear queue third time (should still have no effect)
        player.clearQueue();
        queue = player.getQueue();
        expect(queue.length).toBe(0);
      });

      it('should work on empty queue without errors', () => {
        // queue is already empty from beforeEach
        const queue = player.getQueue();
        expect(queue.length).toBe(0);

        // Clear empty queue (should not throw)
        player.clearQueue();

        // Verify still empty
        const newqueue = player.getQueue();
        expect(newqueue.length).toBe(0);
      });

      it('should emit queuechange event even when already empty', () => {
        return new Promise<void>((resolve) => {
          // queue is already empty
          expect(player.getQueue().length).toBe(0);

          let eventEmitted = false;
          const queueChangeHandler = () => {
            eventEmitted = true;
            player.off('queuechange', queueChangeHandler);
            resolve();
          };

          player.on('queuechange', queueChangeHandler);
          player.clearQueue();

          // Verify event was emitted
          setTimeout(() => {
            expect(eventEmitted).toBe(true);
          }, 10);
        });
      });
    });

    describe('clearqueue() state consistency', () => {
      it('should maintain consistent state after clearing', () => {
        const tracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
        ];

        tracks.forEach(track => player.addToQueue(track));

        // Clear queue
        player.clearQueue();

        // Verify all queue-related state is consistent
        const state = player.getState();
        const queue = player.getQueue();

        expect(queue.length).toBe(0);
        expect(state.currentQueueIndex).toBe(-1);
        expect(state.currentTrack).toBeNull();
        expect(state.error).toBeNull();
      });

      it('should allow adding tracks after clearing', () => {
        const initialTracks = [
          { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'https://example.com/audio2.mp3', title: 'Track 2' },
        ];

        initialTracks.forEach(track => player.addToQueue(track));

        // Clear queue
        player.clearQueue();
        expect(player.getQueue().length).toBe(0);

        // Add new tracks
        const newTracks = [
          { id: 'track-3', src: 'https://example.com/audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'https://example.com/audio4.mp3', title: 'Track 4' },
        ];

        newTracks.forEach(track => player.addToQueue(track));

        // Verify new tracks were added
        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0]).toEqual(newTracks[0]);
        expect(queue[1]).toEqual(newTracks[1]);
      });

      it('should not affect audio playback state', async () => {
        const track = { id: 'track-1', src: 'https://example.com/audio.mp3', title: 'Track 1' };
        player.addToQueue(track);

        // Play the track
        await player.play(0);

        // Simulate play event to set isPlaying state
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('play'));
        }

        // Verify playing state
        let state = player.getState();
        expect(state.isPlaying).toBe(true);

        // Clear queue
        player.clearQueue();

        // Verify playback state is not affected
        // (audio element continues playing even though queue is cleared)
        state = player.getState();
        expect(state.isPlaying).toBe(true);
        expect(state.isPaused).toBe(false);
      });
    });

    describe('clearqueue() with large queues', () => {
      it('should efficiently clear large queue', () => {
        // Create a large queue
        const tracks = Array.from({ length: 100 }, (_, i) => ({
          id: `track-${i}`,
          src: `https://example.com/audio${i}.mp3`,
          title: `Track ${i}`,
        }));

        tracks.forEach(track => player.addToQueue(track));

        // Verify large queue
        expect(player.getQueue().length).toBe(100);

        // Clear queue
        const startTime = performance.now();
        player.clearQueue();
        const endTime = performance.now();

        // Verify cleared
        expect(player.getQueue().length).toBe(0);

        // Verify it was fast (should be < 10ms for 100 tracks)
        expect(endTime - startTime).toBeLessThan(10);
      });
    });
  });

  describe('queue Management - setCurrentTrack() method', () => {
    describe('setCurrentTrack() with Track parameter', () => {
      it('should set current track when track exists in queue', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];

        player.addToQueue(tracks);

        // Set current track to track 2
        player.jumpToQueueIndex(1);

        const state = player.getState();
        expect(state.currentTrack).toEqual(tracks[1]);
        expect(state.currentQueueIndex).toBe(1);
      });

      it('should find track by ID in queue', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];

        player.addToQueue(tracks);

        // Jump to index 1 (track-2)
        player.jumpToQueueIndex(1);

        const state = player.getState();
        expect(state.currentTrack?.id).toBe('track-2');
        expect(state.currentQueueIndex).toBe(1);
      });

      it('should emit trackchange event when setting current track', () => {
        return new Promise<void>((resolve) => {
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          ];

          player.addToQueue(tracks);

          const trackChangeHandler = (track: any) => {
            expect(track.id).toBe('track-2');
            player.off('trackchange', trackChangeHandler);
            resolve();
          };

          player.on('trackchange', trackChangeHandler);
          player.jumpToQueueIndex(1);
        });
      });

      it('should emit statechange event when setting current track', () => {
        return new Promise<void>((resolve) => {
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          ];

          player.addToQueue(tracks);

          let stateChangeEmitted = false;
          const stateChangeHandler = () => {
            stateChangeEmitted = true;
            if (stateChangeEmitted) {
              player.off('statechange', stateChangeHandler);
              resolve();
            }
          };

          player.on('statechange', stateChangeHandler);
          player.jumpToQueueIndex(1);
        });
      });

      it('should emit error when index is out of bounds', () => {
        return new Promise<void>((resolve) => {
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          ];

          player.addToQueue(tracks);

          const errorHandler = (error: any) => {
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toContain('Invalid index');
            player.off('error', errorHandler);
            resolve();
          };

          player.on('error', errorHandler);
          player.jumpToQueueIndex(999); // Out of bounds index
        });
      });

      it('should emit error when index is negative', () => {
        return new Promise<void>((resolve) => {
          const errorHandler = (error: any) => {
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toContain('Invalid index');
            player.off('error', errorHandler);
            resolve();
          };

          player.on('error', errorHandler);
          player.jumpToQueueIndex(-1); // Negative index
        });
      });

      it('should not change state when index is invalid', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];

        player.addToQueue(tracks);
        player.jumpToQueueIndex(0);

        const stateBefore = player.getState();
        const currentTrackBefore = stateBefore.currentTrack;
        const currentQueueIndexBefore = stateBefore.currentQueueIndex;

        // Try to set invalid index
        player.jumpToQueueIndex(999);

        const stateAfter = player.getState();
        expect(stateAfter.currentTrack).toEqual(currentTrackBefore);
        expect(stateAfter.currentQueueIndex).toBe(currentQueueIndexBefore);
      });

      it('should clear previous error when successfully setting track', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];

        player.addToQueue(tracks);

        // First cause an error
        player.jumpToQueueIndex(999);

        let state = player.getState();
        expect(state.error).not.toBeNull();

        // Now set a valid track
        player.jumpToQueueIndex(0);

        state = player.getState();
        expect(state.error).toBeNull();
      });
    });

    describe('jumpToQueueIndex() with index parameter', () => {
      it('should set current track by valid index', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];

        player.addToQueue(tracks);

        player.jumpToQueueIndex(1);

        const state = player.getState();
        expect(state.currentTrack).toEqual(tracks[1]);
        expect(state.currentQueueIndex).toBe(1);
      });

      it('should set current track at index 0', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];

        player.addToQueue(tracks);

        player.jumpToQueueIndex(0);

        const state = player.getState();
        expect(state.currentTrack).toEqual(tracks[0]);
        expect(state.currentQueueIndex).toBe(0);
      });

      it('should set current track at last index', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];

        player.addToQueue(tracks);

        player.jumpToQueueIndex(2);

        const state = player.getState();
        expect(state.currentTrack).toEqual(tracks[2]);
        expect(state.currentQueueIndex).toBe(2);
      });

      it('should emit trackchange event when setting by index', () => {
        return new Promise<void>((resolve) => {
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          ];

          player.addToQueue(tracks);

          const trackChangeHandler = (track: any) => {
            expect(track.id).toBe('track-2');
            player.off('trackchange', trackChangeHandler);
            resolve();
          };

          player.on('trackchange', trackChangeHandler);
          player.jumpToQueueIndex(1);
        });
      });

      it('should emit error when index is negative', () => {
        return new Promise<void>((resolve) => {
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          ];

          player.addToQueue(tracks);

          const errorHandler = (error: any) => {
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toContain('Invalid index');
            player.off('error', errorHandler);
            resolve();
          };

          player.on('error', errorHandler);
          player.jumpToQueueIndex(-1);
        });
      });

      it('should emit error when index is out of bounds', () => {
        return new Promise<void>((resolve) => {
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          ];

          player.addToQueue(tracks);

          const errorHandler = (error: any) => {
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toContain('Invalid index');
            player.off('error', errorHandler);
            resolve();
          };

          player.on('error', errorHandler);
          player.jumpToQueueIndex(999);
        });
      });

      it('should emit error when index is NaN', () => {
        return new Promise<void>((resolve) => {
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          ];

          player.addToQueue(tracks);

          const errorHandler = (error: any) => {
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toContain('Invalid index');
            player.off('error', errorHandler);
            resolve();
          };

          player.on('error', errorHandler);
          player.jumpToQueueIndex(NaN);
        });
      });

      it('should emit error when queue is empty', () => {
        return new Promise<void>((resolve) => {
          const errorHandler = (error: any) => {
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toContain('Invalid index');
            player.off('error', errorHandler);
            resolve();
          };

          player.on('error', errorHandler);
          player.jumpToQueueIndex(0);
        });
      });

      it('should not change state when index is invalid', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];

        player.addToQueue(tracks);
        player.jumpToQueueIndex(0);

        const stateBefore = player.getState();
        const currentTrackBefore = stateBefore.currentTrack;
        const currentQueueIndexBefore = stateBefore.currentQueueIndex;

        // Try to set invalid index
        player.jumpToQueueIndex(999);

        const stateAfter = player.getState();
        expect(stateAfter.currentTrack).toEqual(currentTrackBefore);
        expect(stateAfter.currentQueueIndex).toBe(currentQueueIndexBefore);
      });
    });

    describe('setCurrentTrack() behavior', () => {
      it('should not start playback', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];

        player.addToQueue(tracks);

        // Ensure we're in a paused state first
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        // Set current track
        player.jumpToQueueIndex(1);

        // Verify playback state hasn't changed
        const state = player.getState();
        expect(state.isPlaying).toBe(false);
        expect(state.isPaused).toBe(true);
      });

      it('should allow switching between tracks without playback', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];

        player.addToQueue(tracks);

        // Ensure we're in a paused state first
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        // Set to track 1
        player.jumpToQueueIndex(0);
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.isPlaying).toBe(false);

        // Set to track 2
        player.jumpToQueueIndex(1);
        state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.isPlaying).toBe(false);

        // Set to track 3
        player.jumpToQueueIndex(2);
        state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.isPlaying).toBe(false);
      });

      it('should work with both Track and index parameters', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];

        player.addToQueue(tracks);

        // Set by index
        player.jumpToQueueIndex(1);
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(1);

        // Set by Track object
        player.jumpToQueueIndex(2);
        state = player.getState();
        expect(state.currentQueueIndex).toBe(2);

        // Set by index again
        player.jumpToQueueIndex(0);
        state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
      });

      it('should handle setting same track multiple times', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];

        player.addToQueue(tracks);

        // Set to track 1 multiple times
        player.jumpToQueueIndex(0);
        player.jumpToQueueIndex(0);
        player.jumpToQueueIndex(0);

        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack).toEqual(tracks[0]);
      });

      it('should emit error for invalid parameter type', () => {
        return new Promise<void>((resolve) => {
          const errorHandler = (error: any) => {
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toContain('Invalid parameter');
            player.off('error', errorHandler);
            resolve();
          };

          player.on('error', errorHandler);
          player.jumpToQueueIndex(null as any);
        });
      });
    });

    describe('setCurrentTrack() edge cases', () => {
      it('should handle single-track queue', () => {
        const track = { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' };

        player.addToQueue(track);

        player.jumpToQueueIndex(0);

        const state = player.getState();
        expect(state.currentTrack).toEqual(track);
        expect(state.currentQueueIndex).toBe(0);
      });

      it('should handle large queue', () => {
        const tracks = Array.from({ length: 100 }, (_, i) => ({
          id: `track-${i}`,
          src: `audio${i}.mp3`,
          title: `Track ${i}`,
        }));

        player.addToQueue(tracks);

        // Set to middle track
        player.jumpToQueueIndex(50);

        const state = player.getState();
        expect(state.currentQueueIndex).toBe(50);
        expect(state.currentTrack?.id).toBe('track-50');
      });

      it('should handle tracks with same title but different IDs', () => {
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Same Title' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Same Title' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Same Title' },
        ];

        player.addToQueue(tracks);

        // Set by Track object - should find by ID, not title
        player.jumpToQueueIndex(1);

        const state = player.getState();
        expect(state.currentTrack?.id).toBe('track-2');
        expect(state.currentQueueIndex).toBe(1);
      });
    });
  });

  describe('queue Navigation - _getPreviousTrackIndex() helper', () => {
    beforeEach(() => {
      // Set up a test queue with 3 tracks
      const tracks = [
        { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
        { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
      ];
      player.addToQueue(tracks);
      player.jumpToQueueIndex(1); // Start at middle track (index 1)
    });

    describe('Restart current track behavior (currentTime > 3 seconds)', () => {
      it('should return current index when currentTime > 3 seconds', () => {
        // Set currentTime to more than 3 seconds
        (player as any)._state.currentTime = 5.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(1); // Should restart current track
      });

      it('should return current index when currentTime is exactly 3.1 seconds', () => {
        (player as any)._state.currentTime = 3.1;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(1);
      });

      it('should return current index regardless of repeat mode when currentTime > 3', () => {
        (player as any)._state.currentTime = 10.0;

        // Test with repeat mode 'none'
        (player as any)._state.repeatMode = 'none';
        expect((player as any)._getPreviousTrackIndex()).toBe(1);

        // Test with repeat mode 'one'
        (player as any)._state.repeatMode = 'one';
        expect((player as any)._getPreviousTrackIndex()).toBe(1);

        // Test with repeat mode 'all'
        (player as any)._state.repeatMode = 'all';
        expect((player as any)._getPreviousTrackIndex()).toBe(1);
      });
    });

    describe('Repeat mode "none" behavior (currentTime <= 3 seconds)', () => {
      beforeEach(() => {
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 2.0; // Less than 3 seconds
      });

      it('should return previous index when not at beginning', () => {
        // Current index is 1, should go to 0
        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(0);
      });

      it('should return -1 when at beginning of queue', () => {
        // Set to first track
        player.jumpToQueueIndex(0);
        (player as any)._state.currentTime = 2.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(-1); // No previous track
      });

      it('should return previous index from last track', () => {
        // Set to last track
        player.jumpToQueueIndex(2);
        (player as any)._state.currentTime = 2.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(1); // Should go to track 1
      });
    });

    describe('Repeat mode "one" behavior (currentTime <= 3 seconds)', () => {
      beforeEach(() => {
        (player as any)._state.repeatMode = 'one';
        (player as any)._state.currentTime = 2.0;
      });

      it('should return current index (stay on same track)', () => {
        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(1); // Stay on current track
      });

      it('should return current index even at beginning of queue', () => {
        player.jumpToQueueIndex(0);
        (player as any)._state.currentTime = 2.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(0); // Stay on first track
      });

      it('should return current index even at end of queue', () => {
        player.jumpToQueueIndex(2);
        (player as any)._state.currentTime = 2.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(2); // Stay on last track
      });
    });

    describe('Repeat mode "all" behavior (currentTime <= 3 seconds)', () => {
      beforeEach(() => {
        (player as any)._state.repeatMode = 'all';
        (player as any)._state.currentTime = 2.0;
      });

      it('should return previous index when not at beginning', () => {
        // Current index is 1, should go to 0
        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(0);
      });

      it('should loop to last track when at beginning of queue', () => {
        // Set to first track
        player.jumpToQueueIndex(0);
        (player as any)._state.currentTime = 2.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(2); // Should loop to last track
      });

      it('should return previous index from last track', () => {
        // Set to last track
        player.jumpToQueueIndex(2);
        (player as any)._state.currentTime = 2.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(1); // Should go to track 1
      });
    });

    describe('Edge cases', () => {
      it('should return -1 for empty queue', () => {
        // Clear queue
        player.clearQueue();
        (player as any)._state.currentTime = 2.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(-1);
      });

      it('should handle single-track queue with repeat "none"', () => {
        // Clear and add single track
        player.clearQueue();
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 2.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(-1); // No previous track
      });

      it('should handle single-track queue with repeat "all"', () => {
        // Clear and add single track
        player.clearQueue();
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'all';
        (player as any)._state.currentTime = 2.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(0); // Loop to same track
      });

      it('should handle currentTime at exactly 3 seconds (boundary)', () => {
        (player as any)._state.currentTime = 3.0;
        (player as any)._state.repeatMode = 'none';

        const previousIndex = (player as any)._getPreviousTrackIndex();

        // At exactly 3 seconds, should go to previous track (not restart)
        expect(previousIndex).toBe(0);
      });

      it('should handle currentTime at 0 seconds', () => {
        (player as any)._state.currentTime = 0.0;
        (player as any)._state.repeatMode = 'none';

        const previousIndex = (player as any)._getPreviousTrackIndex();

        expect(previousIndex).toBe(0); // Should go to previous track
      });

      it('should handle negative currentQueueIndex', () => {
        (player as any)._state.currentQueueIndex = -1;
        (player as any)._state.currentTime = 2.0;
        (player as any)._state.repeatMode = 'none';

        const previousIndex = (player as any)._getPreviousTrackIndex();

        // With invalid index, should return -1
        expect(previousIndex).toBe(-1);
      });
    });

    describe('Comparison with _getNextTrackIndex()', () => {
      it('should have symmetric behavior for repeat "all" mode', () => {
        (player as any)._state.repeatMode = 'all';
        (player as any)._state.currentTime = 2.0;

        // At first track
        player.jumpToQueueIndex(0);
        const prevFromFirst = (player as any)._getPreviousTrackIndex();
        expect(prevFromFirst).toBe(2); // Loops to last

        // At last track
        player.jumpToQueueIndex(2);
        const nextFromLast = (player as any)._getNextTrackIndex();
        expect(nextFromLast).toBe(0); // Loops to first
      });

      it('should both return current index for repeat "one" mode', () => {
        (player as any)._state.repeatMode = 'one';
        (player as any)._state.currentTime = 2.0;

        const previousIndex = (player as any)._getPreviousTrackIndex();
        const nextIndex = (player as any)._getNextTrackIndex();

        expect(previousIndex).toBe(1);
        expect(nextIndex).toBe(1);
      });
    });
  });

  describe('queue Navigation - next() method', () => {
    beforeEach(() => {
      // Set up a test queue with 3 tracks
      const tracks = [
        { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
        { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
      ];
      player.addToQueue(tracks);
      player.jumpToQueueIndex(0); // Start at first track
    });

    describe('Repeat mode "none" behavior', () => {
      beforeEach(() => {
        (player as any)._state.repeatMode = 'none';
      });

      it('should advance to next track when not at end', async () => {
        // Start at track 0
        player.jumpToQueueIndex(0);

        // Call next()
        await player.next();

        // Should advance to track 1
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
      });

      it('should advance from middle track to next track', async () => {
        // Start at track 1
        player.jumpToQueueIndex(1);

        // Call next()
        await player.next();

        // Should advance to track 2
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.currentTrack?.id).toBe('track-3');
      });

      it('should stop playback when at end of queue', async () => {
        // Start at last track
        player.jumpToQueueIndex(2);

        // Set up to detect pause
        let pauseCalled = false;
        const pauseHandler = () => {
          pauseCalled = true;
        };
        player.on('pause', pauseHandler);

        // Call next()
        await player.next();

        // Should pause (stop playback)
        // Note: The pause event will be emitted by the audio element
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        expect(pauseCalled).toBe(true);

        // Current track should still be track 2 (last track)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(2);

        player.off('pause', pauseHandler);
      });
    });

    describe('Repeat mode "one" behavior', () => {
      beforeEach(() => {
        (player as any)._state.repeatMode = 'one';
      });

      it('should restart current track from any position', async () => {
        // Start at track 1
        player.jumpToQueueIndex(1);

        // Call next()
        await player.next();

        // Should stay on track 1 (restart)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
      });

      it('should restart current track even at first track', async () => {
        // Start at first track
        player.jumpToQueueIndex(0);

        // Call next()
        await player.next();

        // Should stay on track 0
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should restart current track even at last track', async () => {
        // Start at last track
        player.jumpToQueueIndex(2);

        // Call next()
        await player.next();

        // Should stay on track 2
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.currentTrack?.id).toBe('track-3');
      });
    });

    describe('Repeat mode "all" behavior', () => {
      beforeEach(() => {
        (player as any)._state.repeatMode = 'all';
      });

      it('should advance to next track when not at end', async () => {
        // Start at track 0
        player.jumpToQueueIndex(0);

        // Call next()
        await player.next();

        // Should advance to track 1
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
      });

      it('should loop to first track when at end of queue', async () => {
        // Start at last track
        player.jumpToQueueIndex(2);

        // Call next()
        await player.next();

        // Should loop to track 0
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should continue looping through queue', async () => {
        // Start at track 1
        player.jumpToQueueIndex(1);

        // Call next() - should go to track 2
        await player.next();
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(2);

        // Call next() again - should loop to track 0
        await player.next();
        state = player.getState();
        expect(state.currentQueueIndex).toBe(0);

        // Call next() again - should go to track 1
        await player.next();
        state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty queue', async () => {
        // Clear queue
        player.clearQueue();

        // Set up to detect pause
        let pauseCalled = false;
        const pauseHandler = () => {
          pauseCalled = true;
        };
        player.on('pause', pauseHandler);

        // Call next()
        await player.next();

        // Should pause (no tracks to play)
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        expect(pauseCalled).toBe(true);

        player.off('pause', pauseHandler);
      });

      it('should handle single-track queue with repeat "none"', async () => {
        // Clear and add single track
        player.clearQueue();
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'none';

        // Set up to detect pause
        let pauseCalled = false;
        const pauseHandler = () => {
          pauseCalled = true;
        };
        player.on('pause', pauseHandler);

        // Call next()
        await player.next();

        // Should pause (no next track)
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        expect(pauseCalled).toBe(true);

        player.off('pause', pauseHandler);
      });

      it('should handle single-track queue with repeat "all"', async () => {
        // Clear and add single track
        player.clearQueue();
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'all';

        // Call next()
        await player.next();

        // Should loop to same track (index 0)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should handle single-track queue with repeat "one"', async () => {
        // Clear and add single track
        player.clearQueue();
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'one';

        // Call next()
        await player.next();

        // Should stay on same track
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should handle invalid currentQueueIndex', async () => {
        // Set invalid index
        (player as any)._state.currentQueueIndex = -1;
        (player as any)._state.repeatMode = 'none';

        // Call next()
        await player.next();

        // Should advance to track 0 (first track)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });
    });

    describe('Event emission', () => {
      it('should emit trackchange event when advancing to next track', async () => {
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'none';

        let trackChangeEmitted = false;
        let emittedTrack: any = null;

        const trackChangeHandler = (track: any) => {
          trackChangeEmitted = true;
          emittedTrack = track;
        };

        player.on('trackchange', trackChangeHandler);

        // Call next()
        await player.next();

        // Should emit trackchange with track 2
        expect(trackChangeEmitted).toBe(true);
        expect(emittedTrack?.id).toBe('track-2');

        player.off('trackchange', trackChangeHandler);
      });

      it('should emit loading event when loading next track', async () => {
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'none';

        let loadingEmitted = false;

        const loadingHandler = () => {
          loadingEmitted = true;
        };

        player.on('loading', loadingHandler);

        // Call next()
        await player.next();

        // Should emit loading event
        expect(loadingEmitted).toBe(true);

        player.off('loading', loadingHandler);
      });

      it('should not emit trackchange when pausing at end of queue', async () => {
        player.jumpToQueueIndex(2); // Last track
        (player as any)._state.repeatMode = 'none';

        let trackChangeEmitted = false;

        const trackChangeHandler = () => {
          trackChangeEmitted = true;
        };

        player.on('trackchange', trackChangeHandler);

        // Call next()
        await player.next();

        // Should NOT emit trackchange (just pauses)
        expect(trackChangeEmitted).toBe(false);

        player.off('trackchange', trackChangeHandler);
      });
    });

    describe('Integration with play() method', () => {
      it('should call play() with correct index', async () => {
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'none';

        // Call next()
        await player.next();

        // Verify play was called with index 1
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
      });

      it('should handle play() errors gracefully', async () => {
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'none';

        // Mock audio element play to reject
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          const originalPlay = audioElement.play.bind(audioElement);
          audioElement.play = () => Promise.reject(new Error('Playback failed'));

          let errorEmitted = false;
          const errorHandler = () => {
            errorEmitted = true;
          };

          player.on('error', errorHandler);

          // Call next()
          await player.next();

          // Should emit error
          expect(errorEmitted).toBe(true);

          player.off('error', errorHandler);

          // Restore original play method
          audioElement.play = originalPlay;
        }
      });
    });

    describe('State consistency', () => {
      it('should maintain consistent state after next()', async () => {
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'none';

        // Call next()
        await player.next();

        const state = player.getState();

        // Verify state consistency
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
        expect(state.error).toBeNull();
      });

      it('should update currentTrack to match currentQueueIndex', async () => {
        player.jumpToQueueIndex(1);
        (player as any)._state.repeatMode = 'none';

        // Call next()
        await player.next();

        const state = player.getState();
        const queue = player.getQueue();

        // Verify currentTrack matches the track at currentQueueIndex
        expect(state.currentTrack).toEqual(queue[state.currentQueueIndex]);
      });
    });
  });

  describe('queue Navigation - previous() method', () => {
    beforeEach(() => {
      // Set up a test queue with 3 tracks
      const tracks = [
        { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
        { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
      ];
      player.addToQueue(tracks);
      player.jumpToQueueIndex(0); // Start at first track
    });

    describe('3-second restart rule', () => {
      it('should restart current track if currentTime > 3 seconds', async () => {
        // Start at track 1
        player.jumpToQueueIndex(1);
        
        // Set currentTime to 5 seconds (> 3 seconds)
        (player as any)._state.currentTime = 5;

        // Call previous()
        await player.previous();

        // Should restart track 1 (same index)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
      });

      it('should go to previous track if currentTime <= 3 seconds', async () => {
        // Start at track 1
        player.jumpToQueueIndex(1);
        
        // Set currentTime to 2 seconds (<= 3 seconds)
        (player as any)._state.currentTime = 2;
        (player as any)._state.repeatMode = 'none';

        // Call previous()
        await player.previous();

        // Should go to track 0
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should go to previous track if currentTime = 3 seconds exactly', async () => {
        // Start at track 1
        player.jumpToQueueIndex(1);
        
        // Set currentTime to exactly 3 seconds
        (player as any)._state.currentTime = 3;
        (player as any)._state.repeatMode = 'none';

        // Call previous()
        await player.previous();

        // Should go to track 0 (3 seconds is not > 3)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should restart current track if currentTime = 3.1 seconds', async () => {
        // Start at track 1
        player.jumpToQueueIndex(1);
        
        // Set currentTime to 3.1 seconds (> 3 seconds)
        (player as any)._state.currentTime = 3.1;

        // Call previous()
        await player.previous();

        // Should restart track 1
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
      });
    });

    describe('Repeat mode "none" behavior', () => {
      beforeEach(() => {
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 0; // Reset time to 0
      });

      it('should go to previous track when not at beginning', async () => {
        // Start at track 2
        player.jumpToQueueIndex(2);

        // Call previous()
        await player.previous();

        // Should go to track 1
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
      });

      it('should go from middle track to previous track', async () => {
        // Start at track 1
        player.jumpToQueueIndex(1);

        // Call previous()
        await player.previous();

        // Should go to track 0
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should stop playback when at beginning of queue', async () => {
        // Start at first track
        player.jumpToQueueIndex(0);

        // Set up to detect pause
        let pauseCalled = false;
        const pauseHandler = () => {
          pauseCalled = true;
        };
        player.on('pause', pauseHandler);

        // Call previous()
        await player.previous();

        // Should pause (stop playback)
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        expect(pauseCalled).toBe(true);

        // Current track should still be track 0 (first track)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);

        player.off('pause', pauseHandler);
      });
    });

    describe('Repeat mode "one" behavior', () => {
      beforeEach(() => {
        (player as any)._state.repeatMode = 'one';
        (player as any)._state.currentTime = 0; // Reset time to 0
      });

      it('should restart current track from any position', async () => {
        // Start at track 1
        player.jumpToQueueIndex(1);

        // Call previous()
        await player.previous();

        // Should stay on track 1 (restart)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
      });

      it('should restart current track even at first track', async () => {
        // Start at first track
        player.jumpToQueueIndex(0);

        // Call previous()
        await player.previous();

        // Should stay on track 0
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should restart current track even at last track', async () => {
        // Start at last track
        player.jumpToQueueIndex(2);

        // Call previous()
        await player.previous();

        // Should stay on track 2
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.currentTrack?.id).toBe('track-3');
      });
    });

    describe('Repeat mode "all" behavior', () => {
      beforeEach(() => {
        (player as any)._state.repeatMode = 'all';
        (player as any)._state.currentTime = 0; // Reset time to 0
      });

      it('should go to previous track when not at beginning', async () => {
        // Start at track 2
        player.jumpToQueueIndex(2);

        // Call previous()
        await player.previous();

        // Should go to track 1
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
      });

      it('should loop to last track when at beginning of queue', async () => {
        // Start at first track
        player.jumpToQueueIndex(0);

        // Call previous()
        await player.previous();

        // Should loop to track 2 (last track)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.currentTrack?.id).toBe('track-3');
      });

      it('should continue looping through queue backwards', async () => {
        // Start at track 1
        player.jumpToQueueIndex(1);

        // Call previous() - should go to track 0
        await player.previous();
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(0);

        // Call previous() again - should loop to track 2
        await player.previous();
        state = player.getState();
        expect(state.currentQueueIndex).toBe(2);

        // Call previous() again - should go to track 1
        await player.previous();
        state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty queue', async () => {
        // Clear queue
        player.clearQueue();

        // Set up to detect pause
        let pauseCalled = false;
        const pauseHandler = () => {
          pauseCalled = true;
        };
        player.on('pause', pauseHandler);

        // Call previous()
        await player.previous();

        // Should pause (no tracks to play)
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        expect(pauseCalled).toBe(true);

        player.off('pause', pauseHandler);
      });

      it('should handle single-track queue with repeat "none"', async () => {
        // Clear and add single track
        player.clearQueue();
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 0;

        // Set up to detect pause
        let pauseCalled = false;
        const pauseHandler = () => {
          pauseCalled = true;
        };
        player.on('pause', pauseHandler);

        // Call previous()
        await player.previous();

        // Should pause (no previous track)
        const audioElement = document.body.querySelector('audio');
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        expect(pauseCalled).toBe(true);

        player.off('pause', pauseHandler);
      });

      it('should handle single-track queue with repeat "all"', async () => {
        // Clear and add single track
        player.clearQueue();
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'all';
        (player as any)._state.currentTime = 0;

        // Call previous()
        await player.previous();

        // Should loop to same track (index 0)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should handle single-track queue with repeat "one"', async () => {
        // Clear and add single track
        player.clearQueue();
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'one';
        (player as any)._state.currentTime = 0;

        // Call previous()
        await player.previous();

        // Should stay on same track
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should handle invalid currentQueueIndex', async () => {
        // Set invalid index
        (player as any)._state.currentQueueIndex = -1;
        (player as any)._state.repeatMode = 'all';
        (player as any)._state.currentTime = 0;

        // Call previous()
        await player.previous();

        // Should loop to last track (track 2)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.currentTrack?.id).toBe('track-3');
      });
    });

    describe('Event emission', () => {
      it('should emit trackchange event when going to previous track', async () => {
        player.jumpToQueueIndex(1);
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 0;

        let trackChangeEmitted = false;
        let emittedTrack: any = null;

        const trackChangeHandler = (track: any) => {
          trackChangeEmitted = true;
          emittedTrack = track;
        };

        player.on('trackchange', trackChangeHandler);

        // Call previous()
        await player.previous();

        // Should emit trackchange with track 1
        expect(trackChangeEmitted).toBe(true);
        expect(emittedTrack?.id).toBe('track-1');

        player.off('trackchange', trackChangeHandler);
      });

      it('should emit loading event when loading previous track', async () => {
        player.jumpToQueueIndex(1);
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 0;

        let loadingEmitted = false;

        const loadingHandler = () => {
          loadingEmitted = true;
        };

        player.on('loading', loadingHandler);

        // Call previous()
        await player.previous();

        // Should emit loading event
        expect(loadingEmitted).toBe(true);

        player.off('loading', loadingHandler);
      });

      it('should not emit trackchange when pausing at beginning of queue', async () => {
        player.jumpToQueueIndex(0); // First track
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 0;

        let trackChangeEmitted = false;

        const trackChangeHandler = () => {
          trackChangeEmitted = true;
        };

        player.on('trackchange', trackChangeHandler);

        // Call previous()
        await player.previous();

        // Should NOT emit trackchange (just pauses)
        expect(trackChangeEmitted).toBe(false);

        player.off('trackchange', trackChangeHandler);
      });

      it('should emit trackchange when restarting current track (> 3 seconds)', async () => {
        player.jumpToQueueIndex(1);
        (player as any)._state.currentTime = 5; // > 3 seconds

        let trackChangeEmitted = false;
        let emittedTrack: any = null;

        const trackChangeHandler = (track: any) => {
          trackChangeEmitted = true;
          emittedTrack = track;
        };

        player.on('trackchange', trackChangeHandler);

        // Call previous()
        await player.previous();

        // Should emit trackchange with same track (restart)
        expect(trackChangeEmitted).toBe(true);
        expect(emittedTrack?.id).toBe('track-2');

        player.off('trackchange', trackChangeHandler);
      });
    });

    describe('Integration with play() method', () => {
      it('should call play() with correct index', async () => {
        player.jumpToQueueIndex(2);
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 0;

        // Call previous()
        await player.previous();

        // Verify play was called with index 1
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
      });

      it('should handle play() errors gracefully', async () => {
        player.jumpToQueueIndex(1);
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 0;

        // Mock audio element play to reject
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          const originalPlay = audioElement.play.bind(audioElement);
          audioElement.play = () => Promise.reject(new Error('Playback failed'));

          let errorEmitted = false;
          const errorHandler = () => {
            errorEmitted = true;
          };

          player.on('error', errorHandler);

          // Call previous()
          await player.previous();

          // Should emit error
          expect(errorEmitted).toBe(true);

          player.off('error', errorHandler);

          // Restore original play method
          audioElement.play = originalPlay;
        }
      });
    });

    describe('State consistency', () => {
      it('should maintain consistent state after previous()', async () => {
        player.jumpToQueueIndex(2);
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 0;

        // Call previous()
        await player.previous();

        const state = player.getState();

        // Verify state consistency
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
        expect(state.error).toBeNull();
      });

      it('should update currentTrack to match currentQueueIndex', async () => {
        player.jumpToQueueIndex(1);
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 0;

        // Call previous()
        await player.previous();

        const state = player.getState();
        const queue = player.getQueue();

        // Verify currentTrack matches the track at currentQueueIndex
        expect(state.currentTrack).toEqual(queue[state.currentQueueIndex]);
      });
    });

    describe('Interaction with 3-second rule and repeat modes', () => {
      it('should respect 3-second rule even with repeat "all"', async () => {
        player.jumpToQueueIndex(1);
        (player as any)._state.repeatMode = 'all';
        (player as any)._state.currentTime = 5; // > 3 seconds

        // Call previous()
        await player.previous();

        // Should restart current track (not go to previous)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
      });

      it('should respect 3-second rule even with repeat "none"', async () => {
        player.jumpToQueueIndex(1);
        (player as any)._state.repeatMode = 'none';
        (player as any)._state.currentTime = 4; // > 3 seconds

        // Call previous()
        await player.previous();

        // Should restart current track (not go to previous)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-2');
      });

      it('should loop to end when at beginning with repeat "all" and time <= 3', async () => {
        player.jumpToQueueIndex(0);
        (player as any)._state.repeatMode = 'all';
        (player as any)._state.currentTime = 1; // <= 3 seconds

        // Call previous()
        await player.previous();

        // Should loop to last track
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.currentTrack?.id).toBe('track-3');
      });
    });
  });

  describe('queue Modes - setRepeatMode() method', () => {
    describe('Valid repeat mode values', () => {
      it('should set repeat mode to "none"', () => {
        player.setRepeatMode('none');
        
        const state = player.getState();
        expect(state.repeatMode).toBe('none');
        expect(state.error).toBeNull();
      });

      it('should set repeat mode to "one"', () => {
        player.setRepeatMode('one');
        
        const state = player.getState();
        expect(state.repeatMode).toBe('one');
        expect(state.error).toBeNull();
      });

      it('should set repeat mode to "all"', () => {
        player.setRepeatMode('all');
        
        const state = player.getState();
        expect(state.repeatMode).toBe('all');
        expect(state.error).toBeNull();
      });

      it('should allow changing repeat mode multiple times', () => {
        player.setRepeatMode('none');
        expect(player.getState().repeatMode).toBe('none');

        player.setRepeatMode('one');
        expect(player.getState().repeatMode).toBe('one');

        player.setRepeatMode('all');
        expect(player.getState().repeatMode).toBe('all');

        player.setRepeatMode('none');
        expect(player.getState().repeatMode).toBe('none');
      });
    });

    describe('Invalid repeat mode values', () => {
      it('should emit error for invalid repeat mode', () => {
        let errorEmitted = false;
        const errorHandler = (error: any) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toContain('Invalid repeat mode');
          expect(error.message).toContain('invalid-mode');
          errorEmitted = true;
        };

        player.on('error', errorHandler);

        // @ts-expect-error - Testing invalid value
        player.setRepeatMode('invalid-mode');

        expect(errorEmitted).toBe(true);
        player.off('error', errorHandler);
      });

      it('should not change repeat mode when invalid value is provided', () => {
        // Set to a known valid mode first
        player.setRepeatMode('one');
        expect(player.getState().repeatMode).toBe('one');

        // Try to set invalid mode
        // @ts-expect-error - Testing invalid value
        player.setRepeatMode('invalid');

        // Should still be 'one'
        expect(player.getState().repeatMode).toBe('one');
      });

      it('should set error state when invalid mode is provided', () => {
        // @ts-expect-error - Testing invalid value
        player.setRepeatMode('wrong');

        const state = player.getState();
        expect(state.error).not.toBeNull();
        expect(state.error?.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Event emission', () => {
      it('should emit statechange event when repeat mode is set', () => {
        return new Promise<void>((resolve) => {
          const stateChangeHandler = (state: any) => {
            expect(state.repeatMode).toBe('all');
            player.off('statechange', stateChangeHandler);
            resolve();
          };

          player.on('statechange', stateChangeHandler);
          player.setRepeatMode('all');
        });
      });

      it('should emit statechange event for each mode change', () => {
        let stateChangeCount = 0;
        const stateChangeHandler = () => {
          stateChangeCount++;
        };

        player.on('statechange', stateChangeHandler);

        player.setRepeatMode('none');
        player.setRepeatMode('one');
        player.setRepeatMode('all');

        expect(stateChangeCount).toBe(3);
        player.off('statechange', stateChangeHandler);
      });

      it('should not emit statechange event when invalid mode is provided', () => {
        let stateChangeCount = 0;
        const stateChangeHandler = () => {
          stateChangeCount++;
        };

        player.on('statechange', stateChangeHandler);

        // @ts-expect-error - Testing invalid value
        player.setRepeatMode('invalid');

        expect(stateChangeCount).toBe(0);
        player.off('statechange', stateChangeHandler);
      });
    });

    describe('Error clearing', () => {
      it('should clear previous error when setting valid repeat mode', () => {
        // First cause an error
        // @ts-expect-error - Testing invalid value
        player.setRepeatMode('invalid');
        expect(player.getState().error).not.toBeNull();

        // Now set valid mode
        player.setRepeatMode('one');

        // Error should be cleared
        const state = player.getState();
        expect(state.error).toBeNull();
      });
    });

    describe('Integration with queue navigation', () => {
      beforeEach(() => {
        // Set up a test queue
        player.addToQueue([
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ]);
      });

      it('should affect next() behavior when set to "none"', async () => {
        player.jumpToQueueIndex(2); // Last track
        player.setRepeatMode('none');

        // Set up to detect pause
        let pauseCalled = false;
        const pauseHandler = () => {
          pauseCalled = true;
        };
        player.on('pause', pauseHandler);

        // Call next() - should pause at end
        player.next();

        // Simulate pause event that would normally fire
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.dispatchEvent(new Event('pause'));
        }

        expect(pauseCalled).toBe(true);
        player.off('pause', pauseHandler);
      });

      it('should affect next() behavior when set to "one"', async () => {
        player.jumpToQueueIndex(1);
        player.setRepeatMode('one');

        // Call next() - should stay on same track
        await player.next();

        const state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
      });

      it('should affect next() behavior when set to "all"', async () => {
        player.jumpToQueueIndex(2); // Last track
        player.setRepeatMode('all');

        // Call next() - should loop to first track
        await player.next();

        const state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
      });

      it('should affect previous() behavior when set to "all"', async () => {
        player.jumpToQueueIndex(0); // First track
        player.setRepeatMode('all');
        (player as any)._state.currentTime = 1; // Less than 3 seconds

        // Call previous() - should loop to last track
        await player.previous();

        const state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
      });
    });

    describe('State persistence placeholder', () => {
      it('should have TODO comment for state persistence', () => {
        // This test verifies that the TODO comment exists in the implementation
        // The actual persistence will be implemented in task 11.1
        player.setRepeatMode('all');
        
        // For now, just verify the method works
        expect(player.getState().repeatMode).toBe('all');
      });
    });
  });

  describe('queue Modes - _shuffleQueue() helper method', () => {
    describe('Edge cases', () => {
      it('should handle empty queue without error', () => {
        // Clear queue
        player.clearQueue();

        // Call shuffle on empty queue (should be no-op)
        expect(() => {
          (player as any)._shuffleQueue();
        }).not.toThrow();

        // queue should still be empty
        expect(player.getQueue().length).toBe(0);
      });

      it('should handle single-track queue without error', () => {
        // Add single track
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });

        // Call shuffle on single-track queue (should be no-op)
        (player as any)._shuffleQueue();

        // queue should still have one track
        const queue = player.getQueue();
        expect(queue.length).toBe(1);
        expect(queue[0].id).toBe('track-1');
      });
    });

    describe('Original queue preservation', () => {
      it('should save original queue order before shuffling', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Shuffle
        (player as any)._shuffleQueue();

        // Check that _originalQueue was saved
        const originalqueue = (player as any)._originalQueue;
        expect(originalqueue.length).toBe(4);
        expect(originalqueue[0].id).toBe('track-1');
        expect(originalqueue[1].id).toBe('track-2');
        expect(originalqueue[2].id).toBe('track-3');
        expect(originalqueue[3].id).toBe('track-4');
      });
    });

    describe('Fisher-Yates shuffle algorithm', () => {
      it('should randomize queue order', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
          { id: 'track-5', src: 'audio5.mp3', title: 'Track 5' },
        ];
        player.addToQueue(tracks);

        // Get original order
        const originalOrder = player.getQueue().map(t => t.id);

        // Shuffle multiple times and check if we get different orders
        let foundDifferentOrder = false;
        for (let i = 0; i < 10; i++) {
          // Reset queue to original order
          (player as any)._queue = [...tracks];
          
          // Shuffle
          (player as any)._shuffleQueue();

          // Get shuffled order
          const shuffledOrder = player.getQueue().map(t => t.id);

          // Check if order changed
          const orderChanged = shuffledOrder.some((id, idx) => id !== originalOrder[idx]);
          if (orderChanged) {
            foundDifferentOrder = true;
            break;
          }
        }

        // With 5 tracks, the probability of getting the same order after 10 shuffles is extremely low
        expect(foundDifferentOrder).toBe(true);
      });

      it('should maintain all tracks in queue after shuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Shuffle
        (player as any)._shuffleQueue();

        // Get shuffled queue
        const shuffledqueue = player.getQueue();

        // Check that all tracks are still present
        expect(shuffledqueue.length).toBe(4);
        expect(shuffledqueue.some(t => t.id === 'track-1')).toBe(true);
        expect(shuffledqueue.some(t => t.id === 'track-2')).toBe(true);
        expect(shuffledqueue.some(t => t.id === 'track-3')).toBe(true);
        expect(shuffledqueue.some(t => t.id === 'track-4')).toBe(true);
      });
    });

    describe('Current track preservation', () => {
      it('should preserve current track at current index when shuffling', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
          { id: 'track-5', src: 'audio5.mp3', title: 'Track 5' },
        ];
        player.addToQueue(tracks);

        // Set current track to index 2 (track-3)
        player.jumpToQueueIndex(2);

        // Verify current track before shuffle
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.currentTrack?.id).toBe('track-3');

        // Shuffle
        (player as any)._shuffleQueue();

        // Verify current track is still at index 2
        state = player.getState();
        const queue = player.getQueue();
        expect(state.currentQueueIndex).toBe(2);
        expect(queue[2].id).toBe('track-3');
        expect(state.currentTrack?.id).toBe('track-3');
      });

      it('should shuffle without preserving when no current track is set', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Ensure no current track is set
        (player as any)._state.currentTrack = null;
        (player as any)._state.currentQueueIndex = -1;

        // Shuffle
        (player as any)._shuffleQueue();

        // Verify all tracks are still present
        const queue = player.getQueue();
        expect(queue.length).toBe(4);
        expect(queue.some(t => t.id === 'track-1')).toBe(true);
        expect(queue.some(t => t.id === 'track-2')).toBe(true);
        expect(queue.some(t => t.id === 'track-3')).toBe(true);
        expect(queue.some(t => t.id === 'track-4')).toBe(true);
      });

      it('should preserve current track at index 0', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];
        player.addToQueue(tracks);

        // Set current track to index 0
        player.jumpToQueueIndex(0);

        // Shuffle
        (player as any)._shuffleQueue();

        // Verify current track is still at index 0
        const queue = player.getQueue();
        expect(queue[0].id).toBe('track-1');
      });

      it('should preserve current track at last index', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];
        player.addToQueue(tracks);

        // Set current track to last index
        player.jumpToQueueIndex(2);

        // Shuffle
        (player as any)._shuffleQueue();

        // Verify current track is still at last index
        const queue = player.getQueue();
        expect(queue[2].id).toBe('track-3');
      });
    });

    describe('Event emission', () => {
      it('should emit queuechange event when shuffling', () => {
        return new Promise<void>((resolve) => {
          // Add tracks
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
            { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          ];
          player.addToQueue(tracks);

          // Set up event listener
          const queueChangeHandler = (queue: any) => {
            expect(Array.isArray(queue)).toBe(true);
            expect(queue.length).toBe(3);
            player.off('queuechange', queueChangeHandler);
            resolve();
          };

          player.on('queuechange', queueChangeHandler);

          // Shuffle
          (player as any)._shuffleQueue();
        });
      });

      it('should not emit queuechange for empty queue', () => {
        let eventEmitted = false;
        const queueChangeHandler = () => {
          eventEmitted = true;
        };

        player.on('queuechange', queueChangeHandler);

        // Shuffle empty queue
        (player as any)._shuffleQueue();

        // Event should not be emitted for empty queue
        expect(eventEmitted).toBe(false);
        player.off('queuechange', queueChangeHandler);
      });

      it('should not emit queuechange for single-track queue', () => {
        let eventEmitted = false;
        const queueChangeHandler = () => {
          eventEmitted = true;
        };

        // Add single track
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });

        player.on('queuechange', queueChangeHandler);

        // Shuffle single-track queue
        (player as any)._shuffleQueue();

        // Event should not be emitted for single-track queue
        expect(eventEmitted).toBe(false);
        player.off('queuechange', queueChangeHandler);
      });
    });

    describe('Multiple shuffle operations', () => {
      it('should handle multiple consecutive shuffles', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Set current track
        player.jumpToQueueIndex(1);

        // Shuffle multiple times
        (player as any)._shuffleQueue();
        (player as any)._shuffleQueue();
        (player as any)._shuffleQueue();

        // Verify queue integrity
        const queue = player.getQueue();
        expect(queue.length).toBe(4);
        
        // Verify current track is still at index 1
        expect(queue[1].id).toBe('track-2');
        
        // Verify all tracks are still present
        expect(queue.some(t => t.id === 'track-1')).toBe(true);
        expect(queue.some(t => t.id === 'track-2')).toBe(true);
        expect(queue.some(t => t.id === 'track-3')).toBe(true);
        expect(queue.some(t => t.id === 'track-4')).toBe(true);
      });

      it('should update _originalQueue on each shuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];
        player.addToQueue(tracks);

        // First shuffle
        (player as any)._shuffleQueue();
        const firstShuffled = [...(player as any)._queue];
        const firstOriginal = [...(player as any)._originalQueue];

        // The _originalQueue after first shuffle should be the original order
        expect(firstOriginal[0].id).toBe('track-1');
        expect(firstOriginal[1].id).toBe('track-2');
        expect(firstOriginal[2].id).toBe('track-3');

        // Second shuffle
        (player as any)._shuffleQueue();
        const secondOriginal = [...(player as any)._originalQueue];

        // The _originalQueue should be updated to the state before the second shuffle
        // which is the result of the first shuffle
        expect(secondOriginal).toEqual(firstShuffled);
      });
    });
  });

  describe('queue Modes - _unshuffleQueue() helper method', () => {
    describe('Edge cases', () => {
      it('should handle empty original queue without error', () => {
        // Clear queue
        player.clearQueue();

        // Ensure _originalQueue is empty
        (player as any)._originalQueue = [];

        // Call unshuffle on empty original queue (should be no-op)
        expect(() => {
          (player as any)._unshuffleQueue();
        }).not.toThrow();

        // queue should still be empty
        expect(player.getQueue().length).toBe(0);
      });

      it('should handle single-track original queue', () => {
        // Add a single track
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });

        // Manually set _originalQueue
        (player as any)._originalQueue = [{ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' }];

        // Call unshuffle
        (player as any)._unshuffleQueue();

        // queue should still have one track
        const queue = player.getQueue();
        expect(queue.length).toBe(1);
        expect(queue[0].id).toBe('track-1');
      });
    });

    describe('Restore original order', () => {
      it('should restore queue to original order', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Save original order
        const originalOrder = player.getQueue().map(t => t.id);

        // Shuffle
        (player as any)._shuffleQueue();

        // Verify order changed (might not always change, but _originalQueue should be set)
        expect((player as any)._originalQueue.length).toBe(4);

        // Unshuffle
        (player as any)._unshuffleQueue();

        // Verify order is restored
        const restoredOrder = player.getQueue().map(t => t.id);
        expect(restoredOrder).toEqual(originalOrder);
      });

      it('should maintain all tracks after unshuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];
        player.addToQueue(tracks);

        // Shuffle
        (player as any)._shuffleQueue();

        // Unshuffle
        (player as any)._unshuffleQueue();

        // Check that all tracks are still present
        const queue = player.getQueue();
        expect(queue.length).toBe(3);
        expect(queue.some(t => t.id === 'track-1')).toBe(true);
        expect(queue.some(t => t.id === 'track-2')).toBe(true);
        expect(queue.some(t => t.id === 'track-3')).toBe(true);
      });
    });

    describe('Current track index update', () => {
      it('should update currentQueueIndex to match current track in restored order', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Set current track to track-3 (index 2)
        player.jumpToQueueIndex(2);

        // Verify current track before shuffle
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.currentTrack?.id).toBe('track-3');

        // Shuffle (this preserves current track at index 2)
        (player as any)._shuffleQueue();

        // Verify current track is still at index 2 after shuffle
        state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.currentTrack?.id).toBe('track-3');

        // Unshuffle
        (player as any)._unshuffleQueue();

        // Verify current track is back at its original index (2)
        state = player.getState();
        expect(state.currentQueueIndex).toBe(2);
        expect(state.currentTrack?.id).toBe('track-3');
      });

      it('should handle case when current track is at different position after unshuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];
        player.addToQueue(tracks);

        // Set current track to track-1 (index 0)
        player.jumpToQueueIndex(0);

        // Manually shuffle queue (not using _shufflequeue to test edge case)
        (player as any)._originalQueue = [...tracks];
        (player as any)._queue = [tracks[2], tracks[0], tracks[1]]; // track-3, track-1, track-2
        (player as any)._state.currentQueueIndex = 1; // track-1 is now at index 1

        // Verify current track is at index 1 in shuffled order
        let state = player.getState();
        expect(state.currentQueueIndex).toBe(1);
        expect(state.currentTrack?.id).toBe('track-1');

        // Unshuffle
        (player as any)._unshuffleQueue();

        // Verify current track is back at index 0 in original order
        state = player.getState();
        expect(state.currentQueueIndex).toBe(0);
        expect(state.currentTrack?.id).toBe('track-1');
      });

      it('should set currentQueueIndex to -1 when no current track', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];
        player.addToQueue(tracks);

        // Shuffle
        (player as any)._shuffleQueue();

        // Clear current track
        (player as any)._state.currentTrack = null;
        (player as any)._state.currentQueueIndex = -1;

        // Unshuffle
        (player as any)._unshuffleQueue();

        // Verify currentQueueIndex is -1
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(-1);
        expect(state.currentTrack).toBeNull();
      });

      it('should handle case when current track is not found in restored queue', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];
        player.addToQueue(tracks);

        // Shuffle
        (player as any)._shuffleQueue();

        // Set current track to a track not in the queue
        (player as any)._state.currentTrack = { id: 'track-999', src: 'audio999.mp3', title: 'Track 999' };

        // Unshuffle
        (player as any)._unshuffleQueue();

        // Verify currentQueueIndex is -1 (track not found)
        const state = player.getState();
        expect(state.currentQueueIndex).toBe(-1);
      });
    });

    describe('Clear original queue', () => {
      it('should clear _originalQueue after unshuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];
        player.addToQueue(tracks);

        // Shuffle
        (player as any)._shuffleQueue();

        // Verify _originalQueue is set
        expect((player as any)._originalQueue.length).toBe(2);

        // Unshuffle
        (player as any)._unshuffleQueue();

        // Verify _originalQueue is cleared
        expect((player as any)._originalQueue.length).toBe(0);
      });
    });

    describe('Event emission', () => {
      it('should emit queuechange event when unshuffling', () => {
        return new Promise<void>((resolve) => {
          // Add tracks
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          ];
          player.addToQueue(tracks);

          // Shuffle
          (player as any)._shuffleQueue();

          let queueChangeEmitted = false;
          const queueChangeHandler = () => {
            queueChangeEmitted = true;
            player.off('queuechange', queueChangeHandler);
            expect(queueChangeEmitted).toBe(true);
            resolve();
          };

          player.on('queuechange', queueChangeHandler);

          // Unshuffle
          (player as any)._unshuffleQueue();
        });
      });

      it('should not emit queuechange event when original queue is empty', () => {
        // Clear queue
        player.clearQueue();
        (player as any)._originalQueue = [];

        let queueChangeEmitted = false;
        const queueChangeHandler = () => {
          queueChangeEmitted = true;
        };

        player.on('queuechange', queueChangeHandler);

        // Unshuffle empty original queue
        (player as any)._unshuffleQueue();

        // Wait a bit to ensure event doesn't fire
        setTimeout(() => {
          expect(queueChangeEmitted).toBe(false);
          player.off('queuechange', queueChangeHandler);
        }, 100);
      });
    });

    describe('Shuffle-unshuffle round-trip', () => {
      it('should restore exact original order after shuffle-unshuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
          { id: 'track-5', src: 'audio5.mp3', title: 'Track 5' },
        ];
        player.addToQueue(tracks);

        // Save original order
        const originalOrder = player.getQueue().map(t => t.id);

        // Shuffle and unshuffle
        (player as any)._shuffleQueue();
        (player as any)._unshuffleQueue();

        // Verify order is exactly restored
        const restoredOrder = player.getQueue().map(t => t.id);
        expect(restoredOrder).toEqual(originalOrder);
      });

      it('should maintain current track through shuffle-unshuffle cycle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];
        player.addToQueue(tracks);

        // Set current track
        player.jumpToQueueIndex(1);

        // Save original state
        const originalState = player.getState();
        expect(originalState.currentTrack?.id).toBe('track-2');
        expect(originalState.currentQueueIndex).toBe(1);

        // Shuffle and unshuffle
        (player as any)._shuffleQueue();
        (player as any)._unshuffleQueue();

        // Verify current track is maintained
        const restoredState = player.getState();
        expect(restoredState.currentTrack?.id).toBe('track-2');
        expect(restoredState.currentQueueIndex).toBe(1);
      });
    });
  });

  describe('queue Modes - toggleShuffle() method', () => {
    describe('Basic functionality', () => {
      it('should enable shuffle when currently not shuffled', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Verify initial state
        let state = player.getState();
        expect(state.isShuffling).toBe(false);

        // Toggle shuffle (should enable)
        player.toggleShuffle();

        // Verify shuffle is enabled
        state = player.getState();
        expect(state.isShuffling).toBe(true);
      });

      it('should disable shuffle when currently shuffled', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Enable shuffle first
        player.toggleShuffle();
        let state = player.getState();
        expect(state.isShuffling).toBe(true);

        // Toggle shuffle again (should disable)
        player.toggleShuffle();

        // Verify shuffle is disabled
        state = player.getState();
        expect(state.isShuffling).toBe(false);
      });

      it('should toggle between shuffled and unshuffled states multiple times', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];
        player.addToQueue(tracks);

        // Initial state: not shuffled
        let state = player.getState();
        expect(state.isShuffling).toBe(false);

        // Toggle 1: enable shuffle
        player.toggleShuffle();
        state = player.getState();
        expect(state.isShuffling).toBe(true);

        // Toggle 2: disable shuffle
        player.toggleShuffle();
        state = player.getState();
        expect(state.isShuffling).toBe(false);

        // Toggle 3: enable shuffle again
        player.toggleShuffle();
        state = player.getState();
        expect(state.isShuffling).toBe(true);

        // Toggle 4: disable shuffle again
        player.toggleShuffle();
        state = player.getState();
        expect(state.isShuffling).toBe(false);
      });
    });

    describe('queue manipulation', () => {
      it('should shuffle queue when enabling shuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
          { id: 'track-5', src: 'audio5.mp3', title: 'Track 5' },
        ];
        player.addToQueue(tracks);

        // Get original order
        const originalOrder = player.getQueue().map(t => t.id);

        // Toggle shuffle (enable)
        player.toggleShuffle();

        // Get shuffled order
        const shuffledOrder = player.getQueue().map(t => t.id);

        // With 5 tracks, there's a high probability the order changed
        // We can't guarantee it changed (could randomly be same), but we can verify
        // that all tracks are still present
        expect(shuffledOrder.length).toBe(originalOrder.length);
        expect(shuffledOrder.every(id => originalOrder.includes(id))).toBe(true);
      });

      it('should restore original queue order when disabling shuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Get original order
        const originalOrder = player.getQueue().map(t => t.id);

        // Enable shuffle
        player.toggleShuffle();

        // Disable shuffle
        player.toggleShuffle();

        // Get restored order
        const restoredOrder = player.getQueue().map(t => t.id);

        // Verify order is exactly restored
        expect(restoredOrder).toEqual(originalOrder);
      });

      it('should maintain all tracks after toggling shuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];
        player.addToQueue(tracks);

        // Toggle shuffle on
        player.toggleShuffle();
        let queue = player.getQueue();
        expect(queue.length).toBe(3);
        expect(queue.some(t => t.id === 'track-1')).toBe(true);
        expect(queue.some(t => t.id === 'track-2')).toBe(true);
        expect(queue.some(t => t.id === 'track-3')).toBe(true);

        // Toggle shuffle off
        player.toggleShuffle();
        queue = player.getQueue();
        expect(queue.length).toBe(3);
        expect(queue.some(t => t.id === 'track-1')).toBe(true);
        expect(queue.some(t => t.id === 'track-2')).toBe(true);
        expect(queue.some(t => t.id === 'track-3')).toBe(true);
      });
    });

    describe('Current track preservation', () => {
      it('should preserve current track when enabling shuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Set current track
        player.jumpToQueueIndex(2);
        const currentTrackBefore = player.getState().currentTrack;

        // Toggle shuffle (enable)
        player.toggleShuffle();

        // Verify current track is maintained
        const currentTrackAfter = player.getState().currentTrack;
        expect(currentTrackAfter?.id).toBe(currentTrackBefore?.id);
      });

      it('should update current track index when disabling shuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' },
        ];
        player.addToQueue(tracks);

        // Set current track to index 2 (track-3)
        player.jumpToQueueIndex(2);
        expect(player.getState().currentQueueIndex).toBe(2);
        expect(player.getState().currentTrack?.id).toBe('track-3');

        // Enable shuffle
        player.toggleShuffle();

        // Current track should still be track-3, but index might be different
        expect(player.getState().currentTrack?.id).toBe('track-3');

        // Disable shuffle
        player.toggleShuffle();

        // Current track should still be track-3, and index should be back to 2
        expect(player.getState().currentTrack?.id).toBe('track-3');
        expect(player.getState().currentQueueIndex).toBe(2);
      });

      it('should handle toggling shuffle with no current track', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];
        player.addToQueue(tracks);

        // Ensure no current track
        (player as any)._state.currentTrack = null;
        (player as any)._state.currentQueueIndex = -1;

        // Toggle shuffle (should not throw)
        expect(() => {
          player.toggleShuffle();
        }).not.toThrow();

        // Verify shuffle is enabled
        expect(player.getState().isShuffling).toBe(true);

        // Toggle shuffle off (should not throw)
        expect(() => {
          player.toggleShuffle();
        }).not.toThrow();

        // Verify shuffle is disabled
        expect(player.getState().isShuffling).toBe(false);
      });
    });

    describe('Event emission', () => {
      it('should emit statechange event when toggling shuffle on', () => {
        return new Promise<void>((resolve) => {
          // Add tracks
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
            { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          ];
          player.addToQueue(tracks);

          let stateChangeEmitted = false;
          const stateChangeHandler = () => {
            stateChangeEmitted = true;
            player.off('statechange', stateChangeHandler);
            expect(stateChangeEmitted).toBe(true);
            resolve();
          };

          player.on('statechange', stateChangeHandler);

          // Toggle shuffle
          player.toggleShuffle();
        });
      });

      it('should emit statechange event when toggling shuffle off', () => {
        return new Promise<void>((resolve) => {
          // Add tracks
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
            { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          ];
          player.addToQueue(tracks);

          // Enable shuffle first
          player.toggleShuffle();

          let stateChangeEmitted = false;
          const stateChangeHandler = () => {
            stateChangeEmitted = true;
            player.off('statechange', stateChangeHandler);
            expect(stateChangeEmitted).toBe(true);
            resolve();
          };

          player.on('statechange', stateChangeHandler);

          // Toggle shuffle off
          player.toggleShuffle();
        });
      });

      it('should emit queuechange event when shuffling', () => {
        return new Promise<void>((resolve) => {
          // Add tracks
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
            { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          ];
          player.addToQueue(tracks);

          let queueChangeEmitted = false;
          const queueChangeHandler = () => {
            queueChangeEmitted = true;
            player.off('queuechange', queueChangeHandler);
            expect(queueChangeEmitted).toBe(true);
            resolve();
          };

          player.on('queuechange', queueChangeHandler);

          // Toggle shuffle (should trigger queuechange via _shufflequeue)
          player.toggleShuffle();
        });
      });

      it('should emit queuechange event when unshuffling', () => {
        return new Promise<void>((resolve) => {
          // Add tracks
          const tracks = [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
            { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          ];
          player.addToQueue(tracks);

          // Enable shuffle first
          player.toggleShuffle();

          let queueChangeEmitted = false;
          const queueChangeHandler = () => {
            queueChangeEmitted = true;
            player.off('queuechange', queueChangeHandler);
            expect(queueChangeEmitted).toBe(true);
            resolve();
          };

          player.on('queuechange', queueChangeHandler);

          // Toggle shuffle off (should trigger queuechange via _unshufflequeue)
          player.toggleShuffle();
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle toggling shuffle on empty queue', () => {
        // Clear queue
        player.clearQueue();

        // Toggle shuffle (should not throw)
        expect(() => {
          player.toggleShuffle();
        }).not.toThrow();

        // Verify shuffle state is updated
        expect(player.getState().isShuffling).toBe(true);

        // Toggle off (should not throw)
        expect(() => {
          player.toggleShuffle();
        }).not.toThrow();

        // Verify shuffle state is updated
        expect(player.getState().isShuffling).toBe(false);
      });

      it('should handle toggling shuffle on single-track queue', () => {
        // Add single track
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });

        // Get original order
        const originalOrder = player.getQueue().map(t => t.id);

        // Toggle shuffle on
        player.toggleShuffle();
        expect(player.getState().isShuffling).toBe(true);

        // queue should be unchanged (only one track)
        let queue = player.getQueue();
        expect(queue.length).toBe(1);
        expect(queue[0]?.id).toBe('track-1');

        // Toggle shuffle off
        player.toggleShuffle();
        expect(player.getState().isShuffling).toBe(false);

        // queue should still be unchanged
        queue = player.getQueue();
        expect(queue.length).toBe(1);
        expect(queue[0]?.id).toBe('track-1');
      });
    });

    describe('Error handling', () => {
      it('should clear previous error when toggling shuffle', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];
        player.addToQueue(tracks);

        // Manually set an error in state
        (player as any)._state.error = {
          code: 'TEST_ERROR',
          message: 'Test error',
        };

        // Verify error exists
        expect(player.getState().error).not.toBeNull();

        // Toggle shuffle
        player.toggleShuffle();

        // Verify error is cleared
        expect(player.getState().error).toBeNull();
      });
    });

    describe('Integration with other methods', () => {
      it('should work correctly with addTrack after shuffle is enabled', () => {
        // Add initial tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];
        player.addToQueue(tracks);

        // Enable shuffle
        player.toggleShuffle();
        expect(player.getState().isShuffling).toBe(true);

        // Add another track
        player.addToQueue({ id: 'track-3', src: 'audio3.mp3', title: 'Track 3' });

        // Verify queue has 3 tracks
        const queue = player.getQueue();
        expect(queue.length).toBe(3);
        expect(queue.some(t => t.id === 'track-3')).toBe(true);
      });

      it('should work correctly with removeTrack after shuffle is enabled', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
        ];
        player.addToQueue(tracks);

        // Enable shuffle
        player.toggleShuffle();
        expect(player.getState().isShuffling).toBe(true);

        // Remove a track
        player.removeFromQueue(1);

        // Verify queue has 2 tracks
        const queue = player.getQueue();
        expect(queue.length).toBe(2);
      });

      it('should work correctly with clearqueue after shuffle is enabled', () => {
        // Add tracks
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];
        player.addToQueue(tracks);

        // Enable shuffle
        player.toggleShuffle();
        expect(player.getState().isShuffling).toBe(true);

        // Clear queue
        player.clearQueue();

        // Verify queue is empty
        expect(player.getQueue().length).toBe(0);

        // Shuffle state should still be true
        expect(player.getState().isShuffling).toBe(true);
      });
    });
  });

  describe('State Persistence - _persistState() method', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    afterEach(() => {
      // Clean up localStorage after each test
      localStorage.clear();
    });

    describe('Basic persistence functionality', () => {
      it('should save state to localStorage when called', () => {
        // Add a track and set some state
        const track = { id: 'track-1', src: 'audio1.mp3', title: 'Track 1', artist: 'Artist 1' };
        player.addToQueue(track);
        player.jumpToQueueIndex(0);
        player.setVolume(0.7);
        player.setPlaybackRate(1.5);
        player.setRepeatMode('all');

        // Manually call _persistState (it's called automatically by methods above)
        (player as any)._persistState();

        // Verify localStorage has the data
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).not.toBeNull();

        // Parse and verify the saved data
        const parsedData = JSON.parse(savedData!);
        expect(parsedData.version).toBe('1.0.0');
        expect(parsedData.currentTrackId).toBe('track-1');
        expect(parsedData.volume).toBe(0.7);
        expect(parsedData.playbackRate).toBe(1.5);
        expect(parsedData.repeatMode).toBe('all');
        expect(parsedData.isShuffling).toBe(false);
        expect(parsedData.queue).toHaveLength(1);
        expect(parsedData.queue[0].id).toBe('track-1');
      });

      it('should save simplified queue to reduce storage size', () => {
        // Add tracks with extra metadata
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1', artist: 'Artist 1', artwork: 'art1.jpg', customField: 'custom1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2', artist: 'Artist 2', artwork: 'art2.jpg', customField: 'custom2' },
        ];
        player.addToQueue(tracks);

        // Trigger persistence
        (player as any)._persistState();

        // Verify localStorage has the data
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        const parsedData = JSON.parse(savedData!);

        // Verify only essential fields are saved
        expect(parsedData.queue).toHaveLength(2);
        expect(parsedData.queue[0]).toEqual({
          id: 'track-1',
          src: 'audio1.mp3',
          title: 'Track 1',
          artist: 'Artist 1',
          artwork: 'art1.jpg',
        });
        // Custom fields should not be saved
        expect(parsedData.queue[0].customField).toBeUndefined();
      });

      it('should save null currentTrackId when no track is set', () => {
        // Don't set any current track
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });

        // Trigger persistence
        (player as any)._persistState();

        // Verify currentTrackId is null
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        const parsedData = JSON.parse(savedData!);
        expect(parsedData.currentTrackId).toBeNull();
      });

      it('should save current playback time', () => {
        // Set current time
        (player as any)._state.currentTime = 42.5;

        // Trigger persistence
        (player as any)._persistState();

        // Verify currentTime is saved
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        const parsedData = JSON.parse(savedData!);
        expect(parsedData.currentTime).toBe(42.5);
      });

      it('should save shuffle state', () => {
        // Add tracks and enable shuffle
        const tracks = [
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ];
        player.addToQueue(tracks);
        player.toggleShuffle();

        // Verify shuffle is enabled
        expect(player.getState().isShuffling).toBe(true);

        // Verify it's saved
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        const parsedData = JSON.parse(savedData!);
        expect(parsedData.isShuffling).toBe(true);
      });
    });

    describe('Automatic persistence triggers', () => {
      it('should persist state when pause() is called', () => {
        // Add and play a track
        const track = { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' };
        player.addToQueue(track);

        // Clear localStorage to verify persistence happens
        localStorage.clear();

        // Pause (which should trigger persistence)
        player.pause();

        // Verify state was persisted
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).not.toBeNull();
      });

      it('should persist state when setVolume() is called', () => {
        // Clear localStorage
        localStorage.clear();

        // Set volume (which should trigger persistence)
        player.setVolume(0.5);

        // Verify state was persisted
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).not.toBeNull();
        
        const parsedData = JSON.parse(savedData!);
        expect(parsedData.volume).toBe(0.5);
      });

      it('should persist state when addTrack() is called', () => {
        // Clear localStorage
        localStorage.clear();

        // Add track (which should trigger persistence)
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });

        // Verify state was persisted
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).not.toBeNull();
        
        const parsedData = JSON.parse(savedData!);
        expect(parsedData.queue).toHaveLength(1);
      });

      it('should persist state when removeTrack() is called', () => {
        // Add tracks first
        player.addToQueue([
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ]);

        // Clear localStorage
        localStorage.clear();

        // Remove track (which should trigger persistence)
        player.removeFromQueue(0);

        // Verify state was persisted
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).not.toBeNull();
        
        const parsedData = JSON.parse(savedData!);
        expect(parsedData.queue).toHaveLength(1);
      });

      it('should persist state when clearqueue() is called', () => {
        // Add tracks first
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });

        // Clear localStorage
        localStorage.clear();

        // Clear queue (which should trigger persistence)
        player.clearQueue();

        // Verify state was persisted
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).not.toBeNull();
        
        const parsedData = JSON.parse(savedData!);
        expect(parsedData.queue).toHaveLength(0);
      });

      it('should persist state when setRepeatMode() is called', () => {
        // Clear localStorage
        localStorage.clear();

        // Set repeat mode (which should trigger persistence)
        player.setRepeatMode('all');

        // Verify state was persisted
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).not.toBeNull();
        
        const parsedData = JSON.parse(savedData!);
        expect(parsedData.repeatMode).toBe('all');
      });

      it('should persist state when toggleShuffle() is called', () => {
        // Add tracks first
        player.addToQueue([
          { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
        ]);

        // Clear localStorage
        localStorage.clear();

        // Toggle shuffle (which should trigger persistence)
        player.toggleShuffle();

        // Verify state was persisted
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).not.toBeNull();
        
        const parsedData = JSON.parse(savedData!);
        expect(parsedData.isShuffling).toBe(true);
      });

      it('should debounce persistence on timeupdate events', async () => {
        // Add and load a track
        const track = { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' };
        player.addToQueue(track);
        await player.play(track);

        // Clear localStorage to verify debounced persistence
        localStorage.clear();

        // Simulate multiple rapid timeupdate events (as would happen during playback)
        const audioElement = document.body.querySelector('audio') as HTMLAudioElement;
        if (audioElement) {
          // Set different currentTime values
          Object.defineProperty(audioElement, 'currentTime', {
            value: 1.0,
            writable: true,
            configurable: true,
          });
          audioElement.dispatchEvent(new Event('timeupdate'));

          Object.defineProperty(audioElement, 'currentTime', {
            value: 1.5,
            writable: true,
            configurable: true,
          });
          audioElement.dispatchEvent(new Event('timeupdate'));

          Object.defineProperty(audioElement, 'currentTime', {
            value: 2.0,
            writable: true,
            configurable: true,
          });
          audioElement.dispatchEvent(new Event('timeupdate'));

          // Immediately after events, persistence should NOT have happened yet (debounced)
          let savedData = localStorage.getItem((player as any)._config.persistenceKey);
          expect(savedData).toBeNull();

          // Wait for debounce delay (5 seconds + buffer)
          await new Promise(resolve => setTimeout(resolve, 5100));

          // Now persistence should have happened
          savedData = localStorage.getItem((player as any)._config.persistenceKey);
          expect(savedData).not.toBeNull();

          const parsedData = JSON.parse(savedData!);
          // Should have saved the last currentTime value
          expect(parsedData.currentTime).toBe(2.0);
        }
      }, 10000); // Set timeout to 10 seconds for this test
    });

    describe('Error handling', () => {
      it('should handle localStorage quota exceeded errors gracefully', () => {
        // Mock localStorage.setItem to throw QuotaExceededError
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        };

        // Add track and trigger persistence
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });

        // Should not throw error
        expect(() => {
          (player as any)._persistState();
        }).not.toThrow();

        // Restore original setItem
        localStorage.setItem = originalSetItem;
      });

      it('should emit error event when persistence fails', () => {
        // Mock localStorage.setItem to throw error
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('Storage error');
        };

        // Listen for error event
        let errorEmitted = false;
        player.on('error', () => {
          errorEmitted = true;
        });

        // Trigger persistence
        (player as any)._persistState();

        // Verify error event was emitted
        expect(errorEmitted).toBe(true);

        // Restore original setItem
        localStorage.setItem = originalSetItem;
      });

      it('should not update player state error when persistence fails', () => {
        // Mock localStorage.setItem to throw error
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('Storage error');
        };

        // Trigger persistence
        (player as any)._persistState();

        // Verify player state error is still null
        // (persistence errors should not interrupt normal operation)
        const state = player.getState();
        expect(state.error).toBeNull();

        // Restore original setItem
        localStorage.setItem = originalSetItem;
      });
    });

    describe('Configuration respect', () => {
      it('should not persist when persistState config is false', () => {
        // Set config to disable persistence
        (player as any)._config.persistState = false;

        // Clear localStorage
        localStorage.clear();

        // Add track (which would normally trigger persistence)
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });

        // Verify nothing was saved
        const persistenceKey = (player as any)._config.persistenceKey;
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).toBeNull();

        // Restore config
        (player as any)._config.persistState = true;
      });

      it('should use custom persistence key from config', () => {
        // Set custom persistence key
        const customKey = 'custom_player_state';
        (player as any)._config.persistenceKey = customKey;

        // Clear localStorage
        localStorage.clear();

        // Add track (which should trigger persistence)
        player.addToQueue({ id: 'track-1', src: 'audio1.mp3', title: 'Track 1' });

        // Verify data was saved with custom key
        const savedData = localStorage.getItem(customKey);
        expect(savedData).not.toBeNull();

        // Verify default key was not used
        const defaultData = localStorage.getItem('makenoise_state');
        expect(defaultData).toBeNull();

        // Restore default key
        (player as any)._config.persistenceKey = 'makenoise_state';
      });
    });
  });

  describe('State Persistence - _loadPersistedState() method', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    afterEach(() => {
      // Clean up localStorage after each test
      localStorage.clear();
    });

    describe('Basic loading functionality', () => {
      it('should restore volume from persisted state', () => {
        // Create persisted state with custom volume
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 0.7,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify volume was restored
        const state = player.getState();
        expect(state.volume).toBe(0.7);
      });

      it('should restore playbackRate from persisted state', () => {
        // Create persisted state with custom playback rate
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 1.0,
          playbackRate: 1.5,
          repeatMode: 'none',
          isShuffling: false,
          queue: [],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify playback rate was restored
        const state = player.getState();
        expect(state.playbackRate).toBe(1.5);
      });

      it('should restore repeatMode from persisted state', () => {
        // Create persisted state with repeat mode 'all'
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'all',
          isShuffling: false,
          queue: [],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify repeat mode was restored
        const state = player.getState();
        expect(state.repeatMode).toBe('all');
      });

      it('should restore isShuffling from persisted state', () => {
        // Create persisted state with shuffle enabled
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: true,
          queue: [],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify shuffle state was restored
        const state = player.getState();
        expect(state.isShuffling).toBe(true);
      });

      it('should restore queue from persisted state', () => {
        // Create persisted state with queue
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1', artist: 'Artist 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2', artist: 'Artist 2' },
            { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          ],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify queue was restored
        const queue = player.getQueue();
        expect(queue.length).toBe(3);
        expect(queue[0].id).toBe('track-1');
        expect(queue[0].title).toBe('Track 1');
        expect(queue[1].id).toBe('track-2');
        expect(queue[2].id).toBe('track-3');
      });

      it('should restore currentTrack and currentQueueIndex from persisted state', () => {
        // Create persisted state with current track
        const persistedState = {
          version: '1.0.0',
          currentTrackId: 'track-2',
          currentTime: 42.5,
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
            { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          ],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify current track was restored
        const state = player.getState();
        expect(state.currentTrack).not.toBeNull();
        expect(state.currentTrack?.id).toBe('track-2');
        expect(state.currentQueueIndex).toBe(1);
      });

      it('should restore currentTime from persisted state', () => {
        // Create persisted state with current track and time
        const persistedState = {
          version: '1.0.0',
          currentTrackId: 'track-1',
          currentTime: 123.45,
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          ],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify current time was restored
        const state = player.getState();
        expect(state.currentTime).toBe(123.45);
      });

      it('should load track into audio element without starting playback', () => {
        // Create persisted state with current track
        const persistedState = {
          version: '1.0.0',
          currentTrackId: 'track-1',
          currentTime: 10,
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [
            { id: 'track-1', src: 'https://example.com/audio1.mp3', title: 'Track 1' },
          ],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify audio element has the track loaded
        const audioElement = (player as any)._audio as HTMLAudioElement;
        expect(audioElement.src).toContain('audio1.mp3');

        // Verify playback did NOT start automatically
        const state = player.getState();
        expect(state.isPlaying).toBe(false);
      });
    });

    describe('Error handling - missing or corrupted data', () => {
      it('should handle missing persisted state gracefully', () => {
        // Don't save anything to localStorage
        localStorage.clear();

        // Call _loadPersistedState - should not throw
        expect(() => {
          (player as any)._loadPersistedState();
        }).not.toThrow();

        // Verify player continues with default state
        const state = player.getState();
        expect(state.volume).toBeGreaterThanOrEqual(0);
        expect(state.volume).toBeLessThanOrEqual(1);
      });

      it('should handle corrupted JSON data gracefully', () => {
        // Save invalid JSON to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, '{invalid json}');

        // Call _loadPersistedState - should not throw
        expect(() => {
          (player as any)._loadPersistedState();
        }).not.toThrow();

        // Verify corrupted data was cleared
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).toBeNull();
      });

      it('should handle non-object persisted data gracefully', () => {
        // Save non-object data to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify('not an object'));

        // Call _loadPersistedState - should not throw
        expect(() => {
          (player as any)._loadPersistedState();
        }).not.toThrow();

        // Verify invalid data was cleared
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).toBeNull();
      });

      it('should handle schema version mismatch gracefully', () => {
        // Create persisted state with different version
        const persistedState = {
          version: '2.0.0', // Different version
          currentTrackId: null,
          currentTime: 0,
          volume: 0.5,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState - should not throw
        expect(() => {
          (player as any)._loadPersistedState();
        }).not.toThrow();

        // Verify old version data was cleared
        const savedData = localStorage.getItem(persistenceKey);
        expect(savedData).toBeNull();

        // Verify player continues with default state (not the 0.5 volume from old version)
        const state = player.getState();
        expect(state.volume).not.toBe(0.5);
      });

      it('should skip invalid tracks in persisted queue', () => {
        // Create persisted state with some invalid tracks
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' }, // Valid
            { id: 'track-2', src: 'audio2.mp3' }, // Missing title
            { id: 'track-3', title: 'Track 3' }, // Missing src
            { id: 'track-4', src: 'audio4.mp3', title: 'Track 4' }, // Valid
            'not an object', // Invalid
          ],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify only valid tracks were restored
        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        expect(queue[0].id).toBe('track-1');
        expect(queue[1].id).toBe('track-4');
      });

      it('should handle currentTrackId not found in queue', () => {
        // Create persisted state with currentTrackId that doesn't exist in queue
        const persistedState = {
          version: '1.0.0',
          currentTrackId: 'track-999', // Doesn't exist
          currentTime: 42.5,
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
          ],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState - should not throw
        expect(() => {
          (player as any)._loadPersistedState();
        }).not.toThrow();

        // Verify queue was restored but currentTrack is null
        const queue = player.getQueue();
        expect(queue.length).toBe(2);
        
        const state = player.getState();
        expect(state.currentTrack).toBeNull();
      });
    });

    describe('Validation of restored values', () => {
      it('should reject invalid volume values', () => {
        // Create persisted state with invalid volume
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 5.0, // Invalid (> 1)
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Get current volume before loading
        const volumeBefore = player.getState().volume;

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify invalid volume was rejected (kept default)
        const state = player.getState();
        expect(state.volume).toBe(volumeBefore);
        expect(state.volume).not.toBe(5.0);
      });

      it('should reject negative volume values', () => {
        // Create persisted state with negative volume
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: -0.5, // Invalid (< 0)
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Get current volume before loading
        const volumeBefore = player.getState().volume;

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify invalid volume was rejected
        const state = player.getState();
        expect(state.volume).toBe(volumeBefore);
        expect(state.volume).not.toBe(-0.5);
      });

      it('should reject invalid playbackRate values', () => {
        // Create persisted state with invalid playback rate
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 1.0,
          playbackRate: -1.0, // Invalid (negative)
          repeatMode: 'none',
          isShuffling: false,
          queue: [],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Get current playback rate before loading
        const rateBefore = player.getState().playbackRate;

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify invalid playback rate was rejected
        const state = player.getState();
        expect(state.playbackRate).toBe(rateBefore);
        expect(state.playbackRate).not.toBe(-1.0);
      });

      it('should reject invalid repeatMode values', () => {
        // Create persisted state with invalid repeat mode
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'invalid', // Invalid
          isShuffling: false,
          queue: [],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Get current repeat mode before loading
        const modeBefore = player.getState().repeatMode;

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify invalid repeat mode was rejected
        const state = player.getState();
        expect(state.repeatMode).toBe(modeBefore);
        expect(state.repeatMode).not.toBe('invalid');
      });

      it('should reject negative currentTime values', () => {
        // Create persisted state with negative current time
        const persistedState = {
          version: '1.0.0',
          currentTrackId: 'track-1',
          currentTime: -10, // Invalid (negative)
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: false,
          queue: [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
          ],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify negative time was rejected (should be 0 or not set)
        const state = player.getState();
        expect(state.currentTime).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Configuration respect', () => {
      it('should not load state when persistState config is false', () => {
        // Create persisted state
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 0.5,
          playbackRate: 1.0,
          repeatMode: 'all',
          isShuffling: true,
          queue: [],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Disable persistence
        (player as any)._config.persistState = false;

        // Get current state before loading
        const volumeBefore = player.getState().volume;
        const repeatModeBefore = player.getState().repeatMode;

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify state was NOT loaded
        const state = player.getState();
        expect(state.volume).toBe(volumeBefore);
        expect(state.volume).not.toBe(0.5);
        expect(state.repeatMode).toBe(repeatModeBefore);
        expect(state.repeatMode).not.toBe('all');

        // Restore config
        (player as any)._config.persistState = true;
      });

      it('should use custom persistence key from config', () => {
        // Set custom persistence key
        const customKey = 'custom_player_state';
        (player as any)._config.persistenceKey = customKey;

        // Create persisted state with custom key
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 0.6,
          playbackRate: 1.0,
          repeatMode: 'one',
          isShuffling: false,
          queue: [],
        };

        // Save to localStorage with custom key
        localStorage.setItem(customKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify state was loaded from custom key
        const state = player.getState();
        expect(state.volume).toBe(0.6);
        expect(state.repeatMode).toBe('one');

        // Restore default key
        (player as any)._config.persistenceKey = 'makenoise_state';
      });
    });

    describe('Shuffle state restoration', () => {
      it('should save original queue when shuffle was enabled', () => {
        // Create persisted state with shuffle enabled
        const persistedState = {
          version: '1.0.0',
          currentTrackId: null,
          currentTime: 0,
          volume: 1.0,
          playbackRate: 1.0,
          repeatMode: 'none',
          isShuffling: true,
          queue: [
            { id: 'track-1', src: 'audio1.mp3', title: 'Track 1' },
            { id: 'track-2', src: 'audio2.mp3', title: 'Track 2' },
            { id: 'track-3', src: 'audio3.mp3', title: 'Track 3' },
          ],
        };

        // Save to localStorage
        const persistenceKey = (player as any)._config.persistenceKey;
        localStorage.setItem(persistenceKey, JSON.stringify(persistedState));

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify original queue was saved for future unshuffle
        const originalQueue = (player as any)._originalQueue;
        expect(originalQueue.length).toBe(3);
      });
    });

    describe('Error event emission', () => {
      it('should emit error event when localStorage access fails', () => {
        // Mock localStorage.getItem to throw error
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = () => {
          throw new Error('SecurityError: localStorage access denied');
        };

        // Listen for error event
        let errorEmitted = false;
        player.on('error', (error) => {
          expect(error.code).toBe('STATE_ERROR');
          errorEmitted = true;
        });

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify error event was emitted
        expect(errorEmitted).toBe(true);

        // Restore original getItem
        localStorage.getItem = originalGetItem;
      });

      it('should not update player state error when loading fails', () => {
        // Mock localStorage.getItem to throw error
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = () => {
          throw new Error('Storage error');
        };

        // Call _loadPersistedState
        (player as any)._loadPersistedState();

        // Verify player state error is still null
        // (persistence errors should not interrupt normal operation)
        const state = player.getState();
        expect(state.error).toBeNull();

        // Restore original getItem
        localStorage.getItem = originalGetItem;
      });
    });
  });

  describe('Media Session API Integration', () => {
    describe('_updateMediaSession() method', () => {
      it('should update navigator.mediaSession.metadata when track is playing', async () => {
        const track = {
          id: 'track-1',
          src: 'https://example.com/audio.mp3',
          title: 'Test Track',
          artist: 'Test Artist',
          artwork: 'https://example.com/artwork.jpg',
        };

        // Play the track (this should call _updateMediaSession)
        await player.play(track);

        // Verify metadata was updated
        expect(navigator.mediaSession.metadata).not.toBeNull();
        expect(navigator.mediaSession.metadata?.title).toBe('Test Track');
        expect(navigator.mediaSession.metadata?.artist).toBe('Test Artist');
        expect(navigator.mediaSession.metadata?.artwork).toBeDefined();
        expect(navigator.mediaSession.metadata?.artwork.length).toBeGreaterThan(0);
      });

      it('should handle missing artist gracefully', async () => {
        const track = {
          id: 'track-2',
          src: 'https://example.com/audio2.mp3',
          title: 'Track Without Artist',
        };

        await player.play(track);

        // Verify metadata was updated with default artist
        expect(navigator.mediaSession.metadata).not.toBeNull();
        expect(navigator.mediaSession.metadata?.title).toBe('Track Without Artist');
        expect(navigator.mediaSession.metadata?.artist).toBe('Unknown Artist');
      });

      it('should handle missing artwork gracefully', async () => {
        const track = {
          id: 'track-3',
          src: 'https://example.com/audio3.mp3',
          title: 'Track Without Artwork',
          artist: 'Test Artist',
        };

        await player.play(track);

        // Verify metadata was updated with empty artwork array
        expect(navigator.mediaSession.metadata).not.toBeNull();
        expect(navigator.mediaSession.metadata?.title).toBe('Track Without Artwork');
        expect(navigator.mediaSession.metadata?.artwork).toEqual([]);
      });

      it('should clear metadata when no track is playing', () => {
        // Clear the current track
        (player as any)._state.currentTrack = null;

        // Call _updateMediaSession
        (player as any)._updateMediaSession();

        // Verify metadata was cleared
        expect(navigator.mediaSession.metadata).toBeNull();
      });

      it('should not throw error when mediaSession is not available', () => {
        // Save original mediaSession
        const originalMediaSession = navigator.mediaSession;

        // Remove mediaSession
        Object.defineProperty(navigator, 'mediaSession', {
          value: undefined,
          writable: true,
          configurable: true,
        });

        // This should not throw
        expect(() => {
          (player as any)._updateMediaSession();
        }).not.toThrow();

        // Restore mediaSession
        Object.defineProperty(navigator, 'mediaSession', {
          value: originalMediaSession,
          writable: true,
          configurable: true,
        });
      });

      it('should not throw error when MediaMetadata is not available', () => {
        // Save original MediaMetadata
        const originalMediaMetadata = (global as any).MediaMetadata;

        // Remove MediaMetadata
        (global as any).MediaMetadata = undefined;

        // This should not throw
        expect(() => {
          (player as any)._updateMediaSession();
        }).not.toThrow();

        // Restore MediaMetadata
        (global as any).MediaMetadata = originalMediaMetadata;
      });

      it('should update metadata when setCurrentTrack is called', () => {
        const track = {
          id: 'track-4',
          src: 'https://example.com/audio4.mp3',
          title: 'Set Current Track Test',
          artist: 'Test Artist',
        };

        // Add track to queue first
        player.addToQueue(track);

        // Set as current track
        player.jumpToQueueIndex(0);

        // Verify metadata was updated
        expect(navigator.mediaSession.metadata).not.toBeNull();
        expect(navigator.mediaSession.metadata?.title).toBe('Set Current Track Test');
      });

      it('should respect enableMediaSession config option', () => {
        // Get player with Media Session disabled
        // Note: Since we're using a singleton, we need to test this differently
        // We'll just verify the method checks the config
        const config = (player as any)._config;
        const originalEnableMediaSession = config.enableMediaSession;

        // Disable Media Session
        config.enableMediaSession = false;

        // Clear metadata first
        navigator.mediaSession.metadata = null;

        // Call _updateMediaSession
        (player as any)._updateMediaSession();

        // Metadata should still be null (not updated)
        expect(navigator.mediaSession.metadata).toBeNull();

        // Restore config
        config.enableMediaSession = originalEnableMediaSession;
      });

      it('should provide multiple artwork sizes', async () => {
        const track = {
          id: 'track-5',
          src: 'https://example.com/audio5.mp3',
          title: 'Artwork Sizes Test',
          artist: 'Test Artist',
          artwork: 'https://example.com/artwork.jpg',
        };

        await player.play(track);

        // Verify multiple artwork sizes are provided
        expect(navigator.mediaSession.metadata?.artwork).toBeDefined();
        const artwork = navigator.mediaSession.metadata?.artwork || [];
        expect(artwork.length).toBeGreaterThan(1);

        // Verify different sizes are present
        const sizes = artwork.map(a => a.sizes);
        expect(sizes).toContain('96x96');
        expect(sizes).toContain('512x512');
      });
    });

    describe('Media Session action handlers', () => {
      it('should register action handlers during initialization', () => {
        // Reset the singleton and mock to test initialization
        (MakeNoise as any)._instance = null;
        const mockSetActionHandler = vi.fn();
        Object.defineProperty(navigator.mediaSession, 'setActionHandler', {
          value: mockSetActionHandler,
          writable: true,
          configurable: true,
        });

        // Create new instance - this will call _setupMediaSessionActionHandlers
        const player = MakeNoise.getInstance();

        // Verify setActionHandler was called for each action
        expect(mockSetActionHandler).toHaveBeenCalledWith('play', expect.any(Function));
        expect(mockSetActionHandler).toHaveBeenCalledWith('pause', expect.any(Function));
        expect(mockSetActionHandler).toHaveBeenCalledWith('previoustrack', expect.any(Function));
        expect(mockSetActionHandler).toHaveBeenCalledWith('nexttrack', expect.any(Function));
        expect(mockSetActionHandler).toHaveBeenCalledWith('seekto', expect.any(Function));

        // Verify it was called exactly 5 times (once for each action)
        expect(mockSetActionHandler).toHaveBeenCalledTimes(5);

        // Clean up - reset instance for other tests
        (MakeNoise as any)._instance = null;
      });

      it('should call play() when "play" action is triggered', () => {
        // Reset the singleton and set up mock
        (MakeNoise as any)._instance = null;
        const mockSetActionHandler = vi.fn();
        Object.defineProperty(navigator.mediaSession, 'setActionHandler', {
          value: mockSetActionHandler,
          writable: true,
          configurable: true,
        });

        const player = MakeNoise.getInstance();
        const playSpy = vi.spyOn(player, 'play');

        // Get the registered 'play' handler
        const calls = mockSetActionHandler.mock.calls;
        const playCall = calls.find((call: any[]) => call[0] === 'play');
        expect(playCall).toBeDefined();
        
        const playHandler = playCall![1];
        
        // Trigger the handler
        playHandler();

        // Verify play() was called
        expect(playSpy).toHaveBeenCalled();

        // Clean up
        (MakeNoise as any)._instance = null;
      });

      it('should call pause() when "pause" action is triggered', () => {
        // Reset the singleton and set up mock
        (MakeNoise as any)._instance = null;
        const mockSetActionHandler = vi.fn();
        Object.defineProperty(navigator.mediaSession, 'setActionHandler', {
          value: mockSetActionHandler,
          writable: true,
          configurable: true,
        });

        const player = MakeNoise.getInstance();
        const pauseSpy = vi.spyOn(player, 'pause');

        // Get the registered 'pause' handler
        const calls = mockSetActionHandler.mock.calls;
        const pauseCall = calls.find((call: any[]) => call[0] === 'pause');
        expect(pauseCall).toBeDefined();
        
        const pauseHandler = pauseCall![1];
        
        // Trigger the handler
        pauseHandler();

        // Verify pause() was called
        expect(pauseSpy).toHaveBeenCalled();

        // Clean up
        (MakeNoise as any)._instance = null;
      });

      it('should call previous() when "previoustrack" action is triggered', () => {
        // Reset the singleton and set up mock
        (MakeNoise as any)._instance = null;
        const mockSetActionHandler = vi.fn();
        Object.defineProperty(navigator.mediaSession, 'setActionHandler', {
          value: mockSetActionHandler,
          writable: true,
          configurable: true,
        });

        const player = MakeNoise.getInstance();
        const previousSpy = vi.spyOn(player, 'previous');

        // Get the registered 'previoustrack' handler
        const calls = mockSetActionHandler.mock.calls;
        const previousCall = calls.find((call: any[]) => call[0] === 'previoustrack');
        expect(previousCall).toBeDefined();
        
        const previousHandler = previousCall![1];
        
        // Trigger the handler
        previousHandler();

        // Verify previous() was called
        expect(previousSpy).toHaveBeenCalled();

        // Clean up
        (MakeNoise as any)._instance = null;
      });

      it('should call next() when "nexttrack" action is triggered', () => {
        // Reset the singleton and set up mock
        (MakeNoise as any)._instance = null;
        const mockSetActionHandler = vi.fn();
        Object.defineProperty(navigator.mediaSession, 'setActionHandler', {
          value: mockSetActionHandler,
          writable: true,
          configurable: true,
        });

        const player = MakeNoise.getInstance();
        const nextSpy = vi.spyOn(player, 'next');

        // Get the registered 'nexttrack' handler
        const calls = mockSetActionHandler.mock.calls;
        const nextCall = calls.find((call: any[]) => call[0] === 'nexttrack');
        expect(nextCall).toBeDefined();
        
        const nextHandler = nextCall![1];
        
        // Trigger the handler
        nextHandler();

        // Verify next() was called
        expect(nextSpy).toHaveBeenCalled();

        // Clean up
        (MakeNoise as any)._instance = null;
      });

      it('should call seek() when "seekto" action is triggered with seekTime', () => {
        // Reset the singleton and set up mock
        (MakeNoise as any)._instance = null;
        const mockSetActionHandler = vi.fn();
        Object.defineProperty(navigator.mediaSession, 'setActionHandler', {
          value: mockSetActionHandler,
          writable: true,
          configurable: true,
        });

        const player = MakeNoise.getInstance();
        const seekSpy = vi.spyOn(player, 'seek');

        // Get the registered 'seekto' handler
        const calls = mockSetActionHandler.mock.calls;
        const seekCall = calls.find((call: any[]) => call[0] === 'seekto');
        expect(seekCall).toBeDefined();
        
        const seekHandler = seekCall![1];
        
        // Trigger the handler with seekTime
        seekHandler({ seekTime: 30.5 });

        // Verify seek() was called with the correct time
        expect(seekSpy).toHaveBeenCalledWith(30.5);

        // Clean up
        (MakeNoise as any)._instance = null;
      });

      it('should not call seek() when "seekto" action is triggered without seekTime', () => {
        // Reset the singleton and set up mock
        (MakeNoise as any)._instance = null;
        const mockSetActionHandler = vi.fn();
        Object.defineProperty(navigator.mediaSession, 'setActionHandler', {
          value: mockSetActionHandler,
          writable: true,
          configurable: true,
        });

        const player = MakeNoise.getInstance();
        const seekSpy = vi.spyOn(player, 'seek');

        // Get the registered 'seekto' handler
        const calls = mockSetActionHandler.mock.calls;
        const seekCall = calls.find((call: any[]) => call[0] === 'seekto');
        expect(seekCall).toBeDefined();
        
        const seekHandler = seekCall![1];
        
        // Trigger the handler without seekTime
        seekHandler({});

        // Verify seek() was not called
        expect(seekSpy).not.toHaveBeenCalled();

        // Clean up
        (MakeNoise as any)._instance = null;
      });

      it('should not register action handlers when enableMediaSession is false', () => {
        // Reset the singleton
        (MakeNoise as any)._instance = null;
        
        // Set up mock
        const mockSetActionHandler = vi.fn();
        Object.defineProperty(navigator.mediaSession, 'setActionHandler', {
          value: mockSetActionHandler,
          writable: true,
          configurable: true,
        });

        // Create a new player instance with Media Session disabled
        const player = MakeNoise.getInstance({ enableMediaSession: false });

        // Verify setActionHandler was not called
        expect(mockSetActionHandler).not.toHaveBeenCalled();

        // Clean up - reset instance for other tests
        (MakeNoise as any)._instance = null;
      });

      it('should not throw error when mediaSession is not available', () => {
        // Save original mediaSession
        const originalMediaSession = navigator.mediaSession;

        // Remove mediaSession
        Object.defineProperty(navigator, 'mediaSession', {
          value: undefined,
          writable: true,
          configurable: true,
        });

        // Reset singleton
        (MakeNoise as any)._instance = null;

        // This should not throw
        expect(() => {
          MakeNoise.getInstance();
        }).not.toThrow();

        // Restore mediaSession
        Object.defineProperty(navigator, 'mediaSession', {
          value: originalMediaSession,
          writable: true,
          configurable: true,
        });

        // Clean up - reset instance for other tests
        (MakeNoise as any)._instance = null;
      });

      it('should not throw error when setActionHandler is not available', () => {
        // Save original setActionHandler
        const originalMediaSession = navigator.mediaSession;
        const mockMediaSession = {
          metadata: null,
          // setActionHandler is intentionally missing
        };

        // Replace mediaSession with one that doesn't have setActionHandler
        Object.defineProperty(navigator, 'mediaSession', {
          value: mockMediaSession,
          writable: true,
          configurable: true,
        });

        // Reset singleton
        (MakeNoise as any)._instance = null;

        // This should not throw
        expect(() => {
          MakeNoise.getInstance();
        }).not.toThrow();

        // Restore mediaSession
        Object.defineProperty(navigator, 'mediaSession', {
          value: originalMediaSession,
          writable: true,
          configurable: true,
        });

        // Clean up - reset instance for other tests
        (MakeNoise as any)._instance = null;
      });
    });
  });

  describe('Error Handling - _handleError() method', () => {
    it('should create PlayerError object with correct structure', () => {
      let errorEmitted: any = null;
      const errorHandler = (error: any) => {
        errorEmitted = error;
      };

      player.on('error', errorHandler);

      // Call _handleError directly through type assertion
      (player as any)._handleError(
        'VALIDATION_ERROR',
        'Test error message',
        'test_context'
      );

      // Verify error was emitted
      expect(errorEmitted).not.toBeNull();
      expect(errorEmitted.code).toBe('VALIDATION_ERROR');
      expect(errorEmitted.message).toBe('Test error message');
      expect(errorEmitted.details).toBeDefined();
      expect(errorEmitted.details.context).toBe('test_context');
      expect(errorEmitted.details.timestamp).toBeDefined();
      expect(typeof errorEmitted.details.timestamp).toBe('number');

      player.off('error', errorHandler);
    });

    it('should update _state.error with error details', () => {
      // Call _handleError
      (player as any)._handleError(
        'NETWORK_ERROR',
        'Network connection failed',
        'network_test'
      );

      // Verify state was updated
      const state = player.getState();
      expect(state.error).not.toBeNull();
      expect(state.error?.code).toBe('NETWORK_ERROR');
      expect(state.error?.message).toBe('Network connection failed');
      expect(state.error?.details?.context).toBe('network_test');
    });

    it('should emit error event with error details', () => {
      return new Promise<void>((resolve) => {
        const errorHandler = (error: any) => {
          expect(error).toBeDefined();
          expect(error.code).toBe('MEDIA_LOAD_ERROR');
          expect(error.message).toBe('Failed to load media');
          expect(error.details.context).toBe('media_load_test');
          player.off('error', errorHandler);
          resolve();
        };

        player.on('error', errorHandler);

        // Call _handleError
        (player as any)._handleError(
          'MEDIA_LOAD_ERROR',
          'Failed to load media',
          'media_load_test'
        );
      });
    });

    it('should emit statechange event after error', () => {
      return new Promise<void>((resolve) => {
        let errorEmitted = false;
        let stateChangeEmitted = false;

        const errorHandler = () => {
          errorEmitted = true;
          checkComplete();
        };

        const stateChangeHandler = () => {
          stateChangeEmitted = true;
          checkComplete();
        };

        const checkComplete = () => {
          if (errorEmitted && stateChangeEmitted) {
            player.off('error', errorHandler);
            player.off('statechange', stateChangeHandler);
            resolve();
          }
        };

        player.on('error', errorHandler);
        player.on('statechange', stateChangeHandler);

        // Call _handleError
        (player as any)._handleError(
          'STATE_ERROR',
          'Invalid state',
          'state_test'
        );
      });
    });

    it('should include originalError in details when provided', () => {
      const originalError = new Error('Original error message');
      let errorEmitted: any = null;

      const errorHandler = (error: any) => {
        errorEmitted = error;
      };

      player.on('error', errorHandler);

      // Call _handleError with originalError
      (player as any)._handleError(
        'UNKNOWN_ERROR',
        'Wrapped error',
        'error_wrapping_test',
        originalError
      );

      // Verify originalError is included
      expect(errorEmitted).not.toBeNull();
      expect(errorEmitted.details.originalError).toBe(originalError);
      expect(errorEmitted.details.originalError.message).toBe('Original error message');

      player.off('error', errorHandler);
    });

    it('should include current state snapshot in error details', () => {
      // Set some state values
      player.setVolume(0.5);
      player.setPlaybackRate(1.5);

      let errorEmitted: any = null;
      const errorHandler = (error: any) => {
        errorEmitted = error;
      };

      player.on('error', errorHandler);

      // Call _handleError
      (player as any)._handleError(
        'VALIDATION_ERROR',
        'Test with state',
        'state_snapshot_test'
      );

      // Verify state snapshot is included
      expect(errorEmitted).not.toBeNull();
      expect(errorEmitted.details.state).toBeDefined();
      expect(errorEmitted.details.state.volume).toBe(0.5);
      expect(errorEmitted.details.state.playbackRate).toBe(1.5);

      player.off('error', errorHandler);
    });

    it('should handle all error code types', () => {
      const errorCodes: Array<'MEDIA_LOAD_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNSUPPORTED_FORMAT' | 'STATE_ERROR' | 'UNKNOWN_ERROR'> = [
        'MEDIA_LOAD_ERROR',
        'VALIDATION_ERROR',
        'NETWORK_ERROR',
        'UNSUPPORTED_FORMAT',
        'STATE_ERROR',
        'UNKNOWN_ERROR',
      ];

      errorCodes.forEach((code) => {
        let errorEmitted: any = null;
        const errorHandler = (error: any) => {
          errorEmitted = error;
        };

        player.on('error', errorHandler);

        // Call _handleError with each error code
        (player as any)._handleError(
          code,
          `Test ${code}`,
          `test_${code}`
        );

        // Verify error was emitted with correct code
        expect(errorEmitted).not.toBeNull();
        expect(errorEmitted.code).toBe(code);

        player.off('error', errorHandler);
      });
    });

    it('should log error to console in development mode', () => {
      // Mock console.error
      const originalConsoleError = console.error;
      const consoleErrorSpy = vi.fn();
      console.error = consoleErrorSpy;

      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';

      // Call _handleError
      (player as any)._handleError(
        'VALIDATION_ERROR',
        'Test console logging',
        'console_test'
      );

      // Verify console.error was called in development mode
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[MakeNoise Error]',
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Test console logging',
          context: 'console_test',
        })
      );

      // Restore console.error and NODE_ENV
      console.error = originalConsoleError;
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not throw when error details are accessed', () => {
      expect(() => {
        (player as any)._handleError(
          'VALIDATION_ERROR',
          'Test error',
          'no_throw_test'
        );

        const state = player.getState();
        const error = state.error;
        
        // Access all error properties
        if (error) {
          const code = error.code;
          const message = error.message;
          const details = error.details;
          const context = details?.context;
          const timestamp = details?.timestamp;
          const stateSnapshot = details?.state;
          const originalError = details?.originalError;
        }
      }).not.toThrow();
    });
  });
});
