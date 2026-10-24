// Builds the public site: the VitePress docs, with the four example apps under /examples/<name>/
// and the generated test tones once under /audio/.
// Usage: node scripts/build-site.mjs   (SITE_BASE defaults to /makeNoise/, the GitHub Pages path)
import { execFileSync } from 'node:child_process';
import { cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', '.vitepress', 'dist');
const env = { ...process.env, SITE_BASE: process.env.SITE_BASE ?? '/makeNoise/' };
const examples = ['vanilla', 'react', 'vue', 'svelte'];

const run = (...args) => execFileSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
const bin = (pkg, file) => join(root, 'node_modules', pkg, 'bin', file);

run(join(root, 'scripts', 'generate-tones.mjs'));

// VitePress empties dist/ first, so it goes before the examples.
run(bin('vitepress', 'vitepress.js'), 'build', 'docs');

for (const name of examples) {
  run(bin('vite', 'vite.js'), 'build', '--config', `examples/${name}/vite.config.ts`, '--outDir', join(out, 'examples', name), '--emptyOutDir');
}

cpSync(join(root, 'examples', 'vanilla', 'public', 'audio'), join(out, 'audio'), { recursive: true });

console.log(`\nSite built in ${out} (base ${env.SITE_BASE})`);
