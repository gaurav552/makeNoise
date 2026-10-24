<script lang="ts">
  import { getPlayer } from 'makenoise/svelte';
  import { playlists } from '../vanilla/library';

  const player = getPlayer();
</script>

<h2 class="heading">Playlists</h2>
{#each playlists as playlist (playlist.id)}
  <section class="playlist" aria-labelledby="pl-{playlist.id}">
    <h3 id="pl-{playlist.id}">{playlist.name}</h3>
    <p>{playlist.description}</p>
    <div class="playlist-actions">
      <button class="pill solid" onclick={() => player.play(playlist.tracks, { startIndex: 0, shuffle: false })}>
        Play<span class="sr-only"> {playlist.name}</span>
      </button>
      <button class="pill" onclick={() => player.play(playlist.tracks, { shuffle: true })}>
        Shuffle<span class="sr-only"> {playlist.name}</span>
      </button>
    </div>
    <ol class="tracks">
      {#each playlist.tracks as track, index (track.id)}
        <li class="track">
          <button
            class="track-main"
            title="Play the playlist from here"
            onclick={() => player.play(playlist.tracks, { startIndex: index })}
          >
            <span class="t">{track.title ?? track.id}</span>
            <span class="a">{track.artist ?? ''}</span>
          </button>
          <span class="track-actions">
            <button class="mini" title="Play after the current track" onclick={() => player.playNext(track)}>
              Next<span class="sr-only">: {track.title}</span>
            </button>
            <button class="mini" title="Add to the end of the queue" onclick={() => player.addToQueue(track)}>
              Queue<span class="sr-only">: {track.title}</span>
            </button>
          </span>
        </li>
      {/each}
    </ol>
  </section>
{/each}
