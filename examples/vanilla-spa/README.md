# MakeNoise.js - Vanilla SPA Example

This example demonstrates how to use MakeNoise.js in a vanilla JavaScript Single Page Application without any framework dependencies.

## Features Demonstrated

- ✅ **Persistent audio playback** across route changes
- ✅ **Global player instance** using singleton pattern
- ✅ **Playlist management** (add, remove, navigate tracks)
- ✅ **Repeat modes** (none, one, all)
- ✅ **Shuffle mode** with playlist randomization
- ✅ **State persistence** in localStorage
- ✅ **Media Session API** integration for native controls
- ✅ **Keyboard shortcuts** for player control
- ✅ **Web Component UI** (`<make-noise-player>`)
- ✅ **Client-side routing** demonstrating SPA behavior

## Requirements

- **Requirement 1.1**: Player instantiation with audio element
- **Requirement 1.4**: Singleton pattern ensuring single global instance
- **Requirement 9.1**: Web Component UI integration

## Running the Example

### Option 1: Using a Local Web Server

You need to serve the files through a web server (not just opening the HTML file) because the example uses ES modules.

**Using Node.js http-server:**
```bash
# Install http-server globally (if not already installed)
npm install -g http-server

# Navigate to the vanilla-spa directory
cd examples/vanilla-spa

# Start the server
http-server -p 8080

# Open http://localhost:8080 in your browser
```

**Using Python:**
```bash
# Python 3
cd examples/vanilla-spa
python -m http.server 8080

# Open http://localhost:8080 in your browser
```

**Using PHP:**
```bash
cd examples/vanilla-spa
php -S localhost:8080

# Open http://localhost:8080 in your browser
```

### Option 2: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Project Structure

```
vanilla-spa/
├── index.html          # Main HTML file with UI structure
├── app.js              # Application logic and routing
├── public/             # Directory for audio files (optional)
│   └── README.md       # Instructions for adding audio files
└── README.md           # This file
```

## How It Works

### 1. Player Initialization

The player is initialized as a singleton instance:

```javascript
import { MakeNoise } from '../../dist/makenoise.js';

const player = MakeNoise.getInstance();
```

### 2. Adding Tracks to Playlist

Sample tracks are added to the playlist on initialization:

```javascript
const sampleTracks = [
  {
    id: '1',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Summer Breeze',
    artist: 'The Ambient Collective',
    artwork: 'https://picsum.photos/seed/track1/300/300'
  },
  // ... more tracks
];

player.addTrack(sampleTracks);
```

### 3. Web Component Integration

The player UI is added to the DOM using the custom web component:

```html
<make-noise-player></make-noise-player>
```

This component automatically connects to the global player instance and provides a complete UI with:
- Play/pause controls
- Previous/next track buttons
- Seek bar for navigation
- Volume control
- Track information display
- Time display (current/duration)

### 4. Client-Side Routing

A simple router is implemented to demonstrate SPA behavior:

```javascript
class Router {
  constructor() {
    this.currentRoute = 'home';
    this.setupNavigation();
    this.render();
  }

  navigate(route) {
    if (routes[route]) {
      this.currentRoute = route;
      this.render();
      this.updateActiveNav();
    }
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = routes[this.currentRoute]();
  }
}
```

### 5. Persistence Demonstration

The player state persists across:
- **Route changes**: Navigate between pages without interrupting playback
- **Page refreshes**: Reload the page and resume from where you left off
- **Browser sessions**: Close and reopen the browser to restore state

## Testing Persistence

1. **Start playing a track** from the playlist
2. **Navigate to different pages** using the navigation buttons
   - Notice the audio continues playing
   - The player UI remains functional
3. **Refresh the page** (F5 or Ctrl+R)
   - The player restores the track, position, volume, and playlist
4. **Close and reopen the browser**
   - The state is still preserved in localStorage

## Keyboard Shortcuts

The player supports global keyboard shortcuts:

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `M` | Mute / Unmute |
| `→` | Seek Forward (10s) |
| `←` | Seek Backward (10s) |
| `↑` | Volume Up |
| `↓` | Volume Down |

## Audio Files

The example uses online audio files from SoundHelix (free, royalty-free music) by default. You can replace these with your own audio files:

1. Place MP3 files in the `public/` directory
2. Update the `sampleTracks` array in `app.js` to point to your files:

```javascript
const sampleTracks = [
  {
    id: '1',
    src: './public/your-audio-file.mp3',
    title: 'Your Track Title',
    artist: 'Your Artist Name',
    artwork: 'path/to/artwork.jpg'
  }
];
```

## API Usage Examples

### Playing a Track

```javascript
// Play by index
player.play(0);

// Play by track object
player.play(trackObject);

// Resume current track
player.play();
```

### Playlist Management

```javascript
// Add single track
player.addTrack(track);

// Add multiple tracks
player.addTrack([track1, track2, track3]);

// Remove track by index
player.removeTrack(0);

// Clear entire playlist
player.clearPlaylist();
```

### Playback Control

```javascript
// Pause
player.pause();

// Toggle play/pause
player.togglePlayPause();

// Seek to time (in seconds)
player.seek(30);

// Set volume (0-1)
player.setVolume(0.5);

// Set playback rate
player.setPlaybackRate(1.5);
```

### Playlist Modes

```javascript
// Set repeat mode
player.setRepeatMode('none'); // 'none', 'one', 'all'

// Toggle shuffle
player.toggleShuffle();

// Navigate tracks
player.next();
player.previous();
```

### Event Listening

```javascript
// Listen to player events
player.on('play', () => console.log('Playing'));
player.on('pause', () => console.log('Paused'));
player.on('trackchange', (track) => console.log('Track changed:', track));
player.on('statechange', (state) => console.log('State updated:', state));
player.on('error', (error) => console.error('Error:', error));
```

### State Queries

```javascript
// Get current state
const state = player.getState();
console.log(state.isPlaying, state.currentTrack, state.volume);

// Get playlist
const playlist = player.getPlaylist();
console.log(playlist.length);
```

## Browser Compatibility

This example works in all modern browsers that support:
- ES6 Modules
- Web Components (Custom Elements)
- Media Session API (optional, for native controls)
- Local Storage

Tested in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Module Import Errors

If you see errors like "Cannot use import statement outside a module":
- Make sure you're serving the files through a web server
- Don't open the HTML file directly (file:// protocol)

### Audio Not Playing

If audio doesn't play:
- Check the browser console for errors
- Verify the audio file URLs are accessible
- Some browsers require user interaction before playing audio
- Check if the audio format is supported by your browser

### Web Component Not Rendering

If the player UI doesn't appear:
- Check that the library is built (`npm run build`)
- Verify the import path in `app.js` is correct
- Check the browser console for errors

## Next Steps

- Explore the [React example](../react-app/) for framework integration
- Explore the [Vue example](../vue-app/) for Vue.js integration
- Read the [API documentation](../../README.md) for complete reference
- Check out the [source code](../../src/) to understand the implementation

## License

This example is part of the MakeNoise.js project and is licensed under the MIT License.
