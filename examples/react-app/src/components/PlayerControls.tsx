import { useMakeNoise } from '@makenoise/react';
import './PlayerControls.css';

function PlayerControls() {
  const {
    state,
    play,
    pause,
    previous,
    next,
    seek,
    setVolume,
    setPlaybackRate,
    setRepeatMode,
    toggleShuffle,
  } = useMakeNoise();

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setVolume(volume);
  };

  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rate = parseFloat(e.target.value);
    setPlaybackRate(rate);
  };

  const handleRepeatModeChange = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(state.repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="player-controls">
      {/* Playback Controls */}
      <div className="control-group playback-controls">
        <button
          onClick={previous}
          className="btn btn-control"
          disabled={!state.currentTrack}
          title="Previous Track"
        >
          ⏮️
        </button>
        <button
          onClick={() => (state.isPlaying ? pause() : play())}
          className="btn btn-control btn-play-pause"
          disabled={!state.currentTrack}
          title={state.isPlaying ? 'Pause' : 'Play'}
        >
          {state.isPlaying ? '⏸️' : '▶️'}
        </button>
        <button
          onClick={next}
          className="btn btn-control"
          disabled={!state.currentTrack}
          title="Next Track"
        >
          ⏭️
        </button>
      </div>

      {/* Seek Bar */}
      <div className="control-group seek-group">
        <span className="time-display">{formatTime(state.currentTime)}</span>
        <input
          type="range"
          min="0"
          max={state.duration || 0}
          value={state.currentTime}
          onChange={handleSeek}
          className="seek-bar"
          disabled={!state.currentTrack}
          aria-label="Seek"
        />
        <span className="time-display">{formatTime(state.duration)}</span>
      </div>

      {/* Volume Control */}
      <div className="control-group volume-group">
        <label htmlFor="volume">🔊 Volume:</label>
        <input
          id="volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          aria-label="Volume"
        />
        <span className="volume-display">{Math.round(state.volume * 100)}%</span>
      </div>

      {/* Playback Rate */}
      <div className="control-group rate-group">
        <label htmlFor="playback-rate">⚡ Speed:</label>
        <select
          id="playback-rate"
          value={state.playbackRate}
          onChange={handlePlaybackRateChange}
          className="rate-select"
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>

      {/* Playback Modes */}
      <div className="control-group mode-group">
        <button
          onClick={handleRepeatModeChange}
          className={`btn btn-mode ${state.repeatMode !== 'none' ? 'active' : ''}`}
          title={`Repeat: ${state.repeatMode}`}
        >
          {state.repeatMode === 'none' && '🔁'}
          {state.repeatMode === 'one' && '🔂'}
          {state.repeatMode === 'all' && '🔁'}
        </button>
        <button
          onClick={toggleShuffle}
          className={`btn btn-mode ${state.isShuffling ? 'active' : ''}`}
          title={`Shuffle: ${state.isShuffling ? 'On' : 'Off'}`}
        >
          🔀
        </button>
      </div>
    </div>
  );
}

export default PlayerControls;
