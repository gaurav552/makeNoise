// Import MakeNoise from the built library
// In a real application, you would import from 'makenoise' package
import { MakeNoise } from "../../dist/makenoise.js";

// Theme Management
const ThemeManager = {
  init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
    
    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn?.addEventListener('click', () => this.toggleTheme());
  },
  
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateIcon(theme);
  },
  
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  },
  
  updateIcon(theme) {
    const moonIcon = document.getElementById('theme-icon-moon');
    const sunIcon = document.getElementById('theme-icon-sun');
    if (moonIcon && sunIcon) {
      if (theme === 'light') {
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
      } else {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
      }
    }
  }
};

// Helper function to format time in MM:SS
const formatTime = (seconds) => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Sample tracks with online audio URLs (using free SoundHelix samples)
// Note: Replace these with your own audio files by placing MP3 files in ./public/
const sampleTracks = [
  {
    id: "1",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    title: "Summer Breeze",
    artist: "The Ambient Collective",
    artwork: "https://picsum.photos/seed/track1/300/300",
    duration: 348,
  },
  {
    id: "2",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    title: "Digital Dreams",
    artist: "Synthwave Studios",
    artwork: "https://picsum.photos/seed/track2/300/300",
    duration: 302,
  },
  {
    id: "3",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    title: "Midnight Jazz",
    artist: "The Blue Notes",
    artwork: "https://picsum.photos/seed/track3/300/300",
    duration: 325,
  },
  {
    id: "4",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    title: "Ocean Waves",
    artist: "Nature Sounds",
    artwork: "https://picsum.photos/seed/track4/300/300",
    duration: 356,
  },
  {
    id: "5",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    title: "Electric Pulse",
    artist: "Techno Masters",
    artwork: "https://picsum.photos/seed/track5/300/300",
    duration: 412,
  },
];

// Initialize the global player instance
const player = MakeNoise.getInstance();

// Initialize sample tracks if queue is empty
// Since MakeNoise persists the queue, we prevent adding duplicates on every refresh
if (player.getQueue().length === 0) {
  player.addToQueue(sampleTracks);
}

// Simple SPA routing
const routes = {
  home: () => {
    const state = player.getState();

    return `
      <h2>Discover Music</h2>
      
      <div class="section-header">
        <h3 class="section-title">Popular Albums</h3>
        <button onclick="window.app.playAll()" class="btn btn-secondary">
          <svg style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
            <polygon points="6 3 20 12 6 21 6 3"/>
          </svg>
          Play All
        </button>
      </div>
      
      <div class="album-grid">
        ${sampleTracks.slice(0, 5).map((track) => `
          <div class="album-card ${state.currentTrack?.id === track.id ? 'active' : ''}" 
               onclick="window.app.playSingleTrack('${track.id}')">
            <img src="${track.artwork}" alt="${track.title}" class="album-artwork">
            <div class="album-title">${track.title}</div>
            <div class="album-artist">${track.artist}</div>
          </div>
        `).join('')}
      </div>

      <div class="section-header">
        <h3 class="section-title">Top Charts</h3>
      </div>
      
      <div class="track-list">
        ${sampleTracks.slice(0, 3).map((track, index) => `
          <div class="track-item ${state.currentTrack?.id === track.id ? 'playing' : ''}">
            <span class="track-number">${index + 1}</span>
            <img src="${track.artwork}" alt="${track.title}" class="track-artwork" onclick="window.app.playSingleTrack('${track.id}')">
            <div class="track-info" onclick="window.app.playSingleTrack('${track.id}')">
              <div class="track-title">${track.title}</div>
              <div class="track-artist">${track.artist}</div>
            </div>
            <span class="track-duration">${formatTime(track.duration || 0)}</span>
            <div class="track-actions">
              <button 
                onclick="window.app.playNextTrack('${track.id}'); event.stopPropagation();" 
                class="track-action-btn"
                title="Play Next"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>
                </svg>
              </button>
              <button 
                onclick="window.app.addTrackToQueue('${track.id}'); event.stopPropagation();" 
                class="track-action-btn"
                title="Add to Queue"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"/><path d="M12 5v14"/>
                </svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      ${player.getQueue().length > 0 ? `
        <div class="info-box">
          <h3>Player State</h3>
          <div class="state-grid">
            <div class="state-item">
              <strong>Status</strong>
              <span>${state.isPlaying ? "Playing" : state.isPaused ? "Paused" : "Stopped"}</span>
            </div>
            <div class="state-item">
              <strong>Current Track</strong>
              <span>${state.currentTrack ? state.currentTrack.title : "None"}</span>
            </div>
            <div class="state-item">
              <strong>Queue</strong>
              <span>${player.getQueue().length} tracks</span>
            </div>
            <div class="state-item">
              <strong>Volume</strong>
              <span>${Math.round(state.volume * 100)}%</span>
            </div>
            <div class="state-item">
              <strong>Repeat Mode</strong>
              <span>${state.repeatMode}</span>
            </div>
            <div class="state-item">
              <strong>Shuffle</strong>
              <span>${state.isShuffling ? "On" : "Off"}</span>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  },

  playlist: () => {
    const currentTrack = player.getState().currentTrack;
    const queue = player.getQueue();

    return `
      <h2>My Playlist</h2>
      
      <div class="section-header">
        <h3 class="section-title">All Tracks (${queue.length})</h3>
      </div>
      
      <div class="track-list">
        ${queue
          .map(
            (track, index) => `
          <div class="track-item ${
            currentTrack?.id === track.id ? "playing" : ""
          }" 
               onclick="window.app.playTrack(${index})">
            <span class="track-number">${index + 1}</span>
            <img src="${track.artwork}" alt="${
              track.title
            }" class="track-artwork">
            <div class="track-info">
              <div class="track-title">${track.title}</div>
              <div class="track-artist">${track.artist}</div>
            </div>
            <span class="track-duration">${formatTime(track.duration || 0)}</span>
          </div>
        `
          )
          .join("")}
      </div>
      
      <div class="controls">
        <button onclick="window.app.clearQueue()">
          <svg style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
          Clear Queue
        </button>
        <button onclick="window.app.addRandomTrack()">
          <svg style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"/><path d="M12 5v14"/>
          </svg>
          Add Random Track
        </button>
      </div>
    `;
  },

  about: () => `
    <h2>About MakeNoise.js</h2>
    <div class="info-section">
      <p>
        This is a vanilla JavaScript Single Page Application demonstrating the core features
        of MakeNoise.js without any framework dependencies.
      </p>
      
      <h3>Features Demonstrated</h3>
      <ul>
        <li>✅ Persistent audio playback across route changes</li>
        <li>✅ Global player instance (singleton pattern)</li>
        <li>✅ Playlist management (add, remove, navigate)</li>
        <li>✅ Repeat modes (none, one, all)</li>
        <li>✅ Shuffle mode</li>
        <li>✅ State persistence in localStorage</li>
        <li>✅ Media Session API integration</li>
        <li>✅ Keyboard shortcuts</li>
        <li>✅ Web Component UI (<code>&lt;make-noise-player&gt;</code>)</li>
        <li>✅ Light/Dark theme toggle</li>
      </ul>
      
      <div class="info-box">
        <h3>Current Player State</h3>
        <pre style="background: var(--bg-content); padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.85rem;">
${JSON.stringify(player.getState(), null, 2)}
        </pre>
      </div>
    </div>
  `,

  keyboard: () => `
    <h2>Keyboard Shortcuts</h2>
    <div class="info-section">
      <p>Control the player using these keyboard shortcuts:</p>
      
      <div class="keyboard-shortcuts">
        <div class="shortcut">
          <span>Play / Pause</span>
          <kbd>Space</kbd>
        </div>
        <div class="shortcut">
          <span>Mute / Unmute</span>
          <kbd>M</kbd>
        </div>
        <div class="shortcut">
          <span>Seek Forward (10s)</span>
          <kbd>→</kbd>
        </div>
        <div class="shortcut">
          <span>Seek Backward (10s)</span>
          <kbd>←</kbd>
        </div>
        <div class="shortcut">
          <span>Volume Up</span>
          <kbd>↑</kbd>
        </div>
        <div class="shortcut">
          <span>Volume Down</span>
          <kbd>↓</kbd>
        </div>
      </div>
      
      <div class="info-box" style="margin-top: 24px;">
        <p>
          <strong>Note:</strong> Keyboard shortcuts work globally across all pages.
          Try navigating to different pages and using the shortcuts!
        </p>
      </div>
    </div>
  `,
};

// Page titles for header
const pageTitles = {
  home: 'Home',
  playlist: 'My Playlist',
  about: 'About',
  keyboard: 'Keyboard Shortcuts'
};

// Router implementation
class Router {
  constructor() {
    this.currentRoute = "home";
    this.setupNavigation();
    this.render();
  }

  setupNavigation() {
    const nav = document.querySelector("nav");
    nav.addEventListener("click", (e) => {
      if (e.target.closest('.nav-item')) {
        const button = e.target.closest('.nav-item');
        const route = button.dataset.route;
        this.navigate(route);
      }
    });
  }

  navigate(route) {
    if (routes[route]) {
      this.currentRoute = route;
      this.render();
      this.updateActiveNav();
      this.updatePageTitle();
    }
  }

  render() {
    const app = document.getElementById("app");
    app.innerHTML = routes[this.currentRoute]();
  }

  updateActiveNav() {
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.route === this.currentRoute);
    });
  }
  
  updatePageTitle() {
    const titleEl = document.getElementById("page-title");
    if (titleEl && pageTitles[this.currentRoute]) {
      titleEl.textContent = pageTitles[this.currentRoute];
    }
  }
}

// Application controller
class App {
  constructor() {
    this.player = player;
    this.router = new Router();
    this.setupPlayerEvents();
  }

  setupPlayerEvents() {
    // Listen to player events and update UI when needed
    this.player.on("trackchange", () => {
      if (
        this.router.currentRoute === "playlist" ||
        this.router.currentRoute === "home"
      ) {
        this.router.render();
      }
    });

    this.player.on("queuechange", () => {
      if (
        this.router.currentRoute === "playlist" ||
        this.router.currentRoute === "home"
      ) {
        this.router.render();
      }
    });

    this.player.on("statechange", () => {
      if (
        this.router.currentRoute === "about" ||
        this.router.currentRoute === "home"
      ) {
        this.router.render();
      }
    });

    // Handle errors
    this.player.on("error", (error) => {
      console.error("Player error:", error);
      alert(
        `Player Error: ${error.message}\n\nThis might happen if audio files are not accessible. Check the console for details.`
      );
    });

    // Log player events for debugging
    this.player.on("play", () => console.log("Playing"));
    this.player.on("pause", () => console.log("Paused"));
    this.player.on("ended", () => console.log("Ended"));
  }

  playTrack(index) {
    this.player.play(index);
  }
  
  // Play a single track - adds after currently playing track and plays it
  playSingleTrack(trackId) {
    const track = sampleTracks.find(t => t.id === trackId);
    if (track) {
      const currentIndex = this.player.getState().currentQueueIndex;
      // If there's a currently playing track, insert after it. Otherwise, add to end.
      const insertIndex = currentIndex >= 0 ? currentIndex + 1 : this.player.getQueue().length;
      
      this.player.playNext(track); // This inserts after current track
      this.player.play(insertIndex); // Play the newly inserted track
    }
  }
  
  // Play all tracks - adds all to queue and starts playing the first newly added track
  playAll() {
    const startIndex = this.player.getQueue().length; // Remember where new tracks start
    this.player.addToQueue(sampleTracks);
    this.player.play(startIndex); // Start playing the first newly added track
    this.router.render();
  }
  
  playNextTrack(trackId) {
    const track = sampleTracks.find(t => t.id === trackId);
    if (track) {
      this.player.playNext(track);
      this.router.render();
    }
  }
  
  addTrackToQueue(trackId) {
    const track = sampleTracks.find(t => t.id === trackId);
    if (track) {
      this.player.addToQueue(track);
      this.router.render();
    }
  }

  toggleShuffle() {
    this.player.toggleShuffle();
    const state = this.player.getState();
    alert(`Shuffle ${state.isShuffling ? "enabled" : "disabled"}`);
    this.router.render();
  }

  cycleRepeatMode() {
    const modes = ["none", "one", "all"];
    const currentMode = this.player.getState().repeatMode;
    const currentIndex = modes.indexOf(currentMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    this.player.setRepeatMode(nextMode);
    alert(`Repeat mode: ${nextMode}`);
    this.router.render();
  }

  clearQueue() {
    if (confirm("Are you sure you want to clear the queue?")) {
      this.player.clearQueue();
      this.router.render();
    }
  }

  addRandomTrack() {
    const randomTrack = {
      id: `random-${Date.now()}`,
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      title: `Random Track ${Math.floor(Math.random() * 1000)}`,
      artist: "Random Artist",
      artwork: `https://picsum.photos/seed/${Date.now()}/300/300`,
    };
    this.player.addToQueue(randomTrack);
    this.router.render();
  }

  testPersistence() {
    const state = this.player.getState();
    const message = `
Persistence Test

Current state has been saved to localStorage!

Try these steps:
1. Note the current track: ${state.currentTrack?.title || "None"}
2. Note the current time: ${Math.round(state.currentTime)}s
3. Refresh the page (F5)
4. The player should restore this exact state!

You can also:
- Close the browser tab and reopen it
- Navigate away and come back
- The player state persists across all scenarios!
    `.trim();

    alert(message);
  }
}

// Initialize the app
window.app = new App();

// Initialize theme
ThemeManager.init();

// Log player state for debugging
console.log("MakeNoise.js initialized!");
console.log("Player state:", player.getState());
console.log("Queue:", player.getQueue());
