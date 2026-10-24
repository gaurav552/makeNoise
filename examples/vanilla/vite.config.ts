import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { makenoiseAliases } from '../aliases.ts';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: makenoiseAliases },
  server: { open: true },
});
