<script setup lang="ts">
import EventLog from './components/EventLog.vue';
import NowPlaying from './components/NowPlaying.vue';
import Playlists from './components/Playlists.vue';
import QueueList from './components/QueueList.vue';
</script>

<template>
  <header class="bar">
    <div class="brand">MakeNoise <span>· Vue</span></div>
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
