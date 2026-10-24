import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Two library builds:
//  - default: ES modules for bundlers (`makenoise`, `makenoise/elements` and the framework bindings);
//    Howler and the frameworks stay external
//  - `--mode iife`: one <script> file with Howler and <mn-player> bundled, exposes `window.MakeNoise`
export default defineConfig(({ mode }) => {
  const iife = mode === 'iife';
  return {
    // Only the tests compile .svelte files (the Svelte binding's test components).
    plugins: process.env.VITEST ? [svelte()] : [],
    build: {
      emptyOutDir: !iife,
      sourcemap: true,
      lib: iife
        ? { entry: 'src/iife.ts', name: 'MakeNoise', formats: ['iife'], fileName: () => 'makenoise.iife.js' }
        : {
            entry: {
              makenoise: 'src/index.ts',
              elements: 'src/elements/index.ts',
              react: 'src/react/index.ts',
              vue: 'src/vue/index.ts',
              svelte: 'src/svelte/index.ts',
            },
            formats: ['es'],
            fileName: (_format, entry) => `${entry}.js`,
          },
      rollupOptions: {
        external: iife ? [] : ['howler', 'react', 'vue', /^svelte(\/|$)/],
        // The React binding uses hooks and context, so React Server Components must treat it as client code.
        output: iife ? undefined : { banner: (chunk) => (chunk.name === 'react' ? "'use client';" : '') },
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
    // Svelte's `mount` is only exported under the browser condition.
    resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
  };
});
