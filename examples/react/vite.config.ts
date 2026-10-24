import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { makenoiseAliases, sharedPublicDir } from '../aliases.ts';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: makenoiseAliases },
  publicDir: sharedPublicDir,
  plugins: [react()],
  server: { open: true },
});
