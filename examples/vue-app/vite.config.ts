import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        // Register custom element to avoid Vue warnings
        isCustomElement: (tag) => tag === 'make-noise-player'
      }
    }
  })],
  resolve: {
    alias: {
      // Link to the local MakeNoise library for development
      '@makenoise/core': path.resolve(__dirname, '../../src/index.ts'),
      '@makenoise/vue': path.resolve(__dirname, '../../src/adapters/vue/index.ts'),
    },
  },
});
