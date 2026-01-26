# MakeNoise React Example

This is a complete React example application demonstrating the MakeNoise audio player library with React integration.

## Features Demonstrated

- ✅ **MediaPlayerProvider** wrapping the entire app
- ✅ **useMakeNoise hook** for accessing player state and controls
- ✅ **Persistent playback** across route changes
- ✅ **React Router** integration showing SPA navigation
- ✅ **Custom UI components** built with React
- ✅ **Sample playlist** with multiple tracks
- ✅ **Full player controls** (play, pause, seek, volume, etc.)
- ✅ **Playlist management** (add, remove, shuffle, repeat)
- ✅ **Responsive design** for mobile and desktop

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── PlayerControls.tsx    # Main player control interface
│   ├── TrackInfo.tsx          # Current track display
│   └── PlaylistView.tsx       # Playlist management UI
├── pages/              # Route pages
│   ├── HomePage.tsx           # Landing page with quick start
│   ├── PlaylistPage.tsx       # Playlist management page
│   └── AboutPage.tsx          # Documentation and state display
├── data/               # Sample data
│   └── sampleTracks.ts        # Sample audio tracks
├── App.tsx             # Main app component with routing
└── main.tsx            # App entry point with providers
```

## Getting Started

### Installation

```bash
cd examples/react-app
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

### Basic Setup

```tsx
import { MediaPlayerProvider, useMakeNoise } from '@makenoise/react';

function App() {
  return (
    <MediaPlayerProvider>
      <PlayerComponent />
    </MediaPlayerProvider>
  );
}

function PlayerComponent() {
  const { state, play, pause } = useMakeNoise();
  
  return (
    <button onClick={() => state.isPlaying ? pause() : play()}>
      {state.isPlaying ? 'Pause' : 'Play'}
    </button>
  );
}
```

### Adding Tracks

```tsx
function PlaylistManager() {
  const { addTrack, playlist } = useMakeNoise();
  
  const handleAddTrack = () => {
    addTrack({
      id: 'track-1',
      src: 'https://example.com/audio.mp3',
      title: 'My Track',
      artist: 'Artist Name',
      artwork: 'https://example.com/artwork.jpg',
    });
  };
  
  return (
    <div>
      <button onClick={handleAddTrack}>Add Track</button>
      <p>Playlist has {playlist.length} tracks</p>
    </div>
  );
}
```

### Player Controls

```tsx
function Controls() {
  const {
    state,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    setRepeatMode,
    toggleShuffle,
  } = useMakeNoise();
  
  return (
    <div>
      <button onClick={previous}>Previous</button>
      <button onClick={() => state.isPlaying ? pause() : play()}>
        {state.isPlaying ? 'Pause' : 'Play'}
      </button>
      <button onClick={next}>Next</button>
      
      <input
        type="range"
        min="0"
        max={state.duration}
        value={state.currentTime}
        onChange={(e) => seek(parseFloat(e.target.value))}
      />
      
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={state.volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
      />
      
      <button onClick={() => setRepeatMode('all')}>Repeat All</button>
      <button onClick={toggleShuffle}>
        Shuffle: {state.isShuffling ? 'On' : 'Off'}
      </button>
    </div>
  );
}
```

## Key Concepts

### MediaPlayerProvider

The `MediaPlayerProvider` component creates and provides the MakeNoise player instance to all child components. It should wrap your entire app (or the part that needs access to the player).

### useMakeNoise Hook

The `useMakeNoise` hook provides:
- **state**: Current player state (isPlaying, currentTrack, volume, etc.)
- **playlist**: Current playlist array
- **Control methods**: play, pause, seek, setVolume, etc.

The hook automatically subscribes to player events and updates React state when the player state changes.

### Persistent Playback

The player instance is global and persists across route changes. Audio continues playing when you navigate between pages, demonstrating the core value of MakeNoise for SPAs.

### State Persistence

Player state is automatically saved to localStorage and restored when the page reloads, including:
- Current track and playback position
- Volume and playback rate
- Playlist contents
- Repeat and shuffle modes

## Requirements Validated

This example validates the following requirements:

- **11.1**: useMakeNoise hook returns player state and control methods
- **11.2**: Hook subscribes to player events and updates React state
- **11.4**: MediaPlayerProvider context component
- **11.5**: MediaPlayerProvider makes player available to child components

## Learn More

- [MakeNoise Documentation](../../README.md)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
