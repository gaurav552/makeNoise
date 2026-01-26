import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Link to the local MakeNoise library for development
      '@makenoise/core': path.resolve(__dirname, '../../src/index.ts'),
      '@makenoise/react': path.resolve(__dirname, '../../src/adapters/react/index.ts'),
    },
  },
});
