import { useMakeNoise } from '@makenoise/react';

function AboutPage() {
  const { state } = useMakeNoise();

  return (
    <div className="page about-page">
      <h2>About MakeNoise.js</h2>
      <p>
        MakeNoise is a framework-agnostic global media player library designed for
        Single Page Applications (SPAs). It provides persistent audio playback that
        survives route changes, comprehensive playlist management, and seamless
        integration with any frontend framework.
      </p>

      <div className="demo-section">
        <h3>Key Features</h3>
        <ul>
          <li><strong>Persistent Playback:</strong> Audio continues playing when you navigate between pages</li>
          <li><strong>State Persistence:</strong> Player state is saved to localStorage and restored on page reload</li>
          <li><strong>Framework Adapters:</strong> React hooks and Vue composables for easy integration</li>
          <li><strong>Keyboard Shortcuts:</strong> Control playback with Space, M, and Arrow keys</li>
          <li><strong>Media Session API:</strong> Native browser controls and notifications</li>
          <li><strong>Playlist Management:</strong> Add, remove, shuffle, and repeat tracks</li>
          <li><strong>Web Component UI:</strong> Optional default UI component with theme support</li>
          <li><strong>Light/Dark Mode:</strong> Seamless theme switching across the entire application</li>
        </ul>
      </div>

      <div className="demo-section">
        <h3>React Integration</h3>
        <p>
          This example uses the <code>useMakeNoise</code> hook and{' '}
          <code>MediaPlayerProvider</code> context to integrate the player into a React application.
        </p>
        <pre className="code-block">
{`import { useMakeNoise, MediaPlayerProvider } from '@makenoise/react';

function App() {
  return (
    <MediaPlayerProvider>
      <MyPlayerComponent />
    </MediaPlayerProvider>
  );
}

function MyPlayerComponent() {
  const { state, play, pause } = useMakeNoise();
  
  return (
    <button onClick={() => state.isPlaying ? pause() : play()}>
      {state.isPlaying ? 'Pause' : 'Play'}
    </button>
  );
}`}
        </pre>
      </div>

      <div className="info-box">
        <h3>Current Player State</h3>
        <div className="state-grid">
          <div className="state-item">
            <strong>Playing</strong>
            <span>{state.isPlaying ? 'Yes' : 'No'}</span>
          </div>
          <div className="state-item">
            <strong>Current Time</strong>
            <span>{state.currentTime.toFixed(2)}s</span>
          </div>
          <div className="state-item">
            <strong>Duration</strong>
            <span>{state.duration.toFixed(2)}s</span>
          </div>
          <div className="state-item">
            <strong>Volume</strong>
            <span>{(state.volume * 100).toFixed(0)}%</span>
          </div>
          <div className="state-item">
            <strong>Playback Rate</strong>
            <span>{state.playbackRate}x</span>
          </div>
          <div className="state-item">
            <strong>Repeat Mode</strong>
            <span>{state.repeatMode}</span>
          </div>
          <div className="state-item">
            <strong>Shuffle</strong>
            <span>{state.isShuffling ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>Try It Out</h3>
        <p>
          Navigate between pages and notice that the audio keeps playing!
          The player state persists across route changes, demonstrating the
          core value proposition of MakeNoise for SPAs.
        </p>
      </div>
    </div>
  );
}

export default AboutPage;
