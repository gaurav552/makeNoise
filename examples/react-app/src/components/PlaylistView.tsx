import { useMakeNoise } from '@makenoise/react';
import './PlaylistView.css';

function PlaylistView() {
  const { queue, state, play, removeFromQueue } = useMakeNoise();

  const handleTrackClick = (index: number) => {
    play(index);
  };

  const handleRemoveTrack = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromQueue(index);
  };

  return (
    <div className="playlist-view">
      {queue.map((track, index) => (
        <div
          key={track.id}
          className={`playlist-item ${
            state.currentQueueIndex === index ? 'active' : ''
          }`}
          onClick={() => handleTrackClick(index)}
        >
          <div className="playlist-item-number">{index + 1}</div>
          {track.artwork && (
            <img
              src={track.artwork}
              alt={`${track.title} artwork`}
              className="playlist-item-artwork"
            />
          )}
          <div className="playlist-item-info">
            <div className="playlist-item-title">{track.title}</div>
            {track.artist && (
              <div className="playlist-item-artist">{track.artist}</div>
            )}
          </div>
          {track.duration && (
            <div className="playlist-item-duration">
              {Math.floor(track.duration / 60)}:
              {Math.floor(track.duration % 60).toString().padStart(2, '0')}
            </div>
          )}
          <button
            className="btn btn-remove"
            onClick={(e) => handleRemoveTrack(index, e)}
            title="Remove from queue"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default PlaylistView;
