# MakeNoise Vue Adapter

Vue-specific integration for the MakeNoise audio player library.

## Installation

```bash
npm install makenoise vue
```

## Usage

### Using the Composable (Recommended)

The `useMakeNoise` composable provides reactive access to the player state and control methods.

```vue
<script setup>
import { useMakeNoise } from 'makenoise/vue';

const { state, playlist, play, pause, next, previous, addTrack } = useMakeNoise();

// Add some tracks
addTrack({
  id: '1',
  src: '/audio/track1.mp3',
  title: 'My Song',
  artist: 'Artist Name'
});
</script>

<template>
  <div class="player">
    <h2>{{ state.currentTrack?.title || 'No track playing' }}</h2>
    <p>{{ state.currentTrack?.artist }}</p>
    
    <div class="controls">
      <button @click="previous">Previous</button>
      <button @click="state.isPlaying ? pause() : play()">
        {{ state.isPlaying ? 'Pause' : 'Play' }}
      </button>
      <button @click="next">Next</button>
    </div>
    
    <div class="progress">
      <span>{{ formatTime(state.currentTime) }}</span>
      <input 
        type="range" 
        :value="state.currentTime" 
        :max="state.duration"
        @input="seek($event.target.value)"
      />
      <span>{{ formatTime(state.duration) }}</span>
    </div>
    
    <div class="playlist">
      <h3>Playlist ({{ playlist.length }} tracks)</h3>
      <ul>
        <li v-for="(track, index) in playlist" :key="track.id">
          {{ track.title }} - {{ track.artist }}
        </li>
      </ul>
    </div>
  </div>
</template>
```

### Using the Plugin

The `MediaPlayerPlugin` makes the player instance available globally.

```typescript
// main.ts
import { createApp } from 'vue';
import { MediaPlayerPlugin } from 'makenoise/vue';
import App from './App.vue';

const app = createApp(App);
app.use(MediaPlayerPlugin);
app.mount('#app');
```

Then access the player in your components:

```vue
<!-- Composition API with inject -->
<script setup>
import { inject } from 'vue';

const player = inject('player');

const handlePlay = () => {
  player.play();
};
</script>

<!-- Options API with this.$player -->
<script>
export default {
  methods: {
    handlePlay() {
      this.$player.play();
    }
  }
}
</script>
```

## API Reference

### useMakeNoise()

Returns an object with:

#### Reactive State
- `state: Ref<PlayerState>` - Reactive player state
- `playlist: Ref<Track[]>` - Reactive playlist

#### Control Methods
- `play(trackOrIndex?: Track | number): Promise<void>` - Play a track or resume
- `pause(): void` - Pause playback
- `togglePlayPause(): void` - Toggle play/pause
- `seek(time: number): void` - Seek to time in seconds
- `setVolume(volume: number): void` - Set volume (0-1)
- `setPlaybackRate(rate: number): void` - Set playback rate
- `next(): void` - Play next track
- `previous(): void` - Play previous track
- `addTrack(track: Track | Track[], index?: number): void` - Add track(s)
- `removeTrack(index: number): void` - Remove track
- `clearPlaylist(): void` - Clear playlist
- `setRepeatMode(mode: 'none' | 'one' | 'all'): void` - Set repeat mode
- `toggleShuffle(): void` - Toggle shuffle

### MediaPlayerPlugin

Vue plugin that provides:
- Global property: `this.$player` (Options API)
- Injected value: `inject('player')` (Composition API)

## Features

- ✅ Reactive state updates
- ✅ Automatic cleanup on component unmount
- ✅ TypeScript support
- ✅ Composition API and Options API support
- ✅ Global player instance (singleton)
- ✅ Persistent playback across route changes

## Requirements

- Vue 3.0+
- Modern browser with Web Audio API support
