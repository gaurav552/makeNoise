<script lang="ts">
  import { setPlayer } from 'makenoise/svelte';
  import EventLog from './EventLog.svelte';
  import NowPlaying from './NowPlaying.svelte';
  import Playlists from './Playlists.svelte';
  import QueueList from './QueueList.svelte';
  import { player } from './player';

  // Optional here: without it, getPlayer() falls back to the first player created.
  setPlayer(player);

  // Set when the example is built into the docs site.
  const docsUrl = import.meta.env.VITE_SITE_BASE;
</script>

<header class="bar">
  <h1 class="brand">MakeNoise · Svelte <span>runes + makenoise/svelte</span></h1>
  <!-- The player is a plain Svelte store too, so $player works. -->
  <p class="count">{$player.queue.length} in queue</p>
  {#if docsUrl}<a class="link" href={docsUrl}>MakeNoise docs</a>{/if}
</header>

<div class="page">
  <aside class="library">
    <Playlists />
    <EventLog />
  </aside>
  <main class="stage">
    <NowPlaying />
    <QueueList />
  </main>
</div>

<!-- The custom element finds the same player by itself. -->
<mn-player position="bottom-right"></mn-player>

<style>
  h1 { margin: 0; font-size: 15px; }
  .count { margin: 0; font-size: 13px; color: var(--muted); }
  .stage { display: grid; gap: 32px; align-content: start; max-width: 640px; }
  :global(.heading) { margin: 0 0 12px; font-size: 13px; font-weight: 650; }
  :global(.empty) { margin: 0; font-size: 13px; color: var(--muted); }
  :global(.sr-only) {
    position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
</style>
