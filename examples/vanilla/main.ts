import { createPlayer, type PlayerSession, type QueueItem } from 'makenoise';
import 'makenoise/elements';
import { playlists } from './library';

// One player for the whole app, created outside any component/route so it survives navigation.
// <mn-player> in index.html picks it up automatically.
const player = createPlayer();
// Handy for poking at it from the browser console.
(window as unknown as { player: typeof player }).player = player;

const $ = <E extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as E;
const hud = document.querySelector('mn-player')!;

// On the docs site, link back to it.
const docsUrl = import.meta.env.VITE_SITE_BASE;
if (docsUrl) Object.assign($<HTMLAnchorElement>('docs-link'), { href: docsUrl, hidden: false });

// ---------------------------------------------------------------------------
// The application's playlists
// ---------------------------------------------------------------------------

const pristine = JSON.stringify(playlists);

function renderPlaylists() {
  $('playlists').innerHTML = playlists
    .map(
      (playlist) => `
      <section class="playlist">
        <div class="playlist-head">
          <div>
            <h3>${esc(playlist.name)}</h3>
            <p>${esc(playlist.description)}</p>
          </div>
        </div>
        <div class="playlist-actions">
          <button class="pill solid" data-action="play-all" data-playlist="${playlist.id}">Play</button>
          <button class="pill" data-action="shuffle-all" data-playlist="${playlist.id}">Shuffle</button>
        </div>
        <ol class="tracks">
          ${playlist.tracks
            .map(
              (track, index) => `
            <li class="track">
              <button class="track-main" data-action="play-from" data-playlist="${playlist.id}" data-index="${index}" title="Play the playlist from here">
                <span class="t">${esc(track.title ?? track.id)}</span>
                <span class="a">${esc(track.artist ?? '')}</span>
              </button>
              <span class="track-actions">
                <button class="mini" data-action="play-next" data-playlist="${playlist.id}" data-index="${index}" title="Play after the current track">Next</button>
                <button class="mini" data-action="add" data-playlist="${playlist.id}" data-index="${index}" title="Add to the end of the queue">Queue</button>
              </span>
            </li>`,
            )
            .join('')}
        </ol>
      </section>`,
    )
    .join('');
}

$('playlists').addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!button) return;
  const playlist = playlists.find((p) => p.id === button.dataset.playlist)!;
  const index = Number(button.dataset.index);
  const track = playlist.tracks[index]!;

  switch (button.dataset.action) {
    case 'play-all':
      return player.play(playlist.tracks, { startIndex: 0, shuffle: false });
    case 'shuffle-all':
      return player.play(playlist.tracks, { shuffle: true });
    case 'play-from':
      return player.play(playlist.tracks, { startIndex: index });
    case 'play-next':
      return player.playNext(track);
    case 'add':
      return player.addToQueue(track);
  }
});

player.on('queuechange', () => {
  const ok = JSON.stringify(playlists) === pristine;
  const badge = $('integrity');
  badge.textContent = ok ? 'Unchanged by the player' : 'Changed by the player!';
  badge.classList.toggle('bad', !ok);
});

// ---------------------------------------------------------------------------
// Player appearance: plain attributes on <mn-player>
// ---------------------------------------------------------------------------

$<HTMLSelectElement>('position').addEventListener('change', (e) => {
  hud.setAttribute('position', (e.target as HTMLSelectElement).value);
});
$<HTMLSelectElement>('theme').addEventListener('change', (e) => {
  const theme = (e.target as HTMLSelectElement).value;
  hud.setAttribute('theme', theme);
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = theme;
});

$<HTMLInputElement>('artwork').addEventListener('change', (e) => {
  hud.toggleAttribute('artwork', (e.target as HTMLInputElement).checked);
});
hud.addEventListener('accentchange', (e) => log('accentchange', (e as CustomEvent<{ accent: string }>).detail.accent));

// ---------------------------------------------------------------------------
// Session persistence: the APP decides where to keep it
// ---------------------------------------------------------------------------

const SESSION_KEY = 'makenoise-example-session';
$('save-session').onclick = () => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(player.serialize()));
  log('app', 'session saved to localStorage');
};
$('restore-session').onclick = () => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return log('app', 'no saved session yet');
  player.restore(JSON.parse(raw) as PlayerSession);
  log('app', 'session restored, paused');
};

// ---------------------------------------------------------------------------
// Event log
// ---------------------------------------------------------------------------

function log(name: string, detail = '') {
  const li = document.createElement('li');
  const time = new Date().toLocaleTimeString([], { hour12: false });
  li.innerHTML = `<time>${time}</time> <b class="ev-${name}">${name}</b> ${esc(detail)}`;
  const list = $('log');
  list.prepend(li);
  while (list.children.length > 60) list.lastElementChild!.remove();
}

const title = (item: QueueItem | null) => item?.track.title ?? 'nothing';
player.on('trackchange', (current, previous) => log('trackchange', `${title(previous)} → ${title(current)}`));
player.on('queuechange', (queue) => log('queuechange', `${queue.length} in queue`));
player.on('play', (item) => log('play', title(item)));
player.on('pause', (item) => log('pause', title(item)));
player.on('trackend', (item) => log('trackend', title(item)));
player.on('queueend', () => log('queueend'));
player.on('error', (error) => log('error', `${title(error.item)}: ${error.message}`));
player.on('blocked', () => log('blocked', 'autoplay blocked by the browser'));

function esc(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

renderPlaylists();
