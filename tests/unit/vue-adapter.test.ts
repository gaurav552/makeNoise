/**
 * Unit tests for Vue adapter
 * 
 * Tests the useMakeNoise composable and MediaPlayerPlugin.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { useMakeNoise } from '../../src/adapters/vue/useMakeNoise';
import { MediaPlayerPlugin } from '../../src/adapters/vue/MediaPlayerPlugin';
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

describe('useMakeNoise composable', () => {
  it('should return initial player state', async () => {
    const TestComponent = defineComponent({
      setup() {
        const { state, queue } = useMakeNoise();
        return { state, queue };
      },
      render() {
        return h('div');
      }
    });

    const wrapper = mount(TestComponent);
    await nextTick();

    expect(wrapper.vm.state).toBeDefined();
    expect(wrapper.vm.state.isPlaying).toBe(false);
    expect(wrapper.vm.state.isPaused).toBe(true);
    expect(wrapper.vm.state.volume).toBe(1);
    expect(wrapper.vm.queue).toEqual([]);
  });

  it('should return control methods', async () => {
    const TestComponent = defineComponent({
      setup() {
        const controls = useMakeNoise();
        return { controls };
      },
      render() {
        return h('div');
      }
    });

    const wrapper = mount(TestComponent);
    await nextTick();

    const { controls } = wrapper.vm;
    expect(typeof controls.play).toBe('function');
    expect(typeof controls.pause).toBe('function');
    expect(typeof controls.togglePlayPause).toBe('function');
    expect(typeof controls.seek).toBe('function');
    expect(typeof controls.setVolume).toBe('function');
    expect(typeof controls.setPlaybackRate).toBe('function');
    expect(typeof controls.next).toBe('function');
    expect(typeof controls.previous).toBe('function');
    expect(typeof controls.addToQueue).toBe('function');
    expect(typeof controls.playNext).toBe('function');
    expect(typeof controls.removeFromQueue).toBe('function');
    expect(typeof controls.clearQueue).toBe('function');
    expect(typeof controls.reorderQueue).toBe('function');
    expect(typeof controls.loadTracksToQueue).toBe('function');
    expect(typeof controls.jumpToQueueIndex).toBe('function');
    expect(typeof controls.setRepeatMode).toBe('function');
    expect(typeof controls.toggleShuffle).toBe('function');
  });

  it('should update state reactively when volume changes', async () => {
    const TestComponent = defineComponent({
      setup() {
        const { state, setVolume } = useMakeNoise();
        return { state, setVolume };
      },
      render() {
        return h('div');
      }
    });

    const wrapper = mount(TestComponent);
    await nextTick();

    wrapper.vm.setVolume(0.5);
    await nextTick();

    expect(wrapper.vm.state.volume).toBe(0.5);
  });

  it('should update queue reactively when tracks are added', async () => {
    const TestComponent = defineComponent({
      setup() {
        const { queue, addToQueue } = useMakeNoise();
        return { queue, addToQueue };
      },
      render() {
        return h('div');
      }
    });

    const wrapper = mount(TestComponent);
    await nextTick();

    const track: Track = {
      id: '1',
      src: 'https://example.com/track1.mp3',
      title: 'Test Track',
      artist: 'Test Artist',
    };

    wrapper.vm.addToQueue(track);
    await nextTick();

    expect(wrapper.vm.queue).toHaveLength(1);
    expect(wrapper.vm.queue[0]).toMatchObject({
      id: '1',
      title: 'Test Track',
    });
  });

  it('should clean up event listeners on unmount', async () => {
    const TestComponent = defineComponent({
      setup() {
        useMakeNoise();
        return {};
      },
      render() {
        return h('div');
      }
    });

    const wrapper = mount(TestComponent);
    await nextTick();

    const player = MakeNoise.getInstance();
    const eventEmitter = (player as any)._eventEmitter;
    
    // Get initial listener count
    const initialStateChangeListeners = eventEmitter._events.get('statechange')?.size || 0;
    const initialqueueChangeListeners = eventEmitter._events.get('queuechange')?.size || 0;

    wrapper.unmount();
    await nextTick();

    // After unmount, listeners should be removed
    const finalStateChangeListeners = eventEmitter._events.get('statechange')?.size || 0;
    const finalqueueChangeListeners = eventEmitter._events.get('queuechange')?.size || 0;

    expect(finalStateChangeListeners).toBeLessThan(initialStateChangeListeners);
    expect(finalqueueChangeListeners).toBeLessThan(initialqueueChangeListeners);
  });
});

describe('MediaPlayerPlugin', () => {
  it('should make player available via inject', async () => {
    const TestComponent = defineComponent({
      inject: ['player'],
      render() {
        return h('div');
      }
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [MediaPlayerPlugin]
      }
    });

    await nextTick();

    expect(wrapper.vm.player).toBeInstanceOf(MakeNoise);
  });

  it('should make player available via $player', async () => {
    const TestComponent = defineComponent({
      render() {
        return h('div');
      }
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [MediaPlayerPlugin]
      }
    });

    await nextTick();

    expect((wrapper.vm as any).$player).toBeInstanceOf(MakeNoise);
  });

  it('should provide same player instance to multiple components', async () => {
    const Component1 = defineComponent({
      inject: ['player'],
      render() {
        return h('div');
      }
    });

    const Component2 = defineComponent({
      inject: ['player'],
      render() {
        return h('div');
      }
    });

    const wrapper1 = mount(Component1, {
      global: {
        plugins: [MediaPlayerPlugin]
      }
    });

    const wrapper2 = mount(Component2, {
      global: {
        plugins: [MediaPlayerPlugin]
      }
    });

    await nextTick();

    expect(wrapper1.vm.player).toBe(wrapper2.vm.player);
  });
});
