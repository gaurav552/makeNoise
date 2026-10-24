<script lang="ts">
  import type { QueueItem } from 'makenoise';
  import { onPlayerEvent } from 'makenoise/svelte';

  interface Entry { id: number; time: string; name: string; detail: string }
  let entries = $state.raw<Entry[]>([]);
  let nextId = 0;

  function log(name: string, detail = '') {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    entries = [{ id: nextId++, time, name, detail }, ...entries].slice(0, 8);
  }
  const title = (item: QueueItem | null) => item?.track.title ?? 'nothing';

  // Each subscription ends automatically when this component is destroyed.
  onPlayerEvent('trackchange', (current, previous) => log('trackchange', `${title(previous)} → ${title(current)}`));
  onPlayerEvent('play', (item) => log('play', title(item)));
  onPlayerEvent('pause', (item) => log('pause', title(item)));
  onPlayerEvent('queueend', () => log('queueend'));
  onPlayerEvent('error', (error) => log('error', `${title(error.item)}: ${error.message}`));
  onPlayerEvent('blocked', () => log('blocked', 'autoplay blocked by the browser'));
</script>

<section class="log" aria-labelledby="log-title">
  <h2 id="log-title" class="heading">Event log</h2>
  {#if entries.length}
    <ol>
      {#each entries as entry (entry.id)}
        <li><time>{entry.time}</time> <b class="ev-{entry.name}">{entry.name}</b> {entry.detail}</li>
      {/each}
    </ol>
  {:else}
    <p class="empty">No events yet.</p>
  {/if}
</section>
