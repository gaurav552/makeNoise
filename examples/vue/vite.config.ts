import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { makenoiseAliases, sharedPublicDir } from '../aliases.ts';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  // `<mn-player>` is a custom element, not a Vue component.
  plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('mn-') } } })],
  resolve: { alias: makenoiseAliases },
  publicDir: sharedPublicDir,
  server: { open: true },
});
