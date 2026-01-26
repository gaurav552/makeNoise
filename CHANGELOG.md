# Changelog

All notable changes to MakeNoise.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-XX

### 🎉 Initial Release

MakeNoise.js v1.0.0 is the first stable release of the framework-agnostic global media player library for Single Page Applications.

### ✨ Features

#### Core Player
- **Singleton Pattern**: Global player instance that persists across route changes
- **Audio Playback Control**: Play, pause, seek, volume, and playback rate control
- **Playlist Management**: Add, remove, reorder tracks with full playlist support
- **Event System**: Comprehensive event emission for reactive UI updates
- **State Persistence**: Automatic localStorage persistence of player state, playlist, and preferences
- **Error Handling**: Robust error handling with detailed error information

#### Playlist Features
- **Repeat Modes**: Support for none, repeat one, and repeat all modes with distinct icons
- **Shuffle Mode**: Randomize playlist order while preserving current track
- **Navigation**: Next/previous track navigation with smart behavior
- **Dynamic Playlist**: Add/remove tracks during playback without interruption

#### UI Components
- **Web Component**: `<make-noise-player>` custom element with Shadow DOM encapsulation
- **YouTube-Style Progress Bar**: Sleek progress bar at the top of the player
- **Time Display**: Current time and duration shown in track info section
- **Repeat Mode Icons**: Distinct icons for repeat off, repeat all, and repeat one states
- **Theme Support**: Automatic light/dark mode detection with manual toggle
- **Responsive Design**: Mobile-friendly layout with adaptive controls

#### Example Applications
- **Unified Styling**: All three examples (Vanilla, React, Vue) use shared-styles.css for complete consistency
- **Consistent Scrollbars**: Identical scrollbar styling across all examples
- **Professional Icons**: SVG-based Lucide-style icons throughout
- **Dark Mode Default**: All examples default to dark theme

#### Browser Integration
- **Media Session API**: Native OS media controls and notifications
- **Keyboard Shortcuts**: Global keyboard shortcuts for player control
  - Space: Play/Pause
  - M: Toggle Mute
  - Arrow keys: Seek and volume control
- **State Restoration**: Automatic restoration of playback position and settings

#### Framework Adapters

##### React Adapter
- `useMakeNoise()` hook with reactive state
- `MediaPlayerProvider` context component
- `useMediaPlayer()` hook for direct player access
- Automatic cleanup on component unmount
- Memoized control methods to prevent unnecessary re-renders

##### Vue Adapter
- `useMakeNoise()` composable with reactive refs
- `MediaPlayerPlugin` for global player instance
- Automatic cleanup on component unmount
- Full Vue 3 Composition API support

#### User Interface
- **Web Component**: `<make-noise-player>` custom element
- **Accessible**: Full ARIA support and keyboard navigation
- **Customizable**: CSS variables for easy theming
- **Responsive**: Works on all screen sizes
- **Features**:
  - Play/pause, next/previous controls
  - Seek bar with time display
  - Volume slider
  - Track information display (title, artist, artwork)

#### Developer Experience
- **TypeScript First**: Complete type definitions for all APIs
- **Zero Dependencies**: Core library has no external dependencies
- **Tree Shakeable**: ESM build with tree-shaking support
- **Multiple Formats**: ESM and UMD builds for maximum compatibility
- **Comprehensive Documentation**: Full API documentation and examples
- **Example Applications**: Vanilla JS, React, and Vue examples included

### 📦 Package Contents

- Core library (`makenoise`)
- React adapter (`makenoise/react`)
- Vue adapter (`makenoise/vue`)
- TypeScript declarations
- Web Component UI
- Example applications

### 🔧 Configuration Options

- `persistState`: Enable/disable localStorage persistence
- `persistenceKey`: Custom localStorage key
- `enableKeyboardShortcuts`: Enable/disable keyboard shortcuts
- `enableMediaSession`: Enable/disable Media Session API
- `initialVolume`: Set initial volume level
- `preloadStrategy`: Control audio preloading behavior

### 📊 Player State

Complete player state includes:
- Playback status (playing, paused, loading)
- Current track information
- Playback position and duration
- Volume and playback rate
- Repeat and shuffle modes
- Error information

### 🎯 Events

Comprehensive event system with 14 event types:
- `play`, `pause`, `ended`
- `timeupdate`, `durationchange`
- `volumechange`, `ratechange`
- `trackchange`, `playlistchange`
- `error`, `statechange`
- `loading`, `loadeddata`
- `seeking`, `seeked`

### 🧪 Testing

- Comprehensive unit test suite
- Property-based testing with fast-check
- Integration tests for framework adapters
- Example applications for manual testing

### 📚 Documentation

- Complete README with quick start guide
- Full API documentation
- TypeScript type definitions
- Example applications with detailed comments
- Inline JSDoc comments throughout codebase

### 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Requires:
- ES6+ JavaScript support
- HTMLAudioElement API
- Web Components (for optional UI)
- Media Session API (optional, gracefully degrades)
- localStorage (optional, gracefully degrades)

### 📝 Requirements Implemented

All 15 requirements from the specification have been fully implemented:

1. ✅ Core Player Initialization and Lifecycle
2. ✅ Audio Playback Control
3. ✅ Playlist Management
4. ✅ Playlist Modes and Behavior
5. ✅ Event System
6. ✅ State Persistence
7. ✅ Media Session API Integration
8. ✅ Keyboard Shortcuts
9. ✅ Default Web Component UI
10. ✅ Web Component Accessibility
11. ✅ React Framework Adapter
12. ✅ Vue Framework Adapter
13. ✅ Error Handling
14. ✅ State Query Methods
15. ✅ TypeScript Type Definitions

### 🎨 Design Patterns

- **Singleton Pattern**: Single global player instance
- **Observer Pattern**: Event-driven architecture
- **Strategy Pattern**: Pluggable repeat modes
- **Facade Pattern**: Simplified API over complex audio element

### 🔒 Security

- No external dependencies reduces attack surface
- Input validation on all public methods
- Safe localStorage handling with error recovery
- CORS-aware audio loading

### ⚡ Performance

- Lightweight core (~15KB minified + gzipped)
- Efficient event system with minimal overhead
- Debounced state persistence
- Optimized re-renders in framework adapters
- Tree-shakeable ESM build

### 📦 Installation

```bash
npm install makenoise
```

### 🚀 Quick Start

```typescript
import { MakeNoise } from 'makenoise';

const player = MakeNoise.getInstance();

player.addTrack({
  id: '1',
  src: '/audio/song.mp3',
  title: 'My Song',
  artist: 'Artist Name'
});

player.play();
```

### 🤝 Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.

### 📄 License

MIT License - see LICENSE file for details

---

## [Unreleased]

### Planned Features

Future releases may include:
- Angular adapter
- Svelte adapter
- Audio visualization support
- Equalizer controls
- Crossfade between tracks
- Gapless playback
- Audio effects (reverb, echo, etc.)
- Playlist import/export
- Cloud sync support
- Advanced keyboard shortcuts customization
- Multiple player instances support
- Audio streaming optimization
- Offline playback support
- Lyrics display support

### Known Issues

None at this time. Please report issues on GitHub.

---

## Version History

- **1.0.0** (2024-01-XX) - Initial stable release

---

## Upgrade Guide

### From Pre-release to 1.0.0

This is the first stable release. No migration needed.

---

## Breaking Changes

None - this is the initial release.

---

## Deprecations

None - this is the initial release.

---

## Security Updates

None - this is the initial release.

---

## Credits

### Core Team
- [Your Name] - Creator and Lead Developer

### Contributors
- Thank you to all contributors who helped test and provide feedback

### Special Thanks
- Inspired by the need for persistent audio in modern SPAs
- Built with TypeScript, Vite, and Vitest
- Property-based testing powered by fast-check

---

## Support

- 📧 Email: your.email@example.com
- 💬 Discord: [Join our community](https://discord.gg/yourinvite)
- 🐦 Twitter: [@yourusername](https://twitter.com/yourusername)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/makenoise/issues)
- 📖 Documentation: [Full Documentation](https://makenoise.dev)

---

*For detailed API documentation, see [API.md](./API.md)*

*For usage examples, see the `/examples` directory*
