import { defineConfig } from 'vitepress';
import { makenoiseAliases } from '../../examples/aliases.ts';

export default defineConfig({
  title: 'MakeNoise',
  description: 'A framework-agnostic audio player for single page applications, powered by Howler.js.',
  cleanUrls: true,
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6.5' fill='none' stroke='%23e3726c' stroke-width='1.5'/%3E%3Ccircle cx='8' cy='8' r='3' fill='%23e3726c'/%3E%3C/svg%3E",
      },
    ],
  ],
  lastUpdated: false,

  // The live demo imports the library straight from src/.
  vite: {
    resolve: { alias: makenoiseAliases },
  },
  // `<mn-player>` is a custom element, not a Vue component.
  vue: {
    template: {
      compilerOptions: { isCustomElement: (tag) => tag.startsWith('mn-') },
    },
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API', link: '/api/player', activeMatch: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Concepts', link: '/guide/concepts' },
            { text: 'The player UI', link: '/guide/player-ui' },
          ],
        },
        {
          text: 'Frameworks',
          items: [
            { text: 'React', link: '/guide/react' },
            { text: 'Vue', link: '/guide/vue' },
            { text: 'Svelte', link: '/guide/svelte' },
            { text: 'Other frameworks', link: '/guide/other-frameworks' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Keyboard shortcuts', link: '/guide/keyboard' },
            { text: 'Saving the session', link: '/guide/persistence' },
            { text: 'Server-side rendering', link: '/guide/ssr' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Player API', link: '/api/player' },
            { text: 'Audio engine', link: '/api/engine' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: 'Player', link: '/api/player' },
            { text: 'Audio engine', link: '/api/engine' },
          ],
        },
        {
          text: 'Guide',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Concepts', link: '/guide/concepts' },
            { text: 'The player UI', link: '/guide/player-ui' },
          ],
        },
      ],
    },

    search: { provider: 'local' },

    outline: { level: [2, 3] },

    footer: {
      message: 'Released under the MIT License.',
    },
  },
});
