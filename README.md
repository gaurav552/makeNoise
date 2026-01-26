# [MakeNoise.js](https://gaurav552.github.io/makeNoise/examples/vanilla-spa/index.html)

> A framework-agnostic global media player library for Single Page Applications

MakeNoise.js is a TypeScript-based audio player library designed specifically for Single Page Applications (SPAs). It provides persistent audio playback that survives route changes, comprehensive playlist management, and seamless integration with any frontend framework through a vanilla TypeScript core and optional framework adapters.

## ✨ Features

- 🎵 **Persistent Playback** - Audio continues playing across SPA route changes
- 🔄 **Queue Management** - Full queue support with add, remove, reorder, shuffle, and repeat modes
- 🎨 **Framework Agnostic** - Vanilla TypeScript core with optional React and Vue adapters
- 📱 **Media Session API** - Native OS media controls and notifications
- ⌨️ **Keyboard Shortcuts** - Control playback with keyboard (Space, arrows, M for mute)
- 💾 **State Persistence** - Automatic state saving to localStorage across sessions
- 🎯 **TypeScript First** - Complete type definitions with full IDE autocomplete
- ♿ **Accessible UI** - Optional Web Component with ARIA attributes and keyboard navigation
- 🎛️ **Playback Control** - Play, pause, seek, volume, playback rate control
- 🔁 **Repeat Modes** - None, repeat one, repeat all
- 🔀 **Shuffle Mode** - Randomize playlist order while preserving current track
- 📦 **Zero Dependencies** - Core library has no external dependencies
- 🪶 **Lightweight** - Small bundle size with tree-shaking support

## 📦 Installation

```bash
npm install makenoise
```

Or with yarn:

```bash
yarn add makenoise
```

Or with pnpm:

```bash
pnpm add makenoise
```

## 🚀 Quick Start

### Vanilla JavaScript/TypeScript

```typescript
import { MakeNoise } from "makenoise";

// Get the singleton player instance
const player = MakeNoise.getInstance();

// Add tracks to the queue
player.addToQueue({
  id: "1",
  src: "/audio/song.mp3",
  title: "My Favorite Song",
  artist: "Artist Name",
  artwork: "/images/album-art.jpg",
});

// Start playback
player.play();

// Listen to player events
player.on("play", () => console.log("Playing!"));
player.on("pause", () => console.log("Paused!"));
player.on("trackchange", (track) => console.log("Now playing:", track.title));
```

### React

```tsx
import { useMakeNoise } from "makenoise/react";

function PlayerControls() {
  const { state, play, pause, next, previous, queue } = useMakeNoise();

  return (
    <div>
      <h3>{state.currentTrack?.title || "No track playing"}</h3>
      <p>{state.currentTrack?.artist}</p>

      <button onClick={previous}>⏮️ Previous</button>
      <button onClick={() => (state.isPlaying ? pause() : play())}>
        {state.isPlaying ? "⏸️ Pause" : "▶️ Play"}
      </button>
      <button onClick={next}>⏭️ Next</button>

      <div>
        <input
          type="range"
          min="0"
          max={state.duration}
          value={state.currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
        />
      </div>

      <p>Queue: {queue.length} tracks</p>
    </div>
  );
}
```

### Vue 3

```vue
<template>
  <div class="player-controls">
    <h3>{{ state.currentTrack?.title || "No track playing" }}</h3>
    <p>{{ state.currentTrack?.artist }}</p>

    <button @click="previous">⏮️ Previous</button>
    <button @click="state.isPlaying ? pause() : play()">
      {{ state.isPlaying ? "⏸️ Pause" : "▶️ Play" }}
    </button>
    <button @click="next">⏭️ Next</button>

    <input
      type="range"
      :min="0"
      :max="state.duration"
      :value="state.currentTime"
      @input="seek(parseFloat($event.target.value))"
    />

    <p>Queue: {{ queue.length }} tracks</p>
  </div>
</template>

<script setup lang="ts">
import { useMakeNoise } from "makenoise/vue";

const { state, play, pause, next, previous, seek, queue } = useMakeNoise();
</script>
```

## 📖 API Documentation

### Core Player API

#### `MakeNoise.getInstance(config?)`

Get the singleton player instance. Only the first call accepts configuration.

```typescript
const player = MakeNoise.getInstance({
  persistState: true, // Enable localStorage persistence (default: true)
  persistenceKey: "my_player", // localStorage key (default: 'makenoise_state')
  enableKeyboardShortcuts: true, // Enable keyboard shortcuts (default: true)
  enableMediaSession: true, // Enable Media Session API (default: true)
  initialVolume: 0.8, // Initial volume 0-1 (default: 1.0)
  preloadStrategy: "metadata", // 'none' | 'metadata' | 'auto' (default: 'metadata')
});
```

#### Playback Control Methods

```typescript
// Play a track by index or Track object, or resume current track
await player.play(); // Resume current track
await player.play(0); // Play first track in queue
await player.play(track); // Play specific track

// Pause playback
player.pause();

// Toggle between play and pause
player.togglePlayPause();

// Seek to specific time (in seconds)
player.seek(30);

// Set volume (0-1)
player.setVolume(0.5);

// Set playback rate (0.5-2.0 typically)
player.setPlaybackRate(1.5);

// Navigate queue
player.next(); // Play next track
player.previous(); // Play previous track (or restart if >3s into track)
```

#### Queue Management Methods

```typescript
// Add single track to end of queue
player.addToQueue({
  id: "1",
  src: "/audio/song.mp3",
  title: "Song Title",
  artist: "Artist Name",
  artwork: "/images/art.jpg",
});

// Add multiple tracks to end of queue
player.addToQueue([track1, track2, track3]);

// Play track next (insert after current)
player.playNext(track);

// Remove track by index
player.removeFromQueue(0);

// Clear entire queue
player.clearQueue();

// Jump to specific position in queue
player.jumpToQueueIndex(2); // Jump to index 2
```

#### Queue Modes

```typescript
// Set repeat mode
player.setRepeatMode("none"); // Stop at end of queue
player.setRepeatMode("one"); // Repeat current track
player.setRepeatMode("all"); // Loop entire queue

// Toggle shuffle
player.toggleShuffle(); // Randomize queue order
```

#### Event Subscription

```typescript
// Subscribe to events
player.on("play", () => console.log("Playing"));
player.on("pause", () => console.log("Paused"));
player.on("ended", () => console.log("Track ended"));
player.on("trackchange", (track) => console.log("Track changed:", track));
player.on("playlistchange", () => console.log("Playlist updated"));
player.on("queuechange", () => console.log("Queue updated"));
player.on("timeupdate", (time) => console.log("Current time:", time));
player.on("volumechange", (volume) => console.log("Volume:", volume));
player.on("error", (error) => console.error("Error:", error));
player.on("statechange", (state) => console.log("State updated:", state));

// Unsubscribe from events
const handler = () => console.log("Playing");
player.on("play", handler);
player.off("play", handler);
```

#### State Query Methods

```typescript
// Get current player state (immutable snapshot)
const state = player.getState();
console.log(state.isPlaying);
console.log(state.currentTrack);
console.log(state.volume);

// Get current queue (immutable copy)
const queue = player.getQueue();
console.log(queue.length);
```

### TypeScript Types

```typescript
interface Track {
  id: string;
  src: string;
  title: string;
  artist?: string;
  artwork?: string;
  duration?: number;
  [key: string]: any;  // Custom metadata
}

interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  currentTrack: Track | null;
  currentQueueIndex: number;
  queueLength: number;
  repeatMode: 'none' | 'one' | 'all';
  isShuffling: boolean;
  error: PlayerError | null;
}

type PlayerEvents =
  | 'play'
  | 'pause'
  | 'ended'
  | 'timeupdate'
  | 'durationchange'
  | 'volumechange'
  | 'ratechange'
  | 'trackchange'
  | 'queue
  | 'statechange'
  | 'loading'
  | 'loadeddata'
  | 'seeking'
  | 'seeked';
```

### React Adapter API

#### `useMakeNoise()`

React hook that provides reactive player state and control methods.

```typescript
import { useMakeNoise } from "makenoise/react";

function MyComponent() {
  const {
    state, // PlayerState (reactive)
    queue, // Track[] (reactive)
    play, // (trackOrIndex?) => Promise<void>
    pause, // () => void
    togglePlayPause, // () => void
    seek, // (time: number) => void
    setVolume, // (volume: number) => void
    setPlaybackRate, // (rate: number) => void
    next, // () => void
    previous, // () => void
    addToQueue, // (track: Track | Track[]) => void
    playNext, // (track: Track | Track[]) => void
    removeFromQueue, // (index: number) => void
    clearQueue, // () => void
    setRepeatMode, // (mode: RepeatMode) => void
    toggleShuffle, // () => void
  } = useMakeNoise();

  // Use state and methods...
}
```

#### `MediaPlayerProvider` & `useMediaPlayer()`

Context provider for accessing player instance directly.

```typescript
import { MediaPlayerProvider, useMediaPlayer } from 'makenoise/react';

function App() {
  return (
    <MediaPlayerProvider>
      <MyComponent />
    </MediaPlayerProvider>
  );
}

function MyComponent() {
  const player = useMediaPlayer();  // Access MakeNoise instance directly

  useEffect(() => {
    player.on('play', () => console.log('Playing!'));
    return () => player.off('play', handler);
  }, [player]);
}
```

### Vue Adapter API

#### `useMakeNoise()`

Vue composable that provides reactive player state and control methods.

```typescript
import { useMakeNoise } from "makenoise/vue";

export default {
  setup() {
    const {
      state, // Ref<PlayerState> (reactive)
      queue, // Ref<Track[]> (reactive)
      play, // (trackOrIndex?) => Promise<void>
      pause, // () => void
      togglePlayPause, // () => void
      seek, // (time: number) => void
      setVolume, // (volume: number) => void
      setPlaybackRate, // (rate: number) => void
      next, // () => void
      previous, // () => void
      addToQueue, // (track: Track | Track[]) => void
      playNext, // (track: Track | Track[]) => void
      removeFromQueue, // (index: number) => void
      clearQueue, // () => void
      setRepeatMode, // (mode: RepeatMode) => void
      toggleShuffle, // () => void
    } = useMakeNoise();

    return { state, queue, play, pause /* ... */ };
  },
};
```

#### `MediaPlayerPlugin`

Vue plugin for global player instance access.

```typescript
import { createApp } from "vue";
import { MediaPlayerPlugin } from "makenoise/vue";
import App from "./App.vue";

const app = createApp(App);
app.use(MediaPlayerPlugin);
app.mount("#app");

// Access in components via:
// this.$player (Options API)
// inject('player') (Composition API)
```

## ⌨️ Keyboard Shortcuts

When `enableKeyboardShortcuts` is true (default), these shortcuts are available globally:

| Key     | Action                   |
| ------- | ------------------------ |
| `Space` | Play / Pause             |
| `M`     | Toggle Mute              |
| `→`     | Seek forward 10 seconds  |
| `←`     | Seek backward 10 seconds |
| `↑`     | Increase volume by 10%   |
| `↓`     | Decrease volume by 10%   |

## 💾 State Persistence

MakeNoise automatically persists the following state to localStorage:

- Current track and playback position
- Volume level
- Playback rate
- Repeat mode
- Shufflequeue
- Entire playlist

State is restored automatically when the player is initialized, allowing users to resume exactly where they left off, even after closing the browser.

To disable persistence:

```typescript
const player = MakeNoise.getInstance({ persistState: false });
```

## 🎨 Web Component UI

MakeNoise includes an optional Web Component UI that can be used in any framework or vanilla JavaScript:

```html
<!-- Add to your HTML -->
<make-noise-player></make-noise-player>
```

The Web Component automatically connects to the global player instance and provides:

- Play/pause, next/previous buttons
- Seek bar with time display
- Volume slider
- Track information display (title, artist, artwork)
- Fully accessible with ARIA attributes
- Keyboard navigable
- Customizable via CSS variables

### Styling the Web Component

```css
make-noise-player {
  --player-bg: #ffffff;
  --player-text: #333333;
  --player-accent: #667eea;
  --player-border: #e0e0e0;
}
```

## 🌐 Browser Compatibility

MakeNoise works in all modern browsers that support:

- ES6+ JavaScript
- HTMLAudioElement
- Web Components (for optional UI)
- Media Session API (optional, gracefully degrades)
- localStorage (optional, gracefully degrades)

Tested in:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## 📚 Examples

Check out the `/examples` directory for complete working examples:

- **Vanilla SPA** - Pure JavaScript single-page application
- **React App** - React application with hooks
- **Vue App** - Vue 3 application with composables

To run examples:

```bash
# Clone the repository
git clone https://github.com/yourusername/makenoise.git
cd makenoise

# Install dependencies
npm install

# Build the library
npm run build

# Run vanilla example
cd examples/vanilla-spa
npm install
npm run dev

# Run React example
cd examples/react-app
npm install
npm run dev

# Run Vue example
cd examples/vue-app
npm install
npm run dev
```

## 🧪 Testing

MakeNoise uses a comprehensive testing strategy with both unit tests and property-based tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build library
npm run build

# Type check
npm run type-check

# Development mode (with examples)
npm run dev
```

## 📄 License

MIT © [Your Name]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/yourusername/makenoise/issues).

## 🙏 Acknowledgments

- Inspired by the need for persistent audio in modern SPAs
- Built with TypeScript, Vite, and Vitest
- Property-based testing with fast-check

---

Made with ❤️ by Gaura Ghimire
