import { createPlayer } from 'makenoise';
import 'makenoise/elements'; // registers <mn-player>

// One player for the whole app, created outside any component so it outlives them.
export const player = createPlayer();
// Handy for poking at it from the browser console.
(window as unknown as { player: typeof player }).player = player;
