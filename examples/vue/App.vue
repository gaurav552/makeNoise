<script setup lang="ts">
import EventLog from './components/EventLog.vue';
import NowPlaying from './components/NowPlaying.vue';
import Playlists from './components/Playlists.vue';
import QueueList from './components/QueueList.vue';

// Set when the example is built into the docs site.
const docsUrl = import.meta.env.VITE_SITE_BASE;
</script>

<template>
  <header class="bar">
    <div class="brand">MakeNoise <span>· Vue</span></div>
    <a v-if="docsUrl" class="link" :href="docsUrl">MakeNoise docs</a>
  </header>

  <div class="page">
    <aside class="library" aria-labelledby="library-title">
      <div class="library-head"><h2 id="library-title">Playlists</h2></div>
      <Playlists />
    </aside>

    <main class="stack">
      <NowPlaying />
      <QueueList />
      <EventLog />
    </main>
  </div>

  <!-- The custom element finds the same player on its own. -->
  <mn-player position="bottom-right"></mn-player>
</template>
