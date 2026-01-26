/**
 * Vue Plugin for MakeNoise Player
 * 
 * Provides a Vue plugin that makes the MakeNoise player instance
 * available globally via app.config.globalProperties and app.provide().
 * 
 * Requirements: 12.4, 12.5
 */

import type { App, Plugin } from 'vue';
import { MakeNoise } from '../../core/MakeNoise';
// Import PlayerUI to register the custom element
import '../../ui/PlayerUI';

/**
 * MediaPlayerPlugin for Vue
 * 
 * Installs the MakeNoise player as a global property and provides it
 * to all components via Vue's provide/inject system.
 * 
 * After installation:
 * - Access via `this.$player` in Options API components
 * - Access via `inject('player')` in Composition API components
 * 
 * @example
 * ```typescript
 * // main.ts
 * import { createApp } from 'vue';
 * import { MediaPlayerPlugin } from '@makenoise/vue';
 * import App from './App.vue';
 * 
 * const app = createApp(App);
 * app.use(MediaPlayerPlugin);
 * app.mount('#app');
 * ```
 * 
 * @example
 * ```vue
 * <!-- Using in Composition API -->
 * <script setup>
 * import { inject } from 'vue';
 * 
 * const player = inject('player');
 * 
 * const handlePlay = () => {
 *   player.play();
 * };
 * </script>
 * ```
 * 
 * @example
 * ```vue
 * <!-- Using in Options API -->
 * <script>
 * export default {
 *   methods: {
 *     handlePlay() {
 *       this.$player.play();
 *     }
 *   }
 * }
 * </script>
 * ```
 */
export const MediaPlayerPlugin: Plugin = {
  install(app: App) {
    // Get the singleton Player instance
    const player = MakeNoise.getInstance();

    // Make player available via app.config.globalProperties
    // This allows access via `this.$player` in Options API components
    app.config.globalProperties.$player = player;

    // Provide player instance to all components
    // This allows access via `inject('player')` in Composition API components
    app.provide('player', player);
  }
};

// Augment Vue's ComponentCustomProperties interface to add type support for $player
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $player: MakeNoise;
  }
}
