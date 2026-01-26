import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { MediaPlayerPlugin } from '@makenoise/vue';
import App from './App.vue';
import HomePage from './pages/HomePage.vue';
import PlaylistPage from './pages/PlaylistPage.vue';
import AboutPage from './pages/AboutPage.vue';
import './style.css';

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/playlist', component: PlaylistPage },
    { path: '/about', component: AboutPage },
  ],
});

// Create and mount app
const app = createApp(App);

// Install MakeNoise plugin
app.use(MediaPlayerPlugin);

// Install router
app.use(router);

// Mount app
app.mount('#app');
