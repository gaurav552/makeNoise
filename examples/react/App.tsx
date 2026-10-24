import { EventLog } from './components/EventLog';
import { NowPlaying } from './components/NowPlaying';
import { Playlists } from './components/Playlists';
import { Queue } from './components/Queue';

export function App() {
  return (
    <>
      <header className="bar">
        <div className="brand">
          MakeNoise <span>· React</span>
        </div>
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
