import { usePlayer } from 'makenoise/react';
import { playlists } from '../../vanilla/library';

/** The application's own playlists. The player only ever receives copies. */
export function Playlists() {
  const player = usePlayer();

  return (
    <aside className="library" aria-labelledby="library-title">
      <div className="library-head">
        <h2 id="library-title">Playlists</h2>
      </div>
      {playlists.map((playlist) => (
        <section key={playlist.id} className="playlist" aria-labelledby={`pl-${playlist.id}`}>
          <h3 id={`pl-${playlist.id}`}>{playlist.name}</h3>
          <p>{playlist.description}</p>
          <div className="playlist-actions">
            <button
              type="button"
              className="pill solid"
              aria-label={`Play ${playlist.name}`}
              onClick={() => player.play(playlist.tracks, { startIndex: 0, shuffle: false })}
            >
              Play
            </button>
            <button
              type="button"
              className="pill"
              aria-label={`Shuffle ${playlist.name}`}
              onClick={() => player.play(playlist.tracks, { shuffle: true })}
            >
              Shuffle
            </button>
          </div>
          <ol className="tracks">
            {playlist.tracks.map((track, index) => {
              const title = track.title ?? track.id;
              return (
                <li key={track.id} className="track">
                  <button
                    type="button"
                    className="track-main"
                    title="Play the playlist from here"
                    onClick={() => player.play(playlist.tracks, { startIndex: index })}
                  >
                    <span className="t">{title}</span>
                    <span className="a">{track.artist}</span>
                  </button>
                  <span className="track-actions">
                    <button type="button" className="mini" aria-label={`Play ${title} next`} onClick={() => player.playNext(track)}>
                      Next
                    </button>
                    <button type="button" className="mini" aria-label={`Add ${title} to the queue`} onClick={() => player.addToQueue(track)}>
                      Queue
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </aside>
  );
}
