import type { Player } from './player.js';
import type { Track } from './types.js';

/**
 * Connects the player to the OS media controls (lock screen, notification centre,
 * hardware media keys). No-op where the Media Session API is unavailable.
 * Returns a cleanup function.
 */
export function connectMediaSession<T extends Track>(player: Player<T>): () => void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return () => {};
  const session = navigator.mediaSession;

  const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
    ['play', () => player.play()],
    ['pause', () => player.pause()],
    ['stop', () => player.stop()],
    ['previoustrack', () => player.previous()],
    ['nexttrack', () => player.next()],
    ['seekbackward', (d) => player.seek(player.progress.get().currentTime - (d.seekOffset ?? 10))],
    ['seekforward', (d) => player.seek(player.progress.get().currentTime + (d.seekOffset ?? 10))],
    ['seekto', (d) => d.seekTime !== undefined && player.seek(d.seekTime)],
  ];
  for (const [action, handler] of actions) {
    try {
      session.setActionHandler(action, handler);
    } catch {
      // The browser doesn't support this action.
    }
  }

  const updatePosition = () => {
    const { currentTime, duration } = player.progress.get();
    if (!session.setPositionState || !(duration > 0)) return;
    try {
      session.setPositionState({
        duration,
        position: Math.min(currentTime, duration),
        playbackRate: player.state.get().rate,
      });
    } catch {
      // Invalid intermediate values while loading; the next update fixes it.
    }
  };

  let lastQid: string | null | undefined;
  const offState = player.state.subscribe((state) => {
    session.playbackState = state.status === 'playing' ? 'playing' : state.current ? 'paused' : 'none';
    const qid = state.current?.qid ?? null;
    if (qid === lastQid) return;
    lastQid = qid;
    const track = state.current?.track;
    session.metadata = track
      ? new MediaMetadata({
          title: track.title ?? '',
          artist: track.artist ?? '',
          album: track.album ?? '',
          artwork: track.artwork ? [{ src: track.artwork }] : [],
        })
      : null;
  });
  const offEvents = [player.on('play', updatePosition), player.on('pause', updatePosition), player.on('seek', updatePosition)];

  return () => {
    offState();
    offEvents.forEach((off) => off());
    for (const [action] of actions) {
      try {
        session.setActionHandler(action, null);
      } catch {
        // ignore
      }
    }
    session.metadata = null;
    session.playbackState = 'none';
  };
}
