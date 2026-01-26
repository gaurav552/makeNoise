import { beforeEach, afterEach, vi } from 'vitest';

// Mock HTMLAudioElement for testing
class MockAudioElement {
  src = '';
  volume = 1;
  playbackRate = 1;
  currentTime = 0;
  duration = 0;
  paused = true;
  ended = false;
  preload = 'metadata';
  
  private listeners: Map<string, Set<EventListener>> = new Map();

  addEventListener(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);
  }

  removeEventListener(event: string, listener: EventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
    return true;
  }

  async play(): Promise<void> {
    this.paused = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  load(): void {
    this.dispatchEvent(new Event('loadeddata'));
  }
}

// Setup global mocks
beforeEach(() => {
  // Mock HTMLAudioElement
  global.HTMLAudioElement = MockAudioElement as any;
  
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();
  
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock navigator.mediaSession
  Object.defineProperty(global.navigator, 'mediaSession', {
    value: {
      metadata: null,
      setActionHandler: vi.fn(),
    },
    writable: true,
    configurable: true,
  });

  // Mock MediaMetadata constructor
  (global as any).MediaMetadata = class MediaMetadata {
    title: string;
    artist: string;
    album: string;
    artwork: Array<{ src: string; sizes: string; type: string }>;

    constructor(metadata: {
      title: string;
      artist?: string;
      album?: string;
      artwork?: Array<{ src: string; sizes: string; type: string }>;
    }) {
      this.title = metadata.title;
      this.artist = metadata.artist || '';
      this.album = metadata.album || '';
      this.artwork = metadata.artwork || [];
    }
  };
});

// Cleanup after each test
afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
