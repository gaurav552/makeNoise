<template>
  <div class="track-info">
    <div v-if="track" class="track-content">
      <img 
        v-if="track.artwork" 
        :src="track.artwork" 
        :alt="`${track.title} artwork`"
        class="track-artwork"
      />
      <div v-else class="track-artwork-placeholder">
        🎵
      </div>
      
      <div class="track-details">
        <h3 class="track-title">{{ track.title }}</h3>
        <p v-if="track.artist" class="track-artist">{{ track.artist }}</p>
        <p v-else class="track-artist">Unknown Artist</p>
      </div>
    </div>
    
    <div v-else class="track-content empty">
      <div class="track-artwork-placeholder">
        🎵
      </div>
      <div class="track-details">
        <h3 class="track-title">No track playing</h3>
        <p class="track-artist">Load a playlist to get started</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Track } from '@makenoise/core';

defineProps<{
  track: Track | null;
}>();
</script>

<style scoped>
.track-info {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.track-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.track-content.empty {
  opacity: 0.6;
}

.track-artwork {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.track-artwork-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.track-details {
  flex: 1;
  min-width: 0;
}

.track-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  margin: 0;
  font-size: 1.125rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .track-content {
    flex-direction: column;
    text-align: center;
  }
  
  .track-title,
  .track-artist {
    white-space: normal;
  }
}
</style>
