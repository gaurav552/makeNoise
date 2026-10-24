<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePlayer, useProgress } from 'makenoise/vue';

const player = usePlayer();
// The only component subscribed to progress, so only it updates several times a second.
const progress = useProgress();
// While dragging, the thumb follows the pointer; the seek happens once, on release.
const dragging = ref<number | null>(null);
const time = computed(() => dragging.value ?? progress.value.currentTime);

const valueOf = (event: Event) => (event.target as HTMLInputElement).valueAsNumber;
function commit(event: Event) {
  player.seek(valueOf(event));
  dragging.value = null;
}
const format = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
</script>

<template>
  <div class="seek">
    <span class="time">{{ format(time) }}</span>
    <input
      type="range"
      aria-label="Seek"
      min="0"
      step="0.1"
      :max="progress.duration || 0"
      :value="time"
      :disabled="!progress.duration"
      :aria-valuetext="`${format(time)} of ${format(progress.duration)}`"
      @input="dragging = valueOf($event)"
      @change="commit"
    />
    <span class="time">{{ format(progress.duration) }}</span>
  </div>
</template>
