# Shared Styles for MakeNoise Examples

## Overview

All three example applications (Vanilla SPA, React App, Vue App) now use a unified stylesheet to ensure complete visual consistency across all examples.

## File Structure

```
examples/
├── shared-styles.css          # ← Unified stylesheet for all examples
├── vanilla-spa/
│   └── index.html            # Links to ../shared-styles.css
├── react-app/
│   └── src/
│       ├── index.css         # Imports shared-styles.css
│       └── App.css           # React-specific overrides (if needed)
└── vue-app/
    └── src/
        ├── style.css         # Imports shared-styles.css
        └── App.vue           # Vue-specific overrides (if needed)
```

## How It Works

### Vanilla SPA
- Directly links to `../shared-styles.css` in the `<head>` section
- Any vanilla-specific styles can be added in the inline `<style>` tag

### React App
- `index.css` imports shared-styles.css using `@import url('../../shared-styles.css')`
- `App.css` is available for React-specific overrides
- Both files are imported in the component hierarchy

### Vue App
- `style.css` imports shared-styles.css using `@import url('../../shared-styles.css')`
- `App.vue` has a scoped `<style>` section for Vue-specific overrides
- Global styles are imported in `main.ts`

## Benefits

1. **Complete Consistency**: All three examples look identical
2. **Single Source of Truth**: Update styles in one place
3. **Easier Maintenance**: No need to sync styles across three files
4. **Consistent Scrollbars**: All examples use the same scrollbar styling
5. **Unified Theme System**: Dark/light mode works identically everywhere

## What's Included in Shared Styles

- CSS Reset and box-sizing
- CSS Custom Properties (CSS Variables) for theming
- Light and Dark mode color schemes
- Typography styles (headings, paragraphs, lists, code)
- Scrollbar styling (consistent across all examples)
- Dashboard layout (sidebar + main content)
- Navigation styles
- Album grid and track list styles
- Player container positioning
- Button and control styles
- Info boxes and state displays
- Keyboard shortcuts styling
- Responsive design breakpoints
- Utility classes

## Customization

If you need to add example-specific styles:

### Vanilla SPA
Add styles in the inline `<style>` tag after the shared-styles link

### React App
Add styles in `App.css` or create component-specific CSS files

### Vue App
Add styles in the `<style scoped>` section of components

## Theme System

The shared stylesheet includes a complete theme system with CSS custom properties:

- Light mode: Blue accent (#667eea)
- Dark mode: Pink accent (#ff5e7e)
- Automatic dark mode detection via `prefers-color-scheme`
- Manual theme toggle via `data-theme` attribute on `<html>`

## Scrollbar Consistency

All examples now use identical scrollbar styling:
- Width: 8px
- Track: Uses sidebar background color
- Thumb: Uses border color with 4px border-radius
- Hover: Uses secondary text color

This ensures the scrollbar looks the same in Vanilla, React, and Vue examples.
