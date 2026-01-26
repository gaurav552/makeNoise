/**
 * PlayerUI Web Component
 * 
 * Custom element <make-noise-player> that provides a default UI for the MakeNoise player.
 * Uses Shadow DOM for encapsulation and subscribes to player events for reactive updates.
 */

import { MakeNoise } from '../core/MakeNoise';
import type { RepeatMode } from '../core/types';

/**
 * PlayerUIElement - Web Component for MakeNoise player UI
 * 
 * Provides a complete player interface with:
 * - Play/pause button
 * - Previous/next track buttons
 * - Seek bar for timeline navigation
 * - Volume slider
 * - Track information display (title, artist, artwork)
 * - Current time and duration display
 * - Queue panel integration
 */
export class PlayerUIElement extends HTMLElement {
  private _player: MakeNoise | null = null;
  private _shadowRoot: ShadowRoot;
  private _themeObserver: MutationObserver | null = null;
  private _elements: {
    playButton: HTMLButtonElement | null;
    prevButton: HTMLButtonElement | null;
    nextButton: HTMLButtonElement | null;
    rewindButton: HTMLButtonElement | null;
    fastForwardButton: HTMLButtonElement | null;
    shuffleButton: HTMLButtonElement | null;
    repeatButton: HTMLButtonElement | null;
    progressSliders: NodeListOf<HTMLInputElement> | null;
    volumeSlider: HTMLInputElement | null;
    currentTime: HTMLSpanElement | null;
    duration: HTMLSpanElement | null;
    trackTitle: HTMLHeadingElement | null;
    trackArtist: HTMLParagraphElement | null;
    artwork: HTMLImageElement | null;
    queueButton: HTMLButtonElement | null;
    closeQueueButton: HTMLButtonElement | null;
    queuePanel: HTMLElement | null;
    volumeButton: HTMLButtonElement | null; // For toggle mute
  };

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._elements = {
      playButton: null,
      prevButton: null,
      nextButton: null,
      rewindButton: null,
      fastForwardButton: null,
      shuffleButton: null,
      repeatButton: null,
      progressSliders: null,
      volumeSlider: null,
      currentTime: null,
      duration: null,
      trackTitle: null,
      trackArtist: null,
      artwork: null,
      queueButton: null,
      closeQueueButton: null,
      queuePanel: null,
      volumeButton: null
    };
    this._render();
    this._setupThemeObserver();
  }

  private _render(): void {
    this._shadowRoot.innerHTML = `
      <style>
        :host {
          /* Light mode colors */
          --bg-light: #ffffff;
          --surface-light: #f8f8f8;
          --surface-hover-light: #f0f0f0;
          --accent-light: #667eea;
          --accent-dim-light: #5568d3;
          --text-primary-light: #1a1a1a;
          --text-secondary-light: #6b7280;
          --border-light: #e5e5e5;
          
          /* Dark mode colors */
          --bg-dark: #191a35;
          --surface-dark: #1e1e3f;
          --surface-hover-dark: #252648;
          --accent-dark: #ff5e7e;
          --accent-dim-dark: #ff4569;
          --text-primary-dark: #ffffff;
          --text-secondary-dark: #a0a0c0;
          --border-dark: #2a2a4a;
          
          /* Default to dark theme */
          --background: var(--bg-dark);
          --surface: var(--surface-dark);
          --surface-hover: var(--surface-hover-dark);
          --accent: var(--accent-dark);
          --accent-dim: var(--accent-dim-dark);
          --text-primary: var(--text-primary-dark);
          --text-secondary: var(--text-secondary-dark);
          --border: var(--border-dark);
          --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .player-wrapper {
          font-family: var(--font-family);
          color: var(--text-primary);
        }

        /* --- Scrollbar --- */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--surface); }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

        /* --- YouTube-Style Progress Bar at Top --- */
        .progress-bar-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--border);
          cursor: pointer;
          z-index: 100;
          transition: height 0.2s ease;
        }

        .progress-bar-container:hover {
          height: 6px;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--accent);
          width: 0%;
          transition: width 0.1s linear;
          position: relative;
        }

        .progress-bar-fill::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 12px;
          height: 12px;
          background: var(--accent);
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .progress-bar-container:hover .progress-bar-fill::after {
          opacity: 1;
        }

        /* Hidden range input for accessibility */
        .progress-slider {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          opacity: 0;
          cursor: pointer;
          z-index: 101;
          margin: 0;
          -webkit-appearance: none;
          appearance: none;
        }
        
        .progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
        }
        
        .progress-slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border: none;
          background: transparent;
        }

        /* --- Volume Slider --- */
        .volume-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          width: 96px;
          height: 12px;
          background-size: 100% 4px;
          background-position: center;
          background-repeat: no-repeat;
        }

        .volume-slider::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
          border-radius: 2px;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: var(--accent);
          border-radius: 50%;
          margin-top: -4px;
          transition: transform 0.15s ease;
          border: none;
        }

        .volume-slider:hover::-webkit-slider-thumb {
          transform: scale(1.2);
        }

        .volume-slider::-moz-range-track {
          height: 4px;
          background: transparent;
          border-radius: 2px;
        }

        .volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: var(--accent);
          border-radius: 50%;
          border: none;
          transition: transform 0.15s ease;
        }

        .volume-slider:hover::-moz-range-thumb {
          transform: scale(1.2);
        }
        
        /* --- Buttons --- */
        button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        button:hover {
          color: var(--text-primary);
          background-color: var(--surface-hover);
        }

        button:active {
            transform: scale(0.95);
        }

        .control-btn {
            border-radius: 9999px; /* full rounded */
            padding: 8px;
        }
        .control-btn:hover {
            transform: scale(1.1);
        }

        .play-btn {
            width: 48px;
            height: 48px;
            background-color: var(--accent);
            color: white;
            border-radius: 50%;
            box-shadow: 0 4px 20px rgba(234, 123, 123, 0.3);
        }
        .play-btn:hover {
            background-color: var(--accent-dim);
            color: white; /* Maintain white on hover */
            transform: scale(1.05);
            box-shadow: 0 6px 25px rgba(234, 123, 123, 0.4);
        }
        
        .active-btn {
            color: var(--accent);
        }

        /* --- Queue Panel --- */
        .queue-panel {
            position: fixed;
            bottom: 115px; /* Height of footer roughly */
            left: 0;
            right: 0;
            background-color: var(--surface);
            border-top: 1px solid var(--border);
            z-index: 40;
            max-height: 60vh;
            display: flex;
            flex-direction: column;
            transition: transform 0.3s ease, opacity 0.3s ease;
            box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .queue-panel.hidden {
            transform: translateY(120%);
            opacity: 0;
            pointer-events: none;
        }

        .queue-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            border-bottom: 1px solid var(--border);
        }
        
        .queue-content {
            overflow-y: auto;
            flex: 1;
            padding: 0.5rem;
        }

        .queue-title {
            font-weight: 600;
            font-size: 1.125rem;
        }
        
        /* Queue Items */
        .queue-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .queue-item:hover {
            background: var(--surface-hover);
            border-color: var(--accent);
        }
        
        .queue-item.active {
            background: var(--accent);
            border-color: var(--accent);
            color: white;
        }
        
        .queue-item-artwork {
            width: 48px;
            height: 48px;
            border-radius: 6px;
            object-fit: cover;
            background: var(--border);
            flex-shrink: 0;
        }
        
        .queue-item-info {
            flex: 1;
            min-width: 0;
        }
        
        .queue-item-title {
            font-weight: 600;
            font-size: 0.95rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .queue-item-artist {
            color: var(--text-secondary);
            font-size: 0.85rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .queue-item.active .queue-item-artist {
            color: rgba(255, 255, 255, 0.9);
        }
        
        .queue-item-remove {
            padding: 6px;
            border-radius: 50%;
            flex-shrink: 0;
            opacity: 0.7;
        }
        
        .queue-item-remove:hover {
            opacity: 1;
            background: rgba(255, 0, 0, 0.1);
            color: #ff4444;
        }
        
        .queue-item.active .queue-item-remove:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }
        
        /* Drag Handle */
        .queue-item-drag-handle {
            cursor: grab;
            padding: 0 8px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            flex-shrink: 0;
            transition: color 0.2s ease;
        }
        
        .queue-item-drag-handle:hover {
            color: var(--text-primary);
        }
        
        .queue-item-drag-handle:active {
            cursor: grabbing;
        }
        
        .queue-item.active .queue-item-drag-handle {
            color: rgba(255, 255, 255, 0.7);
        }
        
        .queue-item.active .queue-item-drag-handle:hover {
            color: white;
        }
        
        /* Drag States */
        .queue-item.dragging {
            opacity: 0.5;
            transform: scale(0.95);
        }
        
        .queue-item.drag-over {
            border-color: var(--accent);
            background: var(--surface-hover);
            border-style: dashed;
        }

        /* --- Footer Player --- */
        .player-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: var(--background);
            backdrop-filter: blur(12px);
            border-top: 1px solid var(--border);
            z-index: 50;
            padding-bottom: env(safe-area-inset-bottom);
        }
        
        .progress-section-mobile {
            padding: 0.5rem 1rem 0;
            display: none;
        }

        .player-main {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 25px 35px 20px 35px;
        }

        /* Track Info */
        .track-info-section {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex: 1;
            min-width: 0;
            max-width: 280px;
        }
        
        .album-art {
            width: 56px;
            height: 56px;
            border-radius: 0.5rem;
            overflow: hidden;
            flex-shrink: 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            background-color: var(--border);
        }
        
        .album-art img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(234, 123, 123, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(234, 123, 123, 0); }
            100% { box-shadow: 0 0 0 0 rgba(234, 123, 123, 0); }
        }
        
        .album-art.playing {
            animation: pulse-ring 2s infinite;
        }

        .track-details {
            min-width: 0; /* truncate fix */
            flex: 1;
        }
        
        .track-title {
            font-weight: 600;
            font-size: 1rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 0;
        }
        
        .artist-name {
            color: var(--text-secondary);
            font-size: 0.875rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 0;
        }

        /* Time Display - Inside track info */
        .time-display {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-top: 4px;
        }

        /* Controls Center */
        .controls-section {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            flex: 1;
            justify-content: center;
            max-width: 700px;
        }
        
        .main-controls {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        /* Hide old desktop progress section */
        .desktop-progress {
            display: none;
        }
        
        .time-text {
            font-size: 0.75rem;
            color: var(--text-secondary);
            min-width: 40px;
        }
        .time-text.align-right { text-align: right; }

        /* Volume & Extra */
        .volume-section {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex: 1;
            justify-content: flex-end;
            max-width: 280px;
        }
        
        .volume-slider {
            width: 96px;
        }

        /* Utilities */
        .hidden {
            display: none !important;
        }
        .truncate { 
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
        }

        /* Responsive */
        @media (max-width: 768px) {
            .queue-panel { bottom: 88px; }
            .player-main {
                flex-wrap: wrap;
                padding: 0.75rem 1rem;
                gap: 1rem;
            }
            .track-info-section {
                flex: 1;
                min-width: 200px;
                max-width: none;
            }
            .controls-section {
                order: 3;
                width: 100%;
                max-width: none;
                flex-wrap: wrap;
                gap: 1rem;
            }
            .main-controls {
                width: 100%;
                justify-content: center;
            }
            .volume-section {
                flex: 1;
                min-width: 150px;
                max-width: none;
            }
        }
        
        @media (max-width: 480px) {
             .album-art { width: 48px; height: 48px; }
             .play-btn { width: 42px; height: 42px; }
             .volume-slider { width: 70px; }
             .main-controls {
                 gap: 0.5rem;
             }
        }

      </style>

      <div class="player-wrapper">
        <!-- Queue Panel -->
        <div id="queue-panel" class="queue-panel hidden">
          <div class="queue-header">
            <h2 class="queue-title">Queue</h2> <!-- Simplified for now -->
            <button id="close-queue-btn" class="control-btn" aria-label="Close queue">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div class="queue-content" id="queue-list-container">
             <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                Queue management coming soon
             </div>
          </div>
        </div>

        <!-- Player Footer -->
        <footer class="player-footer">
            <!-- YouTube-Style Progress Bar at Top -->
            <div class="progress-bar-container" id="progress-container">
                <div class="progress-bar-fill" id="progress-fill"></div>
                <input type="range" class="progress-slider" min="0" max="100" value="0" aria-label="Track progress">
            </div>

            <div class="player-main">
                <!-- Track Info -->
                <div class="track-info-section">
                    <div class="album-art" id="album-art-container">
                        <img id="artwork" src="" alt="Album Art" />
                    </div>
                    <div class="track-details">
                        <h4 id="track-title" class="track-title">No Track</h4>
                        <p id="track-artist" class="artist-name">Select a track to play</p>
                        <div class="time-display">
                            <span id="current-time">0:00</span>
                            <span>/</span>
                            <span id="duration">0:00</span>
                        </div>
                    </div>
                </div>

                <!-- Controls -->
                <div class="controls-section">
                    <div class="main-controls">
                        <!-- Shuffle -->
                        <button id="shuffle-button" class="control-btn" aria-label="Shuffle">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>
                        </button>
                        
                        <!-- Prev -->
                        <button id="prev-track-button" class="control-btn" aria-label="Previous track">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/></svg>
                        </button>

                        <!-- Rewind -->
                        <button id="rewind-button" class="control-btn" aria-label="Rewind 10s">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><text x="12" y="15" text-anchor="middle" font-size="7" fill="currentColor" stroke="none">10</text></svg>
                        </button>

                        <!-- Play/Pause -->
                        <button id="play-pause-button" class="play-btn" aria-label="Play">
                            <svg id="play-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                            <svg id="pause-icon" class="hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        </button>

                        <!-- Fast Forward -->
                        <button id="fast-forward-button" class="control-btn" aria-label="Forward 10s">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><text x="12" y="15" text-anchor="middle" font-size="7" fill="currentColor" stroke="none">10</text></svg>
                        </button>

                        <!-- Next -->
                        <button id="next-track-button" class="control-btn" aria-label="Next track">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/></svg>
                        </button>

                        <!-- Repeat -->
                        <button id="repeat-button" class="control-btn" aria-label="Repeat">
                            <svg id="repeat-off-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
                            <svg id="repeat-all-icon" class="hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
                            <svg id="repeat-one-icon" class="hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><text x="12" y="15" text-anchor="middle" font-size="9" fill="currentColor" stroke="none" font-weight="bold">1</text></svg>
                        </button>
                    </div>
                </div>

                <!-- Volume & Queue -->
                <div class="volume-section">
                    <button id="queue-button" class="control-btn" aria-label="Queue">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>
                    </button>

                    <button id="volume-button" class="control-btn" aria-label="Mute">
                        <svg id="vol-icon-high" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg>
                        <svg id="vol-icon-mute" class="hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
                    </button>
                    
                    <input type="range" id="volume-slider" class="volume-slider" min="0" max="100" value="100" aria-label="Volume">
                </div>
            </div>
        </footer>
      </div>
    `;
  }

  connectedCallback(): void {
    this._player = MakeNoise.getInstance();
    
    // Select elements
    const sr = this._shadowRoot;
    this._elements = {
        playButton: sr.getElementById('play-pause-button') as HTMLButtonElement,
        prevButton: sr.getElementById('prev-track-button') as HTMLButtonElement,
        nextButton: sr.getElementById('next-track-button') as HTMLButtonElement,
        rewindButton: sr.getElementById('rewind-button') as HTMLButtonElement,
        fastForwardButton: sr.getElementById('fast-forward-button') as HTMLButtonElement,
        shuffleButton: sr.getElementById('shuffle-button') as HTMLButtonElement,
        repeatButton: sr.getElementById('repeat-button') as HTMLButtonElement,
        progressSliders: sr.querySelectorAll('.progress-slider') as NodeListOf<HTMLInputElement>,
        volumeSlider: sr.getElementById('volume-slider') as HTMLInputElement,
        currentTime: sr.getElementById('current-time') as HTMLSpanElement,
        duration: sr.getElementById('duration') as HTMLSpanElement,
        trackTitle: sr.getElementById('track-title') as HTMLHeadingElement,
        trackArtist: sr.getElementById('track-artist') as HTMLParagraphElement,
        artwork: sr.getElementById('artwork') as HTMLImageElement,
        queueButton: sr.getElementById('queue-button') as HTMLButtonElement,
        closeQueueButton: sr.getElementById('close-queue-btn') as HTMLButtonElement,
        queuePanel: sr.getElementById('queue-panel') as HTMLElement,
        volumeButton: sr.getElementById('volume-button') as HTMLButtonElement
    };

    this._subscribeToPlayerEvents();
    this._setupEventListeners();
    this._updateUI();
    this._applyTheme();
  }

  disconnectedCallback(): void {
    this._unsubscribeFromPlayerEvents();
    if (this._themeObserver) {
      this._themeObserver.disconnect();
    }
  }

  private _setupThemeObserver(): void {
    // Observe theme changes on the document element
    this._themeObserver = new MutationObserver(() => {
      this._applyTheme();
    });

    // Start observing when connected
    if (document.documentElement) {
      this._themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }
  }

  private _applyTheme(): void {
    const theme = document.documentElement.getAttribute('data-theme');
    const host = this._shadowRoot.host as HTMLElement;
    
    // If no theme attribute is set, default to dark mode
    if (!theme || theme === 'dark') {
      host.style.setProperty('--background', 'var(--bg-dark)');
      host.style.setProperty('--surface', 'var(--surface-dark)');
      host.style.setProperty('--surface-hover', 'var(--surface-hover-dark)');
      host.style.setProperty('--accent', 'var(--accent-dark)');
      host.style.setProperty('--accent-dim', 'var(--accent-dim-dark)');
      host.style.setProperty('--text-primary', 'var(--text-primary-dark)');
      host.style.setProperty('--text-secondary', 'var(--text-secondary-dark)');
      host.style.setProperty('--border', 'var(--border-dark)');
    } else {
      host.style.setProperty('--background', 'var(--bg-light)');
      host.style.setProperty('--surface', 'var(--surface-light)');
      host.style.setProperty('--surface-hover', 'var(--surface-hover-light)');
      host.style.setProperty('--accent', 'var(--accent-light)');
      host.style.setProperty('--accent-dim', 'var(--accent-dim-light)');
      host.style.setProperty('--text-primary', 'var(--text-primary-light)');
      host.style.setProperty('--text-secondary', 'var(--text-secondary-light)');
      host.style.setProperty('--border', 'var(--border-light)');
    }
  }

  private _subscribeToPlayerEvents(): void {
    if (!this._player) return;
    this._player.on('statechange', this._handleStateChange);
    this._player.on('trackchange', this._handleTrackChange);
    this._player.on('timeupdate', this._handleTimeUpdate);
    this._player.on('queuechange', this._handleQueueChange);
  }

  private _unsubscribeFromPlayerEvents(): void {
    if (!this._player) return;
    this._player.off('statechange', this._handleStateChange);
    this._player.off('trackchange', this._handleTrackChange);
    this._player.off('timeupdate', this._handleTimeUpdate);
    this._player.off('queuechange', this._handleQueueChange);
  }

  /* --- Handlers --- */
  private _handleStateChange = (): void => { this._updateUI(); };
  private _handleTrackChange = (): void => { 
    this._updateUI(); 
    this._renderQueueItems(); // Re-render queue to update active state
  };
  private _handleTimeUpdate = (): void => { this._updateUI(); };
  private _handleQueueChange = (): void => { 
    this._updateUI(); 
    this._renderQueueItems();
  };

  private _setupEventListeners(): void {
      if(!this._player) return;
      const el = this._elements;

      el.playButton?.addEventListener('click', () => {
          const state = this._player?.getState();
          if(state?.isPlaying) this._player?.pause();
          else this._player?.play();
      });

      el.prevButton?.addEventListener('click', () => this._player?.previous());
      el.nextButton?.addEventListener('click', () => this._player?.next());
      
      // 10s seek
      el.rewindButton?.addEventListener('click', () => {
          const state = this._player?.getState();
          if(state) this._player?.seek(Math.max(0, state.currentTime - 10));
      });
      el.fastForwardButton?.addEventListener('click', () => {
          const state = this._player?.getState();
          if(state) this._player?.seek(Math.min(state.duration, state.currentTime + 10));
      });

      // Modes
      el.shuffleButton?.addEventListener('click', () => this._player?.toggleShuffle());
      
      el.repeatButton?.addEventListener('click', () => {
          // Cycle repeat mode: none -> all -> one -> none
          const state = this._player?.getState();
          if(!state || !this._player) return;
          
          const modes: RepeatMode[] = ['none', 'all', 'one'];
          // Default to 'none' if undefined or unknown
          const currentMode = state.repeatMode || 'none';
          const currentIdx = modes.indexOf(currentMode);
          // If current mode not found, start at 0
          const safeCurrentIdx = currentIdx === -1 ? 0 : currentIdx;
          const nextIdx = (safeCurrentIdx + 1) % modes.length;
          
          this._player.setRepeatMode(modes[nextIdx]!);
      });

      // Progress Sliders (both mobile and desktop)
      el.progressSliders?.forEach(slider => {
          slider.addEventListener('input', (e) => {
             const val = parseFloat((e.target as HTMLInputElement).value);
             const state = this._player?.getState();
             if(state && state.duration) {
                 this._player?.seek((val / 100) * state.duration);
             }
          });
      });

      // Volume
      el.volumeSlider?.addEventListener('input', (e) => {
          const val = parseFloat((e.target as HTMLInputElement).value);
          this._player?.setVolume(val / 100);
      });
      
      el.volumeButton?.addEventListener('click', () => {
          if (this._player) {
              const state = this._player.getState();
              // Simple toggle: if volume > 0, set to 0. If 0, set to last known or 1.
              if (state.volume > 0) {
                  this._player.setVolume(0);
              } else {
                  this._player.setVolume(1); // Restore to full for now
              }
          }
      });

      // Queue Toggle
      const toggleQueue = () => {
          el.queuePanel?.classList.toggle('hidden');
      };
      el.queueButton?.addEventListener('click', toggleQueue);
      el.closeQueueButton?.addEventListener('click', toggleQueue);
      
      // Initial queue render
      this._renderQueueItems();
  }
  
  /**
   * Render queue items in the queue panel
   * @private
   */
  private _renderQueueItems(): void {
      if (!this._player) return;
      
      const queue = this._player.getQueue();
      const state = this._player.getState();
      const container = this._shadowRoot.getElementById('queue-list-container');
      
      if (!container) return;
      
      // If queue is empty, show placeholder
      if (queue.length === 0) {
          container.innerHTML = `
              <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                  Queue is empty
              </div>
          `;
          return;
      }
      
      // Render queue items - use currentQueueIndex for active state (not track ID)
      container.innerHTML = queue.map((track, index) => {
          const isCurrentIndex = index === state.currentQueueIndex;
          return `
              <div class="queue-item ${isCurrentIndex ? 'active' : ''}" 
                   data-index="${index}" 
                   data-track-id="${track.id}"
                   draggable="true">
                  <div class="queue-item-drag-handle">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>
                      </svg>
                  </div>
                  <img src="${track.artwork || ''}" alt="${track.title}" class="queue-item-artwork" />
                  <div class="queue-item-info">
                      <div class="queue-item-title">${track.title}</div>
                      <div class="queue-item-artist">${track.artist || 'Unknown'}</div>
                  </div>
                  <button class="queue-item-remove" data-index="${index}" aria-label="Remove from queue">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                      </svg>
                  </button>
              </div>
          `;
      }).join('');
      
      // Add click handlers for queue items
      container.querySelectorAll('.queue-item').forEach((item) => {
          const element = item as HTMLElement;
          const index = parseInt(element.dataset.index || '0', 10);
          
          // Click on item to play
          element.addEventListener('click', (e) => {
              // Don't trigger if clicking the remove button or drag handle
              if ((e.target as HTMLElement).closest('.queue-item-remove') || 
                  (e.target as HTMLElement).closest('.queue-item-drag-handle')) {
                  return;
              }
              this._player?.play(index);
          });
          
          // Drag and drop handlers
          element.addEventListener('dragstart', this._handleDragStart.bind(this));
          element.addEventListener('dragover', this._handleDragOver.bind(this));
          element.addEventListener('drop', this._handleDrop.bind(this));
          element.addEventListener('dragend', this._handleDragEnd.bind(this));
      });
      
      // Add click handlers for remove buttons
      container.querySelectorAll('.queue-item-remove').forEach((button) => {
          button.addEventListener('click', (e) => {
              e.stopPropagation();
              const index = parseInt((button as HTMLElement).dataset.index || '0', 10);
              
              // Just remove the track from the queue
              this._player?.removeFromQueue(index);
          });
      });
  }
  
  private _draggedElement: HTMLElement | null = null;
  private _draggedIndex: number = -1;
  
  private _handleDragStart(e: DragEvent): void {
      const target = e.currentTarget as HTMLElement;
      this._draggedElement = target;
      this._draggedIndex = parseInt(target.dataset.index || '0', 10);
      target.classList.add('dragging');
      
      if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/html', target.innerHTML);
      }
  }
  
  private _handleDragOver(e: DragEvent): void {
      e.preventDefault();
      if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move';
      }
      
      const target = e.currentTarget as HTMLElement;
      if (target !== this._draggedElement) {
          target.classList.add('drag-over');
      }
  }
  
  private _handleDrop(e: DragEvent): void {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.currentTarget as HTMLElement;
      target.classList.remove('drag-over');
      
      if (this._draggedElement && target !== this._draggedElement) {
          const toIndex = parseInt(target.dataset.index || '0', 10);
          
          // Reorder the queue
          if (this._player && this._draggedIndex !== toIndex) {
              this._player.reorderQueue(this._draggedIndex, toIndex);
          }
      }
  }
  
  private _handleDragEnd(e: DragEvent): void {
      const target = e.currentTarget as HTMLElement;
      target.classList.remove('dragging');
      
      // Remove drag-over class from all items
      const container = this._shadowRoot.getElementById('queue-list-container');
      if (container) {
          container.querySelectorAll('.queue-item').forEach(item => {
              item.classList.remove('drag-over');
          });
      }
      
      this._draggedElement = null;
      this._draggedIndex = -1;
  }

  private _updateUI(): void {
      if(!this._player) return;
      const state = this._player.getState();
      const el = this._elements;

      // Play/Pause Icon
      const playIcon = this._shadowRoot.getElementById('play-icon');
      const pauseIcon = this._shadowRoot.getElementById('pause-icon');
      if (state.isPlaying) {
          playIcon?.classList.add('hidden');
          pauseIcon?.classList.remove('hidden');
          el.playButton?.setAttribute('aria-label', 'Pause');
          // Pulse animation on artwork
          this._shadowRoot.getElementById('album-art-container')?.classList.add('playing');
      } else {
          playIcon?.classList.remove('hidden');
          pauseIcon?.classList.add('hidden');
          el.playButton?.setAttribute('aria-label', 'Play');
          this._shadowRoot.getElementById('album-art-container')?.classList.remove('playing');
      }

      // Track Info
      if(state.currentTrack) {
          if(el.trackTitle) el.trackTitle.textContent = state.currentTrack.title;
          if(el.trackArtist) el.trackArtist.textContent = state.currentTrack.artist || 'Unknown';
          if(el.artwork) {
              // Use artwork if available, otherwise use default placeholder
              el.artwork.src = state.currentTrack.artwork || this._getDefaultArtwork();
              el.artwork.style.display = 'block';
          }
      } else {
          // No track loaded - show default state
          if(el.trackTitle) el.trackTitle.textContent = 'No Track';
          if(el.trackArtist) el.trackArtist.textContent = 'Select a track to play';
          if(el.artwork) {
              el.artwork.src = this._getDefaultArtwork();
              el.artwork.style.display = 'block';
          }
      }

      // Time & Progress
      const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
      
      // Update YouTube-style progress bar fill
      const progressFill = this._shadowRoot.getElementById('progress-fill');
      if (progressFill) {
          progressFill.style.width = `${progressPercent}%`;
      }
      
      // Update hidden range inputs for accessibility
      el.progressSliders?.forEach(slider => {
          slider.value = progressPercent.toString();
      });
      
      if(el.currentTime) el.currentTime.textContent = this._formatTime(state.currentTime);
      if(el.duration) el.duration.textContent = this._formatTime(state.duration);

      // Volume
      const volPercent = state.volume * 100;
      if(el.volumeSlider) {
          el.volumeSlider.value = volPercent.toString();
          el.volumeSlider.style.backgroundImage = `linear-gradient(to right, var(--accent) ${volPercent}%, var(--border) ${volPercent}%)`;
      }
      
      // Volume Icon State
      const volHigh = this._shadowRoot.getElementById('vol-icon-high');
      const volMute = this._shadowRoot.getElementById('vol-icon-mute');
      if(state.volume === 0) {
          volHigh?.classList.add('hidden');
          volMute?.classList.remove('hidden');
      } else {
          volHigh?.classList.remove('hidden');
          volMute?.classList.add('hidden');
      }

      // Mode Active States
      if(el.shuffleButton) {
          if(state.isShuffling) el.shuffleButton.classList.add('active-btn');
          else el.shuffleButton.classList.remove('active-btn');
      }
      
      // Repeat Mode Icons
      const repeatOffIcon = this._shadowRoot.getElementById('repeat-off-icon');
      const repeatAllIcon = this._shadowRoot.getElementById('repeat-all-icon');
      const repeatOneIcon = this._shadowRoot.getElementById('repeat-one-icon');
      
      if(repeatOffIcon && repeatAllIcon && repeatOneIcon) {
          // Hide all icons first
          repeatOffIcon.classList.add('hidden');
          repeatAllIcon.classList.add('hidden');
          repeatOneIcon.classList.add('hidden');
          
          // Show the appropriate icon based on repeat mode
          if(state.repeatMode === 'one') {
              repeatOneIcon.classList.remove('hidden');
              el.repeatButton?.classList.add('active-btn');
          } else if(state.repeatMode === 'all') {
              repeatAllIcon.classList.remove('hidden');
              el.repeatButton?.classList.add('active-btn');
          } else {
              repeatOffIcon.classList.remove('hidden');
              el.repeatButton?.classList.remove('active-btn');
          }
      }
  }

  private _formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get default artwork placeholder (SVG data URI)
   * @private
   */
  private _getDefaultArtwork(): string {
    // Simple music note SVG as data URI
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48cGF0aCBkPSJNMTIwIDYwdjcwYzAgOC4yOC02LjcyIDE1LTE1IDE1cy0xNS02LjcyLTE1LTE1IDYuNzItMTUgMTUtMTVjMi40OCAwIDQuODIuNjEgNi44NyAxLjY4VjQ1bDMwLTEwdjI1eiIgZmlsbD0iIzk5OSIvPjwvc3ZnPg==';
  }
}

customElements.define('make-noise-player', PlayerUIElement);
