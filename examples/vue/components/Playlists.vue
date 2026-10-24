<script setup lang="ts">
import { usePlayer } from 'makenoise/vue';
import { playlists } from '../../vanilla/library';

const player = usePlayer();
</script>

<template>
  <section v-for="playlist in playlists" :key="playlist.id" class="playlist" :aria-labelledby="`pl-${playlist.id}`">
    <h3 :id="`pl-${playlist.id}`">{{ playlist.name }}</h3>
    <p>{{ playlist.description }}</p>
    <div class="playlist-actions">
      <button class="pill solid" @click="player.play(playlist.tracks, { startIndex: 0, shuffle: false })">Play</button>
      <button class="pill" @click="player.play(playlist.tracks, { shuffle: true })">Shuffle</button>
    </div>
    <ol class="tracks">
      <li v-for="(track, index) in playlist.tracks" :key="track.id" class="track">
        <button class="track-main" title="Play the playlist from here" @click="player.play(playlist.tracks, { startIndex: index })">
          <span class="t">{{ track.title ?? track.id }}</span>
          <span class="a">{{ track.artist }}</span>
        </button>
        <span class="track-actions">
          <button class="mini" :aria-label="`Play ${track.title} next`" @click="player.playNext(track)">Next</button>
          <button class="mini" :aria-label="`Add ${track.title} to the queue`" @click="player.addToQueue(track)">Queue</button>
        </span>
      </li>
    </ol>
  </section>
</template>
