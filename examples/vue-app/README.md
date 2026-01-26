# MakeNoise Vue Example

This is a complete example application demonstrating the MakeNoise audio player library integrated with Vue 3.

## Features Demonstrated

- ✅ **MediaPlayerPlugin Installation**: Global player instance via Vue plugin
- ✅ **useMakeNoise Composable**: Reactive state management with Vue composables
- ✅ **Custom UI Components**: PlayerControls, TrackInfo, and PlaylistView components
- ✅ **Vue Router Integration**: Persistent playback across route changes
- ✅ **Sample Playlist**: Pre-configured tracks for testing
- ✅ **Keyboard Shortcuts**: Space, M, Arrow keys for playback control
- ✅ **Media Session API**: Native OS media controls
- ✅ **Playlist Management**: Shuffle, repeat, add/remove tracks
- ✅ **State Persistence**: localStorage integration for session persistence

## Project Structure

```
vue-app/
├── src/
│   ├── components/
│   │   ├── PlayerControls.vue    # Main playback controls
│   │   ├── TrackInfo.vue         # Current track display
│   │   └── PlaylistView.vue      # Playlist management
│   ├── pages/
│   │   ├── HomePage.vue          # Home page with quick start
│   │   ├── PlaylistPage.vue      # Playlist management page
│   │   └── AboutPage.vue         # About and documentation
│   ├── data/
│   │   └── sampleTracks.ts       # Sample audio tracks
│   ├── App.vue                   # Root component
│   ├── main.ts                   # Application entry point
│   └── style.css                 # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Installation

```bash
cd examples/vue-app
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

## Usage Examples

### Installing the Plugin

```typescript
// main.ts
import { createApp } from 'vue';
import { MediaPlayerPlugin } from '@makenoise/vue';
import App from './App.vue';

const app = createApp(App);
app.use(MediaPlayerPlugin);
app.mount('#app');
```

### Using the Composable

```vue
<script setup lang="ts">
import { useMakeNoise } from '@makenoise/vue';

const { 
  state,           // Reactive player state
  playlist,        // Reactive playlist
  play,            // Play method
  pause,           // Pause method
  togglePlayPause, // Toggle play/pause
  next,            // Next track
  previous,        // Previous track
  seek,            // Seek to time
  setVolume,       // Set volume
  addTrack,        // Add track(s)
  removeTrack,     // Remove track
  clearPlaylist,   // Clear playlist
  setRepeatMode,   // Set repeat mode
  toggleShuffle    // Toggle shuffle
} = useMakeNoise();
</script>

<template>
  <div>
    <h2>{{ state.currentTrack?.title }}</h2>
    <button @click="togglePlayPause">
      {{ state.isPlaying ? 'Pause' : 'Play' }}
    </button>
  </div>
</template>
```

### Adding Tracks

```typescript
import type { Track } from '@makenoise/core';

const track: Track = {
  id: 'track-1',
  src: 'https://example.com/audio.mp3',
  title: 'My Song',
  artist: 'Artist Name',
  artwork: 'https://example.com/artwork.jpg',
  duration: 180
};

// Add single track
addTrack(track);

// Add multiple tracks
addTrack([track1, track2, track3]);

// Add at specific position
addTrack(track, 2);
```

### Using the Web Component

```vue
<template>
  <div>
    <!-- Use the default UI web component -->
    <make-noise-player></make-noise-player>
  </div>
</template>
```

## Key Concepts

### Reactive State

The `useMakeNoise` composable returns reactive refs that automatically update when the player state changes:

```typescript
const { state, playlist } = useMakeNoise();

// state.value contains:
// - isPlaying: boolean
// - isPaused: boolean
// - currentTime: number
// - duration: number
// - volume: number
// - currentTrack: Track | null
// - repeatMode: 'none' | 'one' | 'all'
// - isShuffling: boolean
// - etc.
```

### Automatic Cleanup

The composable automatically subscribes to player events on mount and unsubscribes on unmount, preventing memory leaks.

### Persistent Playback

The player instance is global and persists across:
- Route changes (via Vue Router)
- Component mount/unmount cycles
- Browser sessions (via localStorage)

## Keyboard Shortcuts

- **Space**: Play / Pause
- **M**: Toggle Mute
- **→**: Seek Forward 10 seconds
- **←**: Seek Backward 10 seconds
- **↑**: Volume Up
- **↓**: Volume Down

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.5+)
- Opera: Full support

## License

MIT
