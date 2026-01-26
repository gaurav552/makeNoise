<template>
  <div class="player-controls">
    <div class="controls-row">
      <button 
        @click="previous" 
        class="control-btn"
        :disabled="queue.length === 0"
        title="Previous track"
      >
        ⏮️
      </button>
      
      <button 
        @click="togglePlayPause" 
        class="control-btn control-btn-primary"
        :disabled="queue.length === 0"
        :title="state.isPlaying ? 'Pause' : 'Play'"
      >
        {{ state.isPlaying ? '⏸️' : '▶️' }}
      </button>
      
      <button 
        @click="next" 
        class="control-btn"
        :disabled="queue.length === 0"
        title="Next track"
      >
        ⏭️
      </button>
    </div>

    <div class="seek-container">
      <span class="time-display">{{ formatTime(state.currentTime) }}</span>
      <input
        type="range"
        class="seek-bar"
        :min="0"
        :max="state.duration || 100"
        :value="state.currentTime"
        @input="handleSeek"
        :disabled="!state.currentTrack"
      />
      <span class="time-display">{{ formatTime(state.duration) }}</span>
    </div>

    <div class="controls-row">
      <button 
        @click="toggleShuffle" 
        class="control-btn"
        :class="{ active: state.isShuffling }"
        :disabled="queue.length === 0"
        title="Toggle shuffle"
      >
        🔀
      </button>
      
      <button 
        @click="cycleRepeatMode" 
        class="control-btn"
        :class="{ active: state.repeatMode !== 'none' }"
        :disabled="queue.length === 0"
        :title="`Repeat: ${state.repeatMode}`"
      >
        {{ repeatIcon }}
      </button>
      
      <div class="volume-container">
        <span>🔊</span>
        <input
          type="range"
          class="volume-slider"
          min="0"
          max="1"
          step="0.01"
          :value="state.volume"
          @input="handleVolumeChange"
        />
      </div>
    </div>

    <div class="playback-rate-container">
      <label for="playback-rate">Speed:</label>
      <select 
        id="playback-rate" 
        :value="state.playbackRate" 
        @change="handlePlaybackRateChange"
        class="playback-rate-select"
      >
        <option :value="0.5">0.5x</option>
        <option :value="0.75">0.75x</option>
        <option :value="1">1x</option>
        <option :value="1.25">1.25x</option>
        <option :value="1.5">1.5x</option>
        <option :value="2">2x</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMakeNoise } from '@makenoise/vue';

const { 
  state, 
  queue,
  play,
  pause,
  togglePlayPause, 
  next, 
  previous, 
  seek, 
  setVolume,
  setPlaybackRate,
  toggleShuffle,
  setRepeatMode 
} = useMakeNoise();

const repeatIcon = computed(() => {
  switch (state.value.repeatMode) {
    case 'one':
      return '🔂';
    case 'all':
      return '🔁';
    default:
      return '🔁';
  }
});

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const handleSeek = (event: Event) => {
  const target = event.target as HTMLInputElement;
  seek(parseFloat(target.value));
};

const handleVolumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  setVolume(parseFloat(target.value));
};

const handlePlaybackRateChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  setPlaybackRate(parseFloat(target.value));
};

const cycleRepeatMode = () => {
  const modes = ['none', 'one', 'all'] as const;
  const currentIndex = modes.indexOf(state.value.repeatMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  setRepeatMode(modes[nextIndex]);
};
</script>

<style scoped>
.player-controls {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.control-btn {
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover:not(:disabled) {
  background: #e0e0e0;
  transform: scale(1.05);
}

.control-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 56px;
  height: 56px;
  font-size: 1.75rem;
}

.control-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
}

.control-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.seek-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.time-display {
  font-size: 0.875rem;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.seek-bar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
}

.seek-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.seek-bar::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
}

.seek-bar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.volume-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.volume-slider {
  width: 100px;
  height: 6px;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
}

.playback-rate-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.playback-rate-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
}

.playback-rate-select:focus {
  outline: none;
  border-color: #667eea;
}
</style>
