// This file plays the part of the APPLICATION's data. The app owns its playlists;
// MakeNoise only ever receives copies of them.
import type { Track } from 'makenoise';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
}

function art(a: string, b: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="120" height="120" fill="url(#g)"/>
    <text x="12" y="106" font-family="system-ui,sans-serif" font-size="30" font-weight="700" fill="rgba(255,255,255,.85)">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const tone = (file: string, title: string, colors: [string, string], duration: number): Track => ({
  id: `tone-${file}`,
  src: `/audio/${file}.wav`,
  title,
  artist: 'The Test Tones',
  album: 'Tone Studies',
  artwork: art(colors[0], colors[1], title.slice(0, 2).toUpperCase()),
  duration,
});

const tones: Track[] = [
  tone('01-morning-arpeggio', 'Morning Arpeggio', ['#f6d365', '#fda085'], 14),
  tone('02-blue-hour', 'Blue Hour', ['#4facfe', '#2f3b8f'], 18),
  tone('03-pocket-change', 'Pocket Change', ['#43e97b', '#0f8b6c'], 11),
  tone('04-slow-tide', 'Slow Tide (Extended Night Version, Remastered with Field Recordings from the Harbour)', ['#30cfd0', '#330867'], 20),
  tone('05-paper-planes', 'Paper Planes', ['#fbc2eb', '#a6c1ee'], 12),
  tone('06-neon-rain', 'Neon Rain', ['#f093fb', '#5b247a'], 16),
  tone('07-tiny-victory', 'Tiny Victory', ['#fddb92', '#d1913c'], 10),
  tone('08-last-light', 'Last Light', ['#ff9a9e', '#6a3093'], 17),
];

const helix = (n: number, title: string, colors: [string, string]): Track => ({
  id: `helix-${n}`,
  src: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`,
  title,
  artist: 'SoundHelix',
  album: 'Generated Examples',
  artwork: art(colors[0], colors[1], `#${n}`),
});

export const playlists: Playlist[] = [
  {
    id: 'tones',
    name: 'Tone Studies',
    description: '8 short local tracks (10–20 s) — quick to test auto-advance, repeat and shuffle.',
    tracks: tones,
  },
  {
    id: 'helix',
    name: 'Real Music (streamed)',
    description: 'Full-length MP3s streamed from soundhelix.com. Needs internet.',
    tracks: [
      helix(1, 'SoundHelix Song 1', ['#667eea', '#764ba2']),
      helix(2, 'SoundHelix Song 2', ['#ff758c', '#ff7eb3']),
      helix(3, 'SoundHelix Song 3', ['#00c6fb', '#005bea']),
      helix(8, 'SoundHelix Song 8', ['#f77062', '#fe5196']),
    ],
  },
  {
    id: 'broken',
    name: 'Error Handling',
    description: 'Track 2 does not exist. The player should report it and skip to track 3.',
    tracks: [
      tones[6]!,
      { id: 'missing', src: '/audio/this-file-does-not-exist.mp3', title: 'Missing File', artist: 'Nobody', artwork: art('#555', '#222', '??') },
      tones[2]!,
    ],
  },
];
