<script lang="ts">
  import { onPlayerEvent, usePlayerState, useProgress } from '../../src/svelte';

  let { onplay }: { onplay?: () => void } = $props();

  const playback = usePlayerState();
  const progress = useProgress();
  onPlayerEvent('play', () => onplay?.());
</script>

<p>{playback.current.status}|{playback.current.current?.track.title ?? '-'}|{progress.current.currentTime}</p>
