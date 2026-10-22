import { defineConfig } from 'vitest/config';

// Two library builds:
//  - default: ES modules for bundlers (`makenoise` and `makenoise/elements`), Howler stays external
//  - `--mode iife`: one <script> file with Howler and <mn-player> bundled, exposes `window.MakeNoise`
export default defineConfig(({ mode }) => {
  const iife = mode === 'iife';
  return {
    build: {
      emptyOutDir: !iife,
      sourcemap: true,
      lib: iife
        ? { entry: 'src/iife.ts', name: 'MakeNoise', formats: ['iife'], fileName: () => 'makenoise.iife.js' }
        : {
            entry: { makenoise: 'src/index.ts', elements: 'src/elements/index.ts' },
            formats: ['es'],
            fileName: (_format, entry) => `${entry}.js`,
          },
      rollupOptions: {
        external: iife ? [] : ['howler'],
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  };
});
