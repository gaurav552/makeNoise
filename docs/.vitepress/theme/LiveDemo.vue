<script setup lang="ts">
// Client-only: wrap it in <ClientOnly>. The library is imported in onMounted so
// nothing audio-related runs during the static build.
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { Player, PlayerState, Track } from 'makenoise';

const player = shallowRef<Player | null>(null);
const tracks = shallowRef<Track[]>([]);
const status = ref<PlayerState['status']>('idle');
const title = ref<string | undefined>();
let unsubscribe: (() => void) | undefined;

onMounted(async () => {
  const [{ createPlayer }, , { playlists }] = await Promise.all([
    import('makenoise'),
    import('makenoise/elements'), // registers <mn-player>
    import('../../../examples/vanilla/library'),
  ]);
  tracks.value = playlists.find((playlist) => playlist.id === 'helix')?.tracks ?? [];
  const created = createPlayer();
  player.value = created;
  unsubscribe = created.subscribe((state) => {
    status.value = state.status;
    title.value = state.current?.track.title;
  });
});

onBeforeUnmount(() => {
  unsubscribe?.();
  // Leaving the page removes <mn-player>, so stop the audio with it.
  player.value?.destroy();
});

function playSample() {
  player.value?.play(tracks.value);
}
</script>

<template>
  <div class="mn-demo">
    <button class="mn-demo-button" type="button" :disabled="!player" @click="playSample">
      Play sample playlist
    </button>
    <p class="mn-demo-status">
      <template v-if="title">{{ status }}: {{ title }}</template>
      <template v-else>Four full-length MP3s streamed from soundhelix.com. The player appears in the bottom-left corner.</template>
    </p>
    <mn-player always-visible></mn-player>
  </div>
</template>

<style scoped>
.mn-demo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin: 16px 0;
  padding: 16px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.mn-demo-button {
  padding: 8px 18px;
  border-radius: 20px;
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  font-weight: 600;
  font-size: 14px;
}
.mn-demo-button:hover:not(:disabled) {
  background: var(--vp-button-brand-hover-bg);
}
.mn-demo-button:disabled {
  opacity: 0.6;
}
.mn-demo-status {
  margin: 0;
  flex: 1 1 240px;
  color: var(--vp-c-text-2);
  font-size: 14px;
}
</style>
