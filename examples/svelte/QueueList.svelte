<script lang="ts">
  import { getPlayer, usePlayerState } from 'makenoise/svelte';

  const player = getPlayer();
  const playback = usePlayerState();
</script>

<section aria-labelledby="queue-title">
  <h2 id="queue-title" class="heading">Queue ({playback.current.queue.length})</h2>
  {#if playback.current.queue.length}
    <ol class="tracks">
      {#each playback.current.queue as item, i (item.qid)}
        {@const current = i === playback.current.currentIndex}
        <li class="track" class:current class:played={i < playback.current.currentIndex}>
          <button class="track-main" aria-current={current ? 'true' : undefined} onclick={() => player.jumpTo(item.qid)}>
            <span class="t">{item.track.title ?? item.track.id}</span>
            <span class="a">{item.track.artist ?? ''}</span>
          </button>
          <button class="mini" aria-label="Remove {item.track.title ?? item.track.id}" onclick={() => player.remove(item.qid)}>
            <span aria-hidden="true">✕</span>
          </button>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="empty">Nothing queued. Play a playlist, or add tracks with Next / Queue.</p>
  {/if}
</section>

<style>
  .track { border: 1px solid transparent; }
  .current { background: var(--surface); border-color: var(--accent); }
  .current .t { font-weight: 600; }
  .played { opacity: 0.6; }
</style>
