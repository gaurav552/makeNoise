import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MediaPlayerProvider } from '@makenoise/react';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MediaPlayerProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MediaPlayerProvider>
  </React.StrictMode>,
);
