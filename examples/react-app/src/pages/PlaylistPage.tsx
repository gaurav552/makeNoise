import { useMakeNoise } from '@makenoise/react';

function PlaylistPage() {
  const { queue, state, play, clearQueue } = useMakeNoise();

  const handlePlayTrack = (index: number) => {
    play(index);
  };

  const handleClearPlaylist = () => {
    if (window.confirm('Are you sure you want to clear the queue?')) {
      clearQueue();
    }
  };

  return (
    <div className="page playlist-page">
      <h2>My Playlist</h2>
      <p>
        Manage your playlist and control playback modes.
      </p>

      <div className="demo-section">
        <h3>Playback Modes</h3>
        <div className="mode-info">
          <div className="mode-item">
            <strong>Repeat:</strong> {state.repeatMode}
          </div>
          <div className="mode-item">
            <strong>Shuffle:</strong> {state.isShuffling ? 'On' : 'Off'}
          </div>
        </div>
      </div>

      <div className="section-header">
        <h3 className="section-title">All Tracks ({queue.length})</h3>
      </div>

      {queue.length === 0 ? (
        <p className="empty-state">
          No tracks in queue. Go to the Home page to load sample tracks.
        </p>
      ) : (
        <>
          <div className="track-list">
            {queue.map((track, index) => (
              <div 
                key={track.id}
                className={`track-item ${state.currentTrack?.id === track.id ? 'playing' : ''}`}
                onClick={() => handlePlayTrack(index)}
              >
                <span className="track-number">{index + 1}</span>
                <img src={track.artwork} alt={track.title} className="track-artwork" />
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.artist}</div>
                </div>
                <span className="track-duration">3:45</span>
              </div>
            ))}
          </div>

          <div className="controls">
            <button onClick={handleClearPlaylist} className="btn">
              🗑️ Clear Queue
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default PlaylistPage;
