import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const src = (path: string) => fileURLToPath(new URL(`../../src/${path}`, import.meta.url));

// Serves the example and resolves `makenoise` straight to the library source,
// so edits to src/ hot-reload without a build step.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: [
      { find: /^makenoise\/elements$/, replacement: src('elements/index.ts') },
      { find: /^makenoise$/, replacement: src('index.ts') },
    ],
  },
  server: { open: true },
});
