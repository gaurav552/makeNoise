import { EventLog } from './components/EventLog';
import { NowPlaying } from './components/NowPlaying';
import { Playlists } from './components/Playlists';
import { Queue } from './components/Queue';

// Set when the example is built into the docs site.
const docsUrl = import.meta.env.VITE_SITE_BASE;

export function App() {
  return (
    <>
      <header className="bar">
        <div className="brand">
          MakeNoise <span>· React</span>
        </div>
        {docsUrl && (
          <a className="link" href={docsUrl}>
            MakeNoise docs
          </a>
        )}
      </header>

      <div className="page">
        <Playlists />
        <main className="stage">
          <NowPlaying />
          <Queue />
          <EventLog />
        </main>
      </div>

      {/* The custom element works alongside the hooks: same player, no wiring. */}
      <mn-player position="bottom-right" />
    </>
  );
}
