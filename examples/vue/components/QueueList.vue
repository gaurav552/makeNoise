<script setup lang="ts">
import { usePlayer, usePlayerState } from 'makenoise/vue';

const player = usePlayer();
// Selectors: these refs only change when the queue or the current index does.
const queue = usePlayerState((s) => s.queue);
const currentIndex = usePlayerState((s) => s.currentIndex);
</script>

<template>
  <section class="panel" aria-labelledby="queue-title">
    <h2 id="queue-title" class="panel-title">Queue <span>{{ queue.length }}</span></h2>
    <p v-if="!queue.length" class="empty">The queue is empty.</p>
    <ol v-else class="tracks queue">
      <li
        v-for="(item, index) in queue"
        :key="item.qid"
        class="track"
        :class="{ current: index === currentIndex, played: index < currentIndex }"
      >
        <button class="track-main" :aria-current="index === currentIndex ? 'true' : undefined" @click="player.jumpTo(item.qid)">
          <span class="t">{{ item.track.title ?? item.track.id }}</span>
          <span class="a">{{ item.track.artist }}</span>
        </button>
        <span class="track-actions">
          <button class="mini" :aria-label="`Remove ${item.track.title ?? item.track.id} from the queue`" @click="player.remove(item.qid)">
            Remove
          </button>
        </span>
      </li>
    </ol>
  </section>
</template>
