<script setup lang="ts">
import { computed } from 'vue';
import { usePlayer, usePlayerState } from 'makenoise/vue';
import SeekBar from './SeekBar.vue';

const player = usePlayer();
// The state store only changes on discrete events. Progress lives in <SeekBar>,
// so this panel doesn't re-render several times a second.
const state = usePlayerState();
const track = computed(() => state.value.current?.track ?? null);

const labels = { idle: 'Nothing queued', loading: 'Loading…', playing: 'Playing', paused: 'Paused', ended: 'Reached the end of the queue' };
const status = computed(() => {
  const { blocked, error, status } = state.value;
  if (blocked) return 'Autoplay was blocked. Press play to start.';
  if (status === 'error') return `Error: ${error?.message ?? 'playback failed'}`;
  return labels[status];
});

const icons = {
  previous: 'M6 5h2v14H6zM20 5v14L9 12z',
  next: 'M16 5h2v14h-2zM4 5v14l11-7z',
  play: 'M7 4.5v15L19.5 12z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
};

const setVolume = (event: Event) => player.setVolume((event.target as HTMLInputElement).valueAsNumber);
</script>

<template>
  <section class="panel" aria-labelledby="now-title">
    <h2 id="now-title" class="panel-title">Now playing</h2>
    <div class="now-head">
      <img v-if="track?.artwork" class="art" :src="track.artwork" width="88" height="88" alt="" />
      <div v-else class="art" aria-hidden="true"></div>
      <div class="meta">
        <p class="title">{{ track?.title ?? 'Nothing playing' }}</p>
        <p class="artist">{{ track?.artist ?? 'Pick a playlist to start' }}</p>
        <p class="status" :class="{ bad: state.blocked || state.status === 'error' }" role="status">{{ status }}</p>
      </div>
    </div>

    <SeekBar />

    <div class="controls">
      <button class="icon" aria-label="Previous" :disabled="!state.current" @click="player.previous()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="icons.previous" /></svg>
      </button>
      <button class="icon big" :aria-label="state.playing ? 'Pause' : 'Play'" :disabled="!state.queue.length" @click="player.toggle()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="state.playing ? icons.pause : icons.play" /></svg>
      </button>
      <button class="icon" aria-label="Next" :disabled="!state.current" @click="player.next()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="icons.next" /></svg>
      </button>
      <span class="spacer"></span>
      <button class="pill" :aria-pressed="state.shuffle" @click="player.toggleShuffle()">Shuffle</button>
      <button class="pill" :class="{ on: state.repeat !== 'off' }" @click="player.cycleRepeat()">Repeat: {{ state.repeat }}</button>
    </div>

    <div class="volume">
      <button class="mini" :aria-pressed="state.muted" @click="player.toggleMute()">Mute</button>
      <label for="volume">Volume</label>
      <input
        id="volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="state.volume"
        :aria-valuetext="`${Math.round(state.volume * 100)}%`"
        @input="setVolume"
      />
    </div>
  </section>
</template>
