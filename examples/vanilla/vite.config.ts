import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { exampleSiteOptions, makenoiseAliases } from '../aliases.ts';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: makenoiseAliases },
  ...exampleSiteOptions('vanilla'),
  server: { open: true },
});
