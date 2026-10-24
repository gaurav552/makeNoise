<script lang="ts">
  import type { Player } from '../../src/player';
  import { setPlayer } from '../../src/svelte';
  import Probe from './Probe.svelte';

  let { player }: { player: Player } = $props();
  // svelte-ignore state_referenced_locally
  setPlayer(player);
</script>

<Probe />
