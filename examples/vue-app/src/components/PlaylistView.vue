<template>
  <div class="playlist-view">
    <div 
      v-for="(track, index) in queue" 
      :key="track.id"
      class="playlist-item"
      :class="{ active: index === state.currentQueueIndex }"
      @click="handleTrackClick(index)"
    >
      <div class="track-number">
        <span v-if="index === state.currentQueueIndex && state.isPlaying">
          ▶️
        </span>
        <span v-else>
          {{ index + 1 }}
        </span>
      </div>
      
      <img 
        v-if="track.artwork" 
        :src="track.artwork" 
        :alt="`${track.title} artwork`"
        class="track-thumbnail"
      />
      <div v-else class="track-thumbnail-placeholder">
        🎵
      </div>
      
      <div class="track-info">
        <div class="track-title">{{ track.title }}</div>
        <div class="track-artist">{{ track.artist || 'Unknown Artist' }}</div>
      </div>
      
      <div class="track-duration">
        {{ formatDuration(track.duration) }}
      </div>
      
      <button 
        @click.stop="handleRemoveTrack(index)"
        class="remove-btn"
        title="Remove from queue"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMakeNoise } from '@makenoise/vue';

const { state, queue, play, removeFromQueue } = useMakeNoise();

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const handleTrackClick = (index: number) => {
  play(index);
};

const handleRemoveTrack = (index: number) => {
  removeFromQueue(index);
};
</script>

<style scoped>
.playlist-view {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.playlist-item:hover {
  background: #f5f5f5;
  transform: translateX(4px);
}

.playlist-item.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.track-number {
  width: 32px;
  text-align: center;
  font-weight: 600;
  color: #666;
  font-size: 0.875rem;
}

.playlist-item.active .track-number {
  color: #667eea;
}

.track-thumbnail {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
}

.track-thumbnail-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-title {
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0.25rem;
}

.track-artist {
  font-size: 0.875rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-duration {
  font-size: 0.875rem;
  color: #666;
  font-variant-numeric: tabular-nums;
}

.remove-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0;
}

.playlist-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: #ffebee;
  color: #d32f2f;
}

@media (max-width: 600px) {
  .playlist-item {
    gap: 0.5rem;
    padding: 0.5rem;
  }
  
  .track-number {
    width: 24px;
    font-size: 0.75rem;
  }
  
  .track-thumbnail,
  .track-thumbnail-placeholder {
    width: 40px;
    height: 40px;
  }
  
  .track-duration {
    display: none;
  }
  
  .remove-btn {
    opacity: 1;
  }
}
</style>
