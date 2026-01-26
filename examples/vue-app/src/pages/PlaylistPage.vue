<template>
  <div class="page playlist-page">
    <h2>My Playlist</h2>
    <p>
      Manage your playlist and control playback modes.
    </p>

    <div class="demo-section">
      <h3>Playback Modes</h3>
      <div class="mode-info">
        <div class="mode-item">
          <strong>Repeat:</strong> {{ state.repeatMode }}
        </div>
        <div class="mode-item">
          <strong>Shuffle:</strong> {{ state.isShuffling ? 'On' : 'Off' }}
        </div>
      </div>
    </div>

    <div class="section-header">
      <h3 class="section-title">All Tracks ({{ queue.length }})</h3>
    </div>

    <p v-if="queue.length === 0" class="empty-state">
      No tracks in queue. Go to the Home page to load sample tracks.
    </p>
    
    <template v-else>
      <div class="track-list">
        <div 
          v-for="(track, index) in queue" 
          :key="track.id"
          :class="['track-item', { playing: state.currentTrack?.id === track.id }]"
          @click="handlePlayTrack(index)"
        >
          <span class="track-number">{{ index + 1 }}</span>
          <img :src="track.artwork" :alt="track.title" class="track-artwork" />
          <div class="track-info">
            <div class="track-title">{{ track.title }}</div>
            <div class="track-artist">{{ track.artist }}</div>
          </div>
          <span class="track-duration">3:45</span>
        </div>
      </div>

      <div class="controls">
        <button @click="handleClearPlaylist" class="btn">
          🗑️ Clear Queue
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useMakeNoise } from '@makenoise/vue';

const { state, queue, play, clearQueue } = useMakeNoise();

const handlePlayTrack = (index: number) => {
  play(index);
};

const handleClearPlaylist = () => {
  if (window.confirm('Are you sure you want to clear the queue?')) {
    clearQueue();
  }
};
</script>

<style scoped>
.page {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.playlist-page h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.playlist-page > p {
  margin: 0 0 24px 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
}

.demo-section {
  background-color: var(--bg-content);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.demo-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg-content);
  border-radius: 8px;
  border: 2px dashed var(--border-color);
}

.mode-info {
  display: flex;
  gap: 2rem;
}

.mode-item {
  display: flex;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.mode-item strong {
  color: var(--text-primary);
}

/* Section Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Track List */
.track-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.track-item:hover {
  background: var(--bg-sidebar-color);
  border-color: var(--accent);
}

.track-item.playing {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.track-number {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 24px;
  text-align: center;
}

.track-item.playing .track-number {
  color: white;
}

.track-artwork {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  background: var(--border-color);
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  color: var(--text-secondary);
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-item.playing .track-artist {
  color: rgba(255, 255, 255, 0.9);
}

.track-duration {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.track-item.playing .track-duration {
  color: white;
}

.controls {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-content);
  color: var(--text-primary);
}

.btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
  transform: translateY(-2px);
}

@media (max-width: 600px) {
  .mode-info {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
