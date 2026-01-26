# Vue Example Implementation Notes

## Overview

This Vue example demonstrates the complete integration of MakeNoise.js with Vue 3, showcasing:
- Vue 3 Composition API with `<script setup>`
- Reactive state management via composables
- Vue Router for SPA navigation
- TypeScript for type safety
- Custom UI components

## Architecture

### Plugin Installation

The `MediaPlayerPlugin` is installed in `main.ts`:

```typescript
import { MediaPlayerPlugin } from '@makenoise/vue';

app.use(MediaPlayerPlugin);
```

This makes the player instance globally available via:
- `app.config.globalProperties.$player`
- `inject('player')` in components

### Composable Usage

The `useMakeNoise` composable provides reactive access to player state:

```typescript
const { state, playlist, play, pause, ... } = useMakeNoise();
```

**Key Features:**
- Returns reactive `Ref` objects that auto-update
- Automatically subscribes to player events on mount
- Automatically unsubscribes on unmount
- Provides all player control methods

## Component Structure

### PlayerControls.vue

**Purpose**: Main playback control interface

**Features:**
- Play/pause toggle
- Previous/next track navigation
- Seek bar with time display
- Volume control
- Shuffle and repeat mode toggles
- Playback rate selector

**Implementation Notes:**
- Uses computed properties for dynamic UI (repeat icon)
- Event handlers for user interactions
- Disabled states when playlist is empty
- Responsive design with mobile breakpoints

### TrackInfo.vue

**Purpose**: Display current track information

**Features:**
- Track artwork (or placeholder)
- Track title and artist
- Empty state when no track is playing

**Implementation Notes:**
- Accepts `track` prop (can be null)
- Conditional rendering for artwork
- Responsive layout (stacks on mobile)

### PlaylistView.vue

**Purpose**: Display and manage playlist

**Features:**
- List of all tracks in playlist
- Click to play track
- Remove track button
- Visual indicator for current track
- Playing indicator (▶️) for active track

**Implementation Notes:**
- Uses `v-for` to render track list
- Click handlers for play and remove
- Active state styling for current track
- Hover effects for better UX

## Pages

### HomePage.vue

**Purpose**: Landing page with quick start

**Features:**
- Current track display
- Player controls
- Load sample playlist button
- Feature list
- Playlist status

### PlaylistPage.vue

**Purpose**: Playlist management interface

**Features:**
- Full playlist view
- Player controls
- Playback mode display
- Empty state message

### AboutPage.vue

**Purpose**: Documentation and information

**Features:**
- Feature overview
- Vue integration details
- Keyboard shortcuts reference
- Live player state display (JSON)

## Routing

Vue Router is configured with three routes:
- `/` - HomePage
- `/playlist` - PlaylistPage
- `/about` - AboutPage

**Key Point**: The player instance persists across all route changes, demonstrating the core value proposition of MakeNoise.js.

## Styling

### Approach

- Scoped styles in each component
- Global styles in `style.css`
- CSS custom properties for theming
- Gradient backgrounds for visual appeal
- Responsive design with media queries

### Color Scheme

- Primary: `#667eea` to `#764ba2` (gradient)
- Background: `#f9f9f9`
- Text: `#333` (dark), `#666` (medium), `#999` (light)
- White cards with subtle shadows

### Animations

- Fade-in animation for page transitions
- Hover effects on buttons and playlist items
- Transform effects for interactive elements

## TypeScript Integration

### Type Imports

```typescript
import type { Track } from '@makenoise/core';
import type { UseMakeNoiseReturn } from '@makenoise/vue';
```

### Type Safety

- All component props are typed
- Event handlers have proper types
- Composable return values are fully typed
- Sample data uses Track interface

## Development Workflow

### Local Development

The `vite.config.ts` uses path aliases to link to the local MakeNoise source:

```typescript
resolve: {
  alias: {
    '@makenoise/core': path.resolve(__dirname, '../../src/index.ts'),
    '@makenoise/vue': path.resolve(__dirname, '../../src/adapters/vue/index.ts'),
  },
}
```

This allows testing changes to the library without publishing.

### Web Component Registration

The `<make-noise-player>` custom element is registered in Vite config:

```typescript
vue({
  template: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'make-noise-player'
    }
  }
})
```

This prevents Vue from treating it as a Vue component.

## Best Practices Demonstrated

1. **Composition API**: Modern Vue 3 patterns with `<script setup>`
2. **Reactive State**: Proper use of `ref` and `computed`
3. **Lifecycle Management**: Automatic cleanup via composable
4. **Type Safety**: Full TypeScript integration
5. **Component Composition**: Reusable, focused components
6. **Accessibility**: Semantic HTML and ARIA attributes
7. **Responsive Design**: Mobile-first approach
8. **User Experience**: Loading states, empty states, hover effects

## Testing Considerations

When testing this example:

1. **Route Persistence**: Navigate between pages while playing audio
2. **State Persistence**: Refresh the page and verify state restoration
3. **Playlist Management**: Add, remove, reorder tracks
4. **Playback Modes**: Test shuffle and repeat modes
5. **Keyboard Shortcuts**: Verify all shortcuts work
6. **Media Session**: Test OS media controls (if available)
7. **Responsive Design**: Test on different screen sizes
8. **Error Handling**: Test with invalid audio URLs

## Future Enhancements

Potential improvements for this example:

- Drag-and-drop playlist reordering
- Search/filter functionality
- Playlist save/load from localStorage
- Visualizer or waveform display
- Lyrics display
- Queue management (separate from playlist)
- Dark mode toggle
- Custom theme builder
- Equalizer controls
- Crossfade between tracks

## Requirements Validation

This example validates the following requirements:

- **12.1**: ✅ useMakeNoise composable returns reactive state and control methods
- **12.2**: ✅ Composable subscribes to events and updates Vue reactive state
- **12.3**: ✅ Composable unsubscribes on component unmount
- **12.4**: ✅ MediaPlayerPlugin provides global player instance
- **12.5**: ✅ Plugin makes player available via app.config.globalProperties

All Vue adapter requirements are fully demonstrated in this example.
