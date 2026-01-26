<template>
  <div class="page about-page">
    <h2>About MakeNoise.js</h2>
    <p>
      MakeNoise.js is a framework-agnostic global media player library designed for Single Page Applications (SPAs).
    </p>

    <div class="demo-section">
      <h3>Key Features</h3>
      <ul>
        <li><strong>Persistent Playback:</strong> Audio continues playing across route changes</li>
        <li><strong>State Persistence:</strong> Player state saved to localStorage</li>
        <li><strong>Framework Agnostic:</strong> Core library works with any framework</li>
        <li><strong>Vue Integration:</strong> Reactive composables and plugin system</li>
        <li><strong>Keyboard Shortcuts:</strong> Control playback with keyboard</li>
        <li><strong>Media Session API:</strong> Native OS media controls</li>
        <li><strong>Playlist Management:</strong> Full playlist support with shuffle and repeat</li>
        <li><strong>TypeScript:</strong> Complete type definitions</li>
        <li><strong>Light/Dark Mode:</strong> Seamless theme switching across the entire application</li>
      </ul>
    </div>

    <div class="demo-section">
      <h3>Vue Integration</h3>
      <p>
        This example uses the Vue adapter which provides:
      </p>
      <ul>
        <li><code>useMakeNoise()</code> composable for reactive state</li>
        <li><code>MediaPlayerPlugin</code> for global player instance</li>
        <li>Automatic cleanup on component unmount</li>
        <li>Full TypeScript support</li>
      </ul>
    </div>

    <div class="demo-section">
      <h3>Keyboard Shortcuts</h3>
      <div class="shortcuts-grid">
        <div class="shortcut-item">
          <kbd>Space</kbd>
          <span>Play / Pause</span>
        </div>
        <div class="shortcut-item">
          <kbd>M</kbd>
          <span>Toggle Mute</span>
        </div>
        <div class="shortcut-item">
          <kbd>→</kbd>
          <span>Seek Forward 10s</span>
        </div>
        <div class="shortcut-item">
          <kbd>←</kbd>
          <span>Seek Backward 10s</span>
        </div>
        <div class="shortcut-item">
          <kbd>↑</kbd>
          <span>Volume Up</span>
        </div>
        <div class="shortcut-item">
          <kbd>↓</kbd>
          <span>Volume Down</span>
        </div>
      </div>
    </div>

    <div class="info-box">
      <h3>Current Player State</h3>
      <div class="state-display">
        <pre>{{ JSON.stringify(state, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMakeNoise } from '@makenoise/vue';

const { state } = useMakeNoise();
</script>

<style scoped>
.page {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.about-page h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.about-page > p {
  margin: 0 0 24px 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
}

.demo-section {
  background-color: var(--bg-content);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.demo-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.demo-section p {
  margin: 0.5rem 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.demo-section ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

.demo-section li {
  margin: 0.5rem 0;
}

code {
  background: var(--bg-sidebar-color);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: var(--accent);
  border: 1px solid var(--border-color);
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-sidebar-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

kbd {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  background: var(--accent);
  color: white;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.875rem;
  min-width: 40px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.shortcut-item span {
  color: var(--text-primary);
  font-size: 0.875rem;
}

.info-box {
  background: var(--bg-sidebar-color);
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid var(--border-color);
}

.info-box h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.state-display {
  background: var(--bg-content);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--border-color);
  overflow-x: auto;
}

.state-display pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

@media (max-width: 600px) {
  .shortcuts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
