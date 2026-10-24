<script lang="ts">
  import { getPlayer, usePlayerState, useProgress } from 'makenoise/svelte';

  const player = getPlayer();
  const playback = usePlayerState(); // playback.current: changes on discrete events only
  const progress = useProgress(); // progress.current: ~4×/s while playing

  const track = $derived(playback.current.current?.track);
  let scrub = $state<number | null>(null); // seek bar position while the user drags it
  const time = $derived(scrub ?? progress.current.currentTime);
  const duration = $derived(progress.current.duration || track?.duration || 0);

  const status = $derived.by(() => {
    const { blocked, error, status } = playback.current;
    if (blocked) return 'Autoplay was blocked by the browser. Press play to start.';
    if (error) return `Couldn't play "${error.item?.track.title ?? 'a track'}": ${error.message}`;
    return status;
  });

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
</script>

{#snippet icon(d: string)}
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {d} fill="currentColor" /></svg>
{/snippet}

<section class="card" aria-labelledby="now-title">
  <h2 id="now-title" class="heading">Now playing</h2>
  <div class="meta">
    {#if track?.artwork}
      <img src={track.artwork} alt="" width="88" height="88" />
    {:else}
      <div class="art" aria-hidden="true"></div>
    {/if}
    <div>
      <p class="title">{track?.title ?? 'Nothing playing'}</p>
      <p class="artist">{track?.artist ?? 'Pick a playlist to start.'}</p>
    </div>
  </div>

  <div class="seek">
    <span>{fmt(time)}</span>
    <input
      type="range"
      aria-label="Seek"
      aria-valuetext="{fmt(time)} of {fmt(duration)}"
      min="0"
      max={duration}
      step="0.1"
      value={time}
      disabled={!track}
      oninput={(e) => (scrub = e.currentTarget.valueAsNumber)}
      onchange={(e) => {
        player.seek(e.currentTarget.valueAsNumber);
        scrub = null;
      }}
    />
    <span>{fmt(duration)}</span>
  </div>

  <div class="controls">
    <button class="icon" aria-label="Previous" onclick={() => player.previous()}>
      {@render icon('M6 5h2v14H6zM20 5v14L9 12z')}
    </button>
    <button class="icon play" aria-label={playback.current.playing ? 'Pause' : 'Play'} onclick={() => player.toggle()}>
      {@render icon(playback.current.playing ? 'M6 5h4v14H6zM14 5h4v14h-4z' : 'M7 5v14l12-7z')}
    </button>
    <button class="icon" aria-label="Next" onclick={() => player.next()}>
      {@render icon('M16 5h2v14h-2zM4 5v14l11-7z')}
    </button>
    <button class="pill" aria-pressed={playback.current.shuffle} onclick={() => player.toggleShuffle()}>Shuffle</button>
    <button class="pill" aria-pressed={playback.current.repeat !== 'off'} onclick={() => player.cycleRepeat()}>
      Repeat: {playback.current.repeat}
    </button>
  </div>

  <div class="volume">
    <label>
      Volume
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={playback.current.volume}
        oninput={(e) => player.setVolume(e.currentTarget.valueAsNumber)}
      />
    </label>
    <button class="mini" aria-pressed={playback.current.muted} onclick={() => player.toggleMute()}>Mute</button>
  </div>

  <p class="status" class:bad={playback.current.blocked || !!playback.current.error} role="status">{status}</p>
</section>

<style>
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 20px; }
  .meta { display: flex; gap: 16px; align-items: center; }
  .meta img, .art { width: 88px; height: 88px; border-radius: 10px; flex: none; }
  .art { background: var(--bg); border: 1px dashed var(--line); }
  .title { margin: 0; font-size: 18px; font-weight: 600; line-height: 1.3; }
  .artist { margin: 2px 0 0; color: var(--muted); font-size: 14px; }
  .seek { display: flex; align-items: center; gap: 10px; margin: 18px 0 10px; font: 12px ui-monospace, monospace; color: var(--muted); }
  .seek input { flex: 1; }
  input[type='range'] { accent-color: var(--accent); }
  .controls, .volume { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--line); background: var(--surface); }
  .icon:hover { border-color: var(--muted); }
  .icon.play { width: 48px; height: 48px; background: var(--text); color: var(--bg); border-color: var(--text); }
  .pill[aria-pressed='true'], .mini[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); color: #fff; }
  .volume { margin-top: 12px; font-size: 13px; color: var(--muted); }
  .volume label { display: flex; align-items: center; gap: 8px; }
  .status { margin: 14px 0 0; font-size: 13px; color: var(--muted); }
  .status.bad { color: #c2413b; }
</style>
