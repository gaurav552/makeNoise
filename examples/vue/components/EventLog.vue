<script setup lang="ts">
import { ref } from 'vue';
import type { QueueItem } from 'makenoise';
import { usePlayerEvent } from 'makenoise/vue';

interface Entry {
  id: number;
  time: string;
  name: string;
  detail: string;
}

const entries = ref<Entry[]>([]);
let nextId = 0;

function log(name: string, detail = '') {
  const time = new Date().toLocaleTimeString([], { hour12: false });
  entries.value = [{ id: nextId++, time, name, detail }, ...entries.value].slice(0, 8);
}

const title = (item: QueueItem | null) => item?.track.title ?? 'nothing';
// Each subscription ends when this component unmounts.
usePlayerEvent('trackchange', (current, previous) => log('trackchange', `${title(previous)} → ${title(current)}`));
usePlayerEvent('play', (item) => log('play', title(item)));
usePlayerEvent('pause', (item) => log('pause', title(item)));
usePlayerEvent('queueend', () => log('queueend'));
usePlayerEvent('error', (error) => log('error', `${title(error.item)}: ${error.message}`));
usePlayerEvent('blocked', () => log('blocked', 'autoplay blocked by the browser'));
</script>

<template>
  <section class="panel log" aria-labelledby="log-title">
    <h2 id="log-title" class="panel-title">Events</h2>
    <p v-if="!entries.length" class="empty">Nothing yet.</p>
    <ol v-else>
      <li v-for="entry in entries" :key="entry.id">
        <time>{{ entry.time }}</time> <b :class="`ev-${entry.name}`">{{ entry.name }}</b> {{ entry.detail }}
      </li>
    </ol>
  </section>
</template>
