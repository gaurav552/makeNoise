<template>
  <div class="page home-page">
    <h2>Discover Music</h2>
    
    <div class="section-header">
      <h3 class="section-title">Popular Albums</h3>
      <button @click="handlePlayAll" class="btn btn-secondary">
        <svg style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
          <polygon points="6 3 20 12 6 21 6 3"/>
        </svg>
        Play All
      </button>
    </div>
    
    <div class="album-grid">
      <div 
        v-for="track in sampleTracks.slice(0, 5)" 
        :key="track.id"
        :class="['album-card', { active: state.currentTrack?.id === track.id }]"
        @click="handlePlaySingleTrack(track)"
      >
        <img :src="track.artwork" :alt="track.title" class="album-artwork" />
        <div class="album-title">{{ track.title }}</div>
        <div class="album-artist">{{ track.artist }}</div>
      </div>
    </div>

    <div class="section-header">
      <h3 class="section-title">Top Charts</h3>
    </div>
    
    <div class="track-list">
      <div 
        v-for="(track, index) in sampleTracks.slice(0, 3)" 
        :key="track.id"
        :class="['track-item', { playing: state.currentTrack?.id === track.id }]"
      >
        <span class="track-number">{{ index + 1 }}</span>
        <img :src="track.artwork" :alt="track.title" class="track-artwork" @click="handlePlaySingleTrack(track)" />
        <div class="track-info" @click="handlePlaySingleTrack(track)">
          <div class="track-title">{{ track.title }}</div>
          <div class="track-artist">{{ track.artist }}</div>
        </div>
        <span class="track-duration">{{ formatTime(track.duration || 0) }}</span>
        <div class="track-actions">
          <button 
            @click="playNext(track)" 
            class="track-action-btn"
            title="Play Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>
            </svg>
          </button>
          <button 
            @click="addToQueue(track)" 
            class="track-action-btn"
            title="Add to Queue"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="queue.length > 0" class="info-box">
      <h3>Player State</h3>
      <div class="state-grid">
        <div class="state-item">
          <strong>Status</strong>
          <span>{{ state.isPlaying ? "Playing" : state.isPaused ? "Paused" : "Stopped" }}</span>
        </div>
        <div class="state-item">
          <strong>Current Track</strong>
          <span>{{ state.currentTrack ? state.currentTrack.title : "None" }}</span>
        </div>
        <div class="state-item">
          <strong>Queue</strong>
          <span>{{ queue.length }} tracks</span>
        </div>
        <div class="state-item">
          <strong>Volume</strong>
          <span>{{ Math.round(state.volume * 100) }}%</span>
        </div>
        <div class="state-item">
          <strong>Repeat Mode</strong>
          <span>{{ state.repeatMode }}</span>
        </div>
        <div class="state-item">
          <strong>Shuffle</strong>
          <span>{{ state.isShuffling ? "On" : "Off" }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMakeNoise } from '@makenoise/vue';
import { sampleTracks } from '../data/sampleTracks';

const { state, queue, addToQueue, play, playNext } = useMakeNoise();

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Play a single track - adds after currently playing track and plays it
const handlePlaySingleTrack = (track: typeof sampleTracks[0]) => {
  const currentIndex = state.value.currentQueueIndex;
  // If there's a currently playing track, insert after it. Otherwise, add to end.
  const insertIndex = currentIndex >= 0 ? currentIndex + 1 : queue.value.length;
  
  playNext(track); // This inserts after current track
  play(insertIndex); // Play the newly inserted track
};

// Play all tracks - adds all to queue and starts playing the first newly added track
const handlePlayAll = () => {
  const startIndex = queue.value.length; // Remember where new tracks start
  addToQueue(sampleTracks);
  play(startIndex); // Start playing the first newly added track
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

.home-page h2 {
  margin: 0 0 24px 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

/* Album Grid */
.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.album-card {
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.album-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--accent);
}

.album-card.active {
  border-color: var(--accent);
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: white;
}

.album-artwork {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 12px;
  background: var(--border-color);
}

.album-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-artist {
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-card.active .album-artist {
  color: rgba(255, 255, 255, 0.9);
}

/* Track List */
.track-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
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
  cursor: pointer;
}

.track-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
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

.track-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.track-item:hover .track-actions {
  opacity: 1;
}

.track-action-btn {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-content);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-action-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
  transform: scale(1.1);
}

.track-item.playing .track-action-btn {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.track-item.playing .track-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
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

.section-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.section-link:hover {
  color: var(--accent-hover);
}

/* Info Box */
.info-box {
  background: var(--bg-sidebar-color);
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid var(--border-color);
}

.info-box h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.state-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.state-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.state-item strong {
  color: var(--text-primary);
  font-size: 0.85rem;
}

.state-item span {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .album-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }
}
</style>
