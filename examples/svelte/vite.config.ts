import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { makenoiseAliases, sharedPublicDir } from '../aliases.ts';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: here('.'),
  // Point the plugin at this folder's svelte.config.js explicitly, whatever the cwd.
  plugins: [svelte({ configFile: here('./svelte.config.js') })],
  resolve: { alias: makenoiseAliases },
  publicDir: sharedPublicDir,
  server: { open: true },
});
