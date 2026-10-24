import { fileURLToPath } from 'node:url';
import type { Alias } from 'vite';

const src = (path: string) => fileURLToPath(new URL(`../src/${path}`, import.meta.url));

/**
 * Resolves `makenoise` and its subpaths straight to the library source,
 * so edits to src/ hot-reload in every example without a build step.
 */
export const makenoiseAliases: Alias[] = [
  { find: /^makenoise\/elements$/, replacement: src('elements/index.ts') },
  { find: /^makenoise\/react$/, replacement: src('react/index.ts') },
  { find: /^makenoise\/vue$/, replacement: src('vue/index.ts') },
  { find: /^makenoise\/svelte$/, replacement: src('svelte/index.ts') },
  { find: /^makenoise$/, replacement: src('index.ts') },
];

/** The generated test tones live in the vanilla example; the other examples share them. */
export const sharedPublicDir = fileURLToPath(new URL('./vanilla/public', import.meta.url));
