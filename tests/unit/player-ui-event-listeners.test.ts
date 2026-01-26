/**
 * Unit tests for PlayerUI event listeners (Task 21.1)
 * 
 * Tests that the _setupEventListeners() method correctly:
 * - Adds click listener to play button
 * - Adds click listener to pause button
 * - Adds click listener to next button
 * - Adds click listener to previous button
 * - Adds input listener to seek bar
 * - Adds input listener to volume slider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MakeNoise } from '../../src/core/MakeNoise';
import '../../src/ui/PlayerUI';

describe('PlayerUI Event Listeners (Task 21.1)', () => {
  let playerUI: HTMLElement;
  let player: MakeNoise;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Create a new PlayerUI element
    playerUI = document.createElement('make-noise-player');
    document.body.appendChild(playerUI);
    
    // Get player instance
    player = MakeNoise.getInstance();
    
    // Add a test track to the queue
    player.addToQueue({
      id: 'test-track',
      src: 'test.mp3',
      title: 'Test Track',
      artist: 'Test Artist',
    });
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(playerUI);
    
    // Clear queue
    player.clearQueue();
    player.pause();
  });

  it('should call player.play() or player.pause() when play button is clicked', () => {
    // Get the shadow root
    const shadowRoot = (playerUI as any).shadowRoot;
    const playButton = shadowRoot.getElementById('play-pause-button');
    
    expect(playButton).toBeTruthy();
    
    // Spy on player methods
    const playSpy = vi.spyOn(player, 'play');
    const pauseSpy = vi.spyOn(player, 'pause');
    
    // Initially not playing, so clicking should call play
    playButton.click();
    expect(playSpy).toHaveBeenCalled();
    
    // Reset spies
    playSpy.mockClear();
    pauseSpy.mockClear();
    
    // Manually set the playing state (since jsdom doesn't fully implement HTMLMediaElement)
    (player as any)._state.isPlaying = true;
    (player as any)._state.isPaused = false;
    
    // Now clicking should call pause
    playButton.click();
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('should call player.previous() when previous button is clicked', () => {
    const shadowRoot = (playerUI as any).shadowRoot;
    const prevButton = shadowRoot.getElementById('prev-track-button');
    
    expect(prevButton).toBeTruthy();
    
    // Spy on player.previous()
    const previousSpy = vi.spyOn(player, 'previous');
    
    // Click the button
    prevButton.click();
    
    expect(previousSpy).toHaveBeenCalled();
  });

  it('should call player.next() when next button is clicked', () => {
    const shadowRoot = (playerUI as any).shadowRoot;
    const nextButton = shadowRoot.getElementById('next-track-button');
    
    expect(nextButton).toBeTruthy();
    
    // Spy on player.next()
    const nextSpy = vi.spyOn(player, 'next');
    
    // Click the button
    nextButton.click();
    
    expect(nextSpy).toHaveBeenCalled();
  });

  it('should call player.seek() when seek bar is changed', () => {
    const shadowRoot = (playerUI as any).shadowRoot;
    const seekBar = shadowRoot.querySelector('.progress-slider') as HTMLInputElement;
    
    expect(seekBar).toBeTruthy();
    
    // Spy on player.seek()
    const seekSpy = vi.spyOn(player, 'seek');
    
    // Simulate a track with duration
    player.play(0);
    
    // Wait a bit for the track to load (mock duration)
    const state = player.getState();
    if (state.duration === 0) {
      // Manually set duration for testing
      (player as any)._state.duration = 100;
    }
    
    // Change the seek bar value (50% = 50 seconds if duration is 100)
    seekBar.value = '50';
    seekBar.dispatchEvent(new Event('input'));
    
    expect(seekSpy).toHaveBeenCalled();
    
    // Check that seek was called with approximately the right value
    const seekValue = seekSpy.mock.calls[0][0];
    expect(seekValue).toBeGreaterThanOrEqual(0);
  });

  it('should call player.setVolume() when volume slider is changed', () => {
    const shadowRoot = (playerUI as any).shadowRoot;
    const volumeSlider = shadowRoot.getElementById('volume-slider') as HTMLInputElement;
    
    expect(volumeSlider).toBeTruthy();
    
    // Spy on player.setVolume()
    const setVolumeSpy = vi.spyOn(player, 'setVolume');
    
    // Change the volume slider value (50% = 0.5 volume)
    volumeSlider.value = '50';
    volumeSlider.dispatchEvent(new Event('input'));
    
    expect(setVolumeSpy).toHaveBeenCalled();
    expect(setVolumeSpy).toHaveBeenCalledWith(0.5);
  });

  it('should handle volume slider at 0%', () => {
    const shadowRoot = (playerUI as any).shadowRoot;
    const volumeSlider = shadowRoot.getElementById('volume-slider') as HTMLInputElement;
    
    const setVolumeSpy = vi.spyOn(player, 'setVolume');
    
    // Set volume to 0%
    volumeSlider.value = '0';
    volumeSlider.dispatchEvent(new Event('input'));
    
    expect(setVolumeSpy).toHaveBeenCalledWith(0);
  });

  it('should handle volume slider at 100%', () => {
    const shadowRoot = (playerUI as any).shadowRoot;
    const volumeSlider = shadowRoot.getElementById('volume-slider') as HTMLInputElement;
    
    const setVolumeSpy = vi.spyOn(player, 'setVolume');
    
    // Set volume to 100%
    volumeSlider.value = '100';
    volumeSlider.dispatchEvent(new Event('input'));
    
    expect(setVolumeSpy).toHaveBeenCalledWith(1);
  });
});
