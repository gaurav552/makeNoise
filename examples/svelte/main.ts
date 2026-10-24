import { mount } from 'svelte';
import '../vanilla/style.css'; // shared tokens (light + dark) and the playlist classes
import './player'; // create the player before any component asks for it
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
