import type { Track } from '@makenoise/core';
import './TrackInfo.css';

interface TrackInfoProps {
  track: Track | null;
}

function TrackInfo({ track }: TrackInfoProps) {
  if (!track) {
    return (
      <div className="track-info empty">
        <p>No track currently playing</p>
      </div>
    );
  }

  return (
    <div className="track-info">
      {track.artwork && (
        <img
          src={track.artwork}
          alt={`${track.title} artwork`}
          className="track-artwork"
        />
      )}
      <div className="track-details">
        <h3 className="track-title">{track.title}</h3>
        {track.artist && <p className="track-artist">{track.artist}</p>}
        {track.duration && (
          <p className="track-duration">
            Duration: {Math.floor(track.duration / 60)}:
            {Math.floor(track.duration % 60).toString().padStart(2, '0')}
          </p>
        )}
      </div>
    </div>
  );
}

export default TrackInfo;
