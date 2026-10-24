import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { exampleSiteOptions, makenoiseAliases } from '../aliases.ts';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: makenoiseAliases },
  ...exampleSiteOptions('react'),
  plugins: [react()],
  server: { open: true },
});
