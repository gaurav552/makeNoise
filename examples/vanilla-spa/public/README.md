# Sample Audio Files

This directory should contain sample audio files for the demo application.

## Adding Your Own Audio Files

To use this example with real audio, add MP3 files to this directory:

```
public/
├── sample1.mp3
├── sample2.mp3
├── sample3.mp3
├── sample4.mp3
└── sample5.mp3
```

## Alternative: Use Online Audio URLs

Instead of local files, you can modify `app.js` to use online audio URLs:

```javascript
const sampleTracks = [
  {
    id: '1',
    src: 'https://example.com/audio/track1.mp3',
    title: 'Track Title',
    artist: 'Artist Name',
    artwork: 'https://example.com/artwork.jpg'
  },
  // ... more tracks
];
```

## Free Audio Resources

Here are some sources for free, legal audio files for testing:

- **Free Music Archive**: https://freemusicarchive.org/
- **Incompetech**: https://incompetech.com/music/royalty-free/
- **Bensound**: https://www.bensound.com/
- **YouTube Audio Library**: https://www.youtube.com/audiolibrary

## Note

Make sure you have the rights to use any audio files you add to this directory.
The example application is for demonstration purposes only.

## Placeholder Files

If you don't have audio files, the player will still work but won't produce sound.
You can test all the UI features and state management without actual audio.
