// Lets plain `tsc` follow imports of .svelte files. The components themselves are compiled by Vite.
declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component;
  export default component;
}
