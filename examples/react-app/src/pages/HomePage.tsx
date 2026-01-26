import { useMakeNoise } from '@makenoise/react';
import { sampleTracks } from '../data/sampleTracks';

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function HomePage() {
  const { state, queue, addToQueue, play, playNext } = useMakeNoise();

  // Play a single track - adds after currently playing track and plays it
  const handlePlaySingleTrack = (track: typeof sampleTracks[0]) => {
    const currentIndex = state.currentQueueIndex;
    // If there's a currently playing track, insert after it. Otherwise, add to end.
    const insertIndex = currentIndex >= 0 ? currentIndex + 1 : queue.length;
    
    playNext(track); // This inserts after current track
    play(insertIndex); // Play the newly inserted track
  };

  // Play all tracks - adds all to queue and starts playing the first newly added track
  const handlePlayAll = () => {
    const startIndex = queue.length; // Remember where new tracks start
    addToQueue(sampleTracks);
    play(startIndex); // Start playing the first newly added track
  };

  return (
    <div className="page home-page">
      <h2>Discover Music</h2>
      
      <div className="section-header">
        <h3 className="section-title">Popular Albums</h3>
        <button onClick={handlePlayAll} className="btn btn-secondary">
          <svg style={{width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
            <polygon points="6 3 20 12 6 21 6 3"/>
          </svg>
          Play All
        </button>
      </div>
      
      <div className="album-grid">
        {sampleTracks.slice(0, 5).map((track) => (
          <div 
            key={track.id}
            className={`album-card ${state.currentTrack?.id === track.id ? 'active' : ''}`}
            onClick={() => handlePlaySingleTrack(track)}
          >
            <img src={track.artwork} alt={track.title} className="album-artwork" />
            <div className="album-title">{track.title}</div>
            <div className="album-artist">{track.artist}</div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <h3 className="section-title">Top Charts</h3>
      </div>
      
      <div className="track-list">
        {sampleTracks.slice(0, 3).map((track, index) => (
          <div 
            key={track.id}
            className={`track-item ${state.currentTrack?.id === track.id ? 'playing' : ''}`}
          >
            <span className="track-number">{index + 1}</span>
            <img src={track.artwork} alt={track.title} className="track-artwork" onClick={() => handlePlaySingleTrack(track)} />
            <div className="track-info" onClick={() => handlePlaySingleTrack(track)}>
              <div className="track-title">{track.title}</div>
              <div className="track-artist">{track.artist}</div>
            </div>
            <span className="track-duration">{formatTime(track.duration || 0)}</span>
            <div className="track-actions">
              <button 
                onClick={() => playNext(track)} 
                className="track-action-btn"
                title="Play Next"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>
                </svg>
              </button>
              <button 
                onClick={() => addToQueue(track)} 
                className="track-action-btn"
                title="Add to Queue"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="M12 5v14"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {queue.length > 0 && (
        <div className="info-box">
          <h3>Player State</h3>
          <div className="state-grid">
            <div className="state-item">
              <strong>Status</strong>
              <span>{state.isPlaying ? "Playing" : state.isPaused ? "Paused" : "Stopped"}</span>
            </div>
            <div className="state-item">
              <strong>Current Track</strong>
              <span>{state.currentTrack ? state.currentTrack.title : "None"}</span>
            </div>
            <div className="state-item">
              <strong>Queue</strong>
              <span>{queue.length} tracks</span>
            </div>
            <div className="state-item">
              <strong>Volume</strong>
              <span>{Math.round(state.volume * 100)}%</span>
            </div>
            <div className="state-item">
              <strong>Repeat Mode</strong>
              <span>{state.repeatMode}</span>
            </div>
            <div className="state-item">
              <strong>Shuffle</strong>
              <span>{state.isShuffling ? "On" : "Off"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
