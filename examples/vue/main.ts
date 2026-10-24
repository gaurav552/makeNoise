import { createApp } from 'vue';
import { playerKey } from 'makenoise/vue';
import { player } from './player';
import App from './App.vue';
import '../vanilla/style.css';
import './style.css';

// Providing is optional (the composables fall back to the first player created),
// but it makes the dependency explicit and lets tests swap in another player.
createApp(App).provide(playerKey, player).mount('#app');
