import { usePlayer, usePlayerState, useProgress } from 'makenoise/react';

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Built only from the binding hooks. Each part selects just what it shows, so the
 * progress ticks (several per second) re-render the seek bar and nothing else.
 */
export function NowPlaying() {
  const current = usePlayerState((s) => s.current);
  const track = current?.track;

  return (
    <section className="card now" aria-labelledby="now-title">
      <h2 id="now-title" className="section-title">Now playing</h2>
      <div className="now-head">
        {track?.artwork ? (
          <img className="cover" src={track.artwork} alt="" width={96} height={96} />
        ) : (
          <div className="cover" aria-hidden="true" />
        )}
        <div className="now-text">
          <p className="now-title">{track ? (track.title ?? track.id) : 'Nothing queued'}</p>
          <p className="now-artist">{track ? track.artist : 'Pick a playlist to start'}</p>
          <Status />
        </div>
      </div>
      <SeekBar />
      <div className="controls">
        <Transport />
        <Modes />
        <Volume />
      </div>
    </section>
  );
}

function Status() {
  const status = usePlayerState((s) => s.status);
  const blocked = usePlayerState((s) => s.blocked);
  const error = usePlayerState((s) => s.error);

  return (
    <p className="status" role="status">
      <span className={`badge ${status}`}>{status}</span>
      {blocked && <span className="warn">Autoplay was blocked. Press play to start.</span>}
      {error && (
        <span className="warn">
          {error.item?.track.title ?? 'A track'}: {error.message}
        </span>
      )}
    </p>
  );
}

function Transport() {
  const player = usePlayer();
  // `playing` is the intent to play (true while loading too): what the button should show.
  const playing = usePlayerState((s) => s.playing);
  const empty = usePlayerState((s) => s.queue.length === 0);

  return (
    <div className="group" role="group" aria-label="Playback">
      <button type="button" className="icon" aria-label="Previous" disabled={empty} onClick={() => player.previous()}>
        ⏮
      </button>
      <button type="button" className="icon main" aria-label={playing ? 'Pause' : 'Play'} disabled={empty} onClick={() => player.toggle()}>
        {playing ? '⏸' : '▶'}
      </button>
      <button type="button" className="icon" aria-label="Next" disabled={empty} onClick={() => player.next()}>
        ⏭
      </button>
    </div>
  );
}

function SeekBar() {
  const player = usePlayer();
  const time = useProgress((p) => p.currentTime);
  const duration = useProgress((p) => p.duration);

  return (
    <div className="seek">
      <span className="time">{formatTime(time)}</span>
      <input
        type="range"
        aria-label="Seek"
        aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
        min={0}
        max={duration || 1}
        step={0.1}
        value={Math.min(time, duration)}
        disabled={!duration}
        onChange={(e) => player.seek(e.currentTarget.valueAsNumber)}
      />
      <span className="time">{formatTime(duration)}</span>
    </div>
  );
}

function Modes() {
  const player = usePlayer();
  const shuffle = usePlayerState((s) => s.shuffle);
  const repeat = usePlayerState((s) => s.repeat);

  return (
    <div className="group" role="group" aria-label="Play order">
      <button type="button" className="pill" aria-pressed={shuffle} onClick={() => player.toggleShuffle()}>
        Shuffle
      </button>
      <button type="button" className="pill" aria-pressed={repeat !== 'off'} onClick={() => player.cycleRepeat()}>
        Repeat: {repeat}
      </button>
    </div>
  );
}

function Volume() {
  const player = usePlayer();
  const volume = usePlayerState((s) => s.volume);
  const muted = usePlayerState((s) => s.muted);

  return (
    <div className="group">
      <button type="button" className="icon" aria-label="Mute" aria-pressed={muted} onClick={() => player.toggleMute()}>
        {muted || volume === 0 ? '🔇' : '🔊'}
      </button>
      <input
        type="range"
        aria-label="Volume"
        aria-valuetext={`${Math.round(volume * 100)}%`}
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => player.setVolume(e.currentTarget.valueAsNumber)}
      />
    </div>
  );
}
