import { PlayerProvider } from 'makenoise/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { player } from './player';
import '../vanilla/style.css';
import './style.css';

// The provider is optional: without it the hooks use the first player created.
// It is used here to make the dependency explicit.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlayerProvider player={player}>
      <App />
    </PlayerProvider>
  </StrictMode>,
);
