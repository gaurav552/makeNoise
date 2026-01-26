# React Adapter for MakeNoise

React-specific hooks and components for integrating the MakeNoise player into React applications.

## Installation

```bash
npm install makenoise react
```

## Usage

### Option 1: Using the `useMakeNoise` Hook

The simplest way to use MakeNoise in a React component:

```tsx
import { useMakeNoise } from 'makenoise';

function MyPlayer() {
  const { state, play, pause, addTrack, playlist } = useMakeNoise();

  const handleAddTrack = () => {
    addTrack({
      id: '1',
      src: 'https://example.com/song.mp3',
      title: 'My Song',
      artist: 'Artist Name',
    });
  };

  return (
    <div>
      <h1>{state.currentTrack?.title || 'No track playing'}</h1>
      <p>Artist: {state.currentTrack?.artist}</p>
      
      <button onClick={() => state.isPlaying ? pause() : play()}>
        {state.isPlaying ? 'Pause' : 'Play'}
      </button>
      
      <button onClick={handleAddTrack}>Add Track</button>
      
      <div>
        <p>Volume: {Math.round(state.volume * 100)}%</p>
        <p>Playlist: {playlist.length} tracks</p>
      </div>
    </div>
  );
}
```

### Option 2: Using Context Provider

For more complex applications, use the `MediaPlayerProvider` to make the player instance available throughout your component tree:

```tsx
import { MediaPlayerProvider, useMediaPlayer } from 'makenoise';

// Wrap your app with the provider
function App() {
  return (
    <MediaPlayerProvider>
      <PlayerControls />
      <Playlist />
      <NowPlaying />
    </MediaPlayerProvider>
  );
}

// Access the player instance in any child component
function PlayerControls() {
  const player = useMediaPlayer();
  
  return (
    <div>
      <button onClick={() => player.play()}>Play</button>
      <button onClick={() => player.pause()}>Pause</button>
      <button onClick={() => player.next()}>Next</button>
      <button onClick={() => player.previous()}>Previous</button>
    </div>
  );
}

function NowPlaying() {
  const player = useMediaPlayer();
  const [currentTrack, setCurrentTrack] = useState(player.getState().currentTrack);
  
  useEffect(() => {
    const handleTrackChange = (track) => {
      setCurrentTrack(track);
    };
    
    player.on('trackchange', handleTrackChange);
    return () => player.off('trackchange', handleTrackChange);
  }, [player]);
  
  return (
    <div>
      <h2>{currentTrack?.title || 'No track playing'}</h2>
      <p>{currentTrack?.artist}</p>
    </div>
  );
}
```

## API Reference

### `useMakeNoise()`

React hook that provides player state and control methods.

**Returns:**
- `state: PlayerState` - Current player state (reactive)
- `playlist: Track[]` - Current playlist (reactive)
- `play(trackOrIndex?: Track | number): Promise<void>` - Play a track or resume playback
- `pause(): void` - Pause playback
- `togglePlayPause(): void` - Toggle between play and pause
- `seek(time: number): void` - Seek to a specific time
- `setVolume(volume: number): void` - Set volume (0-1)
- `setPlaybackRate(rate: number): void` - Set playback rate
- `next(): void` - Play next track
- `previous(): void` - Play previous track
- `addTrack(track: Track | Track[], index?: number): void` - Add track(s) to playlist
- `removeTrack(index: number): void` - Remove track from playlist
- `clearPlaylist(): void` - Clear entire playlist
- `setRepeatMode(mode: RepeatMode): void` - Set repeat mode ('none', 'one', 'all')
- `toggleShuffle(): void` - Toggle shuffle mode

### `MediaPlayerProvider`

Context provider component that makes the player instance available to child components.

**Props:**
- `children: ReactNode` - Child components

### `useMediaPlayer()`

Hook to access the raw MakeNoise player instance from context.

**Returns:**
- `MakeNoise` - The player instance

**Throws:**
- Error if used outside of `MediaPlayerProvider`

## Features

- ✅ Automatic state synchronization with React
- ✅ Memoized control methods (no unnecessary re-renders)
- ✅ Automatic cleanup of event listeners on unmount
- ✅ TypeScript support with full type definitions
- ✅ Context provider for global player access
- ✅ Works with React 18+

## Requirements

- React 18.0.0 or higher
- TypeScript 5.0+ (for TypeScript projects)

## Notes

- The player instance is a singleton, so all components share the same player state
- State updates are reactive and will trigger component re-renders
- Control methods maintain referential equality across re-renders (safe for dependency arrays)
- Event listeners are automatically cleaned up when components unmount
