// Generates short synthesized test tracks (WAV) for the example app, so it works offline.
// Usage: node scripts/generate-tones.mjs [--force]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples', 'vanilla', 'public', 'audio');
const force = process.argv.includes('--force');
const RATE = 22050;

// name, seconds, bpm, root (MIDI), chord progression (semitone offsets from root), brightness
const TRACKS = [
  ['01-morning-arpeggio', 14, 112, 60, [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [0, 4, 7, 12]], 0.3],
  ['02-blue-hour', 18, 84, 57, [[0, 3, 7, 10], [5, 8, 12, 15], [3, 7, 10, 14], [7, 10, 14, 17]], 0.15],
  ['03-pocket-change', 11, 132, 62, [[0, 4, 7, 11], [2, 5, 9, 12], [4, 7, 11, 14], [5, 9, 12, 16]], 0.45],
  ['04-slow-tide', 20, 70, 53, [[0, 7, 12, 16], [-2, 5, 10, 14], [-4, 3, 8, 12], [-5, 2, 7, 11]], 0.1],
  ['05-paper-planes', 12, 120, 64, [[0, 4, 7, 12], [-3, 0, 4, 9], [-7, -3, 0, 5], [-5, -1, 2, 7]], 0.35],
  ['06-neon-rain', 16, 100, 58, [[0, 3, 7, 12], [-4, 0, 3, 8], [-2, 2, 5, 10], [-5, -2, 2, 7]], 0.5],
  ['07-tiny-victory', 10, 140, 67, [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [12, 16, 19, 24]], 0.4],
  ['08-last-light', 17, 76, 55, [[0, 4, 7, 11], [-3, 0, 4, 7], [2, 5, 9, 12], [-5, -1, 2, 7]], 0.2],
];

mkdirSync(out, { recursive: true });
let written = 0;
for (const [name, seconds, bpm, root, chords, brightness] of TRACKS) {
  const file = join(out, `${name}.wav`);
  if (!force && existsSync(file)) continue;
  writeFileSync(file, wav(render(seconds, bpm, root, chords, brightness)));
  written++;
}
console.log(written ? `Generated ${written} test tracks in ${out}` : 'Test tracks already exist (use --force to regenerate).');

function render(seconds, bpm, root, chords, brightness) {
  const samples = new Float32Array(seconds * RATE);
  const step = 60 / bpm / 2; // eighth notes
  const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);
  const steps = Math.floor(seconds / step);

  for (let s = 0; s < steps; s++) {
    const chord = chords[Math.floor(s / 8) % chords.length];
    const pattern = [0, 1, 2, 3, 2, 1, 3, 2];
    const note = root + chord[pattern[s % 8]];
    addNote(samples, s * step, step * 1.8, freq(note), 0.22, brightness);
    if (s % 8 === 0) addNote(samples, s * step, step * 7.5, freq(root + chord[0] - 24), 0.28, 0.05);
  }

  // Fade in/out and normalize.
  const fade = 0.4 * RATE;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const gain = Math.min(1, i / fade, (samples.length - i) / fade);
    samples[i] *= gain;
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] / peak) * 0.8;
  return samples;
}

function addNote(samples, start, length, hz, gain, brightness) {
  const from = Math.floor(start * RATE);
  const to = Math.min(samples.length, Math.floor((start + length) * RATE));
  for (let i = from; i < to; i++) {
    const t = (i - from) / RATE;
    const env = Math.min(1, t / 0.008) * Math.exp(-t * (3 / length));
    const phase = 2 * Math.PI * hz * t;
    const tone = Math.sin(phase) + brightness * Math.sin(2 * phase) + brightness * 0.5 * Math.sin(3 * phase);
    samples[i] += tone * env * gain;
  }
}

function wav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  return buffer;
}
