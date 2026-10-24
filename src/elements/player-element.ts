import { getDefaultPlayer, onDefaultPlayer } from '../default-player';
import { bindKeyboard } from '../keyboard';
import type { Player } from '../player';
import type { PlayerState, ProgressState, QueueItem, Track } from '../types';
import { accents, isAccentName, type AccentName } from './accents';
import { icons } from './icons';
import { styles } from './styles';

// Lets the module be imported during server-side rendering, where HTMLElement doesn't exist.
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

const RING = 2 * Math.PI * 23;
const HOVER_IN_MS = 110;
const HOVER_OUT_MS = 320;
const REST_AFTER_MS = 2600;
const WHISPER_MS = 3600;
const ACCENT_KEY = 'makenoise-accent';

const swatches = Object.entries(accents)
  .map(
    ([name, color]) =>
      `<button class="swatch" type="button" role="radio" aria-checked="false" tabindex="-1" data-accent="${name}" aria-label="${name[0]!.toUpperCase()}${name.slice(1)}" style="--swatch: ${color}"></button>`,
  )
  .join('');

const template = /* html */ `
<style>${styles}</style>
<div class="hud empty" part="hud">
  <section class="queue surface" part="queue" id="queue" aria-label="Queue">
    <div class="q-head">
      <h2 class="q-heading">Queue</h2>
      <span class="q-count"></span>
      <span class="spacer"></span>
      <button class="text-btn q-clear" type="button">Clear upcoming</button>
      <button class="btn q-close" type="button" aria-label="Close queue">${icons.close}</button>
    </div>
    <div class="q-scroll">
      <ol class="q-list"></ol>
      <p class="q-empty" hidden>The queue is empty. Tracks you add will show up here.</p>
    </div>
  </section>
  <div class="card-wrap">
    <div class="card-plate" aria-hidden="true"></div>
    <div class="medallion-plate" aria-hidden="true"></div>
    <section class="card surface" part="card" aria-label="Audio player">
      <div class="info-row fade">
        <div class="info">
          <p class="title" part="title"></p>
          <p class="artist" part="artist"></p>
          <p class="message" role="status"></p>
        </div>
        <button class="btn swatch-btn" type="button" aria-label="Player color" aria-expanded="false" aria-controls="palette"><span class="swatch-dot"></span></button>
      </div>
      <div class="palette fade" id="palette" role="radiogroup" aria-label="Player color" hidden>${swatches}</div>
      <div class="seek fade">
        <span class="time cur">0:00</span>
        <input class="seek-input" part="seek" type="range" min="0" max="0" step="any" value="0" aria-label="Seek" />
        <span class="time end">0:00</span>
      </div>
      <div class="controls" part="controls">
        <button class="btn fade shuffle" type="button" aria-label="Shuffle" aria-pressed="false">${icons.shuffle}</button>
        <button class="btn fade strong prev" type="button" aria-label="Previous">${icons.previous}</button>
        <button class="btn fade strong next" type="button" aria-label="Next">${icons.next}</button>
        <button class="btn fade repeat" type="button" aria-label="Repeat: off" aria-pressed="false">${icons.repeat}</button>
        <span class="spacer"></span>
        <div class="volume fade">
          <button class="btn mute" type="button" aria-label="Mute">${icons.volumeHigh}</button>
          <input class="volume-input" type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume" />
        </div>
        <button class="btn fade queue-toggle" type="button" aria-label="Show queue" aria-expanded="false" aria-controls="queue">${icons.queue}</button>
        <button class="medallion" part="medallion" type="button" aria-label="Play">
          <img class="art" alt="" decoding="async" />
          <span class="glyph"><span class="i-play">${icons.play}</span><span class="i-pause">${icons.pause}</span></span>
          <svg class="ring" viewBox="0 0 48 48" aria-hidden="true">
            <circle class="track" cx="24" cy="24" r="23" />
            <circle class="fill" cx="24" cy="24" r="23" stroke-dasharray="${RING}" stroke-dashoffset="${RING}" />
          </svg>
        </button>
      </div>
    </section>
    <div class="whisper surface" part="whisper" aria-hidden="true"><span class="w-title"></span><span class="w-sub"></span></div>
  </div>
</div>`;

interface Drag {
  row: HTMLElement;
  rows: HTMLElement[];
  from: number;
  to: number;
  startY: number;
  startScroll: number;
  height: number;
  pointerId: number;
}

/**
 * `<mn-player>` — a small player that lives in a corner of the page.
 *
 * Collapsed it's a single medallion: a play/pause button inside a progress ring. Hovering or
 * focusing it unfolds a compact card with controls; the queue opens from there.
 *
 * Attributes:
 *  - `position`: `bottom-left` (default) | `bottom-right` | `top-left` | `top-right`
 *  - `theme`: `auto` (default, follows the OS) | `light` | `dark`
 *  - `always-visible`: show the medallion even when nothing is queued
 *  - `quiet`: don't briefly show the track title when it changes
 *  - `no-font-download`: don't fetch Nunito Sans from Google Fonts (self-host it, or use the fallback fonts)
 *  - `accent`: `red` (default) | `orange` | `green` | `teal` | `blue` | `purple`
 *  - `no-color-picker`: hide the color picker (it also stops restoring the listener's saved color)
 *  - `artwork`: show the track's artwork in the medallion
 *  - `keyboard`: keyboard shortcuts while focus is in the player; `keyboard="global"` for the whole page
 *
 * Events: `accentchange` (detail: `{ accent }`) when the listener picks a color.
 *
 * It uses the first player created with `createPlayer()`, or the one assigned to `.player`.
 */
export class MakeNoisePlayerElement extends Base {
  static observedAttributes = ['position', 'always-visible', 'accent', 'artwork', 'keyboard'];

  private root!: ShadowRoot;
  private hud!: HTMLElement;
  private els!: ReturnType<MakeNoisePlayerElement['query']>;

  private currentPlayer: Player<Track> | null = null;
  private assignedPlayer: Player<Track> | null = null;
  private unsubscribers: (() => void)[] = [];
  private offDefault: (() => void) | null = null;
  private offKeyboard: (() => void) | null = null;
  private state: PlayerState<Track> | null = null;

  // Why the card is open. It stays expanded while any of these hold.
  private hovering = false;
  private keyboardFocus = false;
  private queueOpen = false;
  private touchOpen = false;
  private interacting = false;

  private keyboardMode = false;
  private seeking = false;
  private suppressClick = false;
  private showHistory = false;
  private queueDirty = true;
  private focusQidAfterRender: string | null = null;
  private skippedTitle: string | null = null;
  private lastErrorShown: unknown = null;
  private drag: Drag | null = null;
  private timers: Partial<Record<'hover' | 'rest' | 'whisper', ReturnType<typeof setTimeout>>> = {};

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = template;
    this.hud = this.root.querySelector('.hud')!;
    this.els = this.query();
    this.bindEvents();
  }

  /** The player this element controls. Defaults to the first player created. */
  get player(): Player<Track> | null {
    return this.currentPlayer;
  }

  set player(player: Player<Track> | null) {
    this.assignedPlayer = player;
    if (this.isConnected) this.connectPlayer();
  }

  /** Open the card (it stays open until `collapse()` or the pointer leaves). */
  expand(): void {
    this.touchOpen = true;
    this.updateExpanded();
  }

  collapse(): void {
    this.touchOpen = false;
    this.hovering = false;
    this.keyboardFocus = false;
    this.setQueueOpen(false);
  }

  toggleQueue(open = !this.queueOpen): void {
    this.setQueueOpen(open);
  }

  connectedCallback(): void {
    if (!this.hasAttribute('no-font-download')) loadFont();
    if (!this.hasAttribute('no-color-picker')) {
      const saved = readSavedAccent();
      if (saved) this.setAttribute('accent', saved);
    }
    this.applyPosition();
    this.applyAccent();
    this.connectPlayer();
    document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
    document.addEventListener('keydown', this.onDocumentKeyDown, true);
  }

  disconnectedCallback(): void {
    this.disconnectPlayer();
    this.offDefault?.();
    this.offDefault = null;
    document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    document.removeEventListener('keydown', this.onDocumentKeyDown, true);
    for (const timer of Object.values(this.timers)) clearTimeout(timer);
  }

  attributeChangedCallback(name: string): void {
    if (name === 'position') this.applyPosition();
    if ((name === 'always-visible' || name === 'artwork') && this.state) this.render(this.state);
    if (name === 'accent') this.applyAccent();
    if (name === 'keyboard' && this.isConnected) this.applyKeyboard();
  }

  /** `keyboard` (or `keyboard="focus"`): shortcuts while focus is in the player. `keyboard="global"`: anywhere on the page. */
  private applyKeyboard() {
    this.offKeyboard?.();
    this.offKeyboard = null;
    const mode = this.getAttribute('keyboard');
    if (mode === null || mode === 'false' || !this.currentPlayer) return;
    this.offKeyboard = bindKeyboard(this.currentPlayer, mode === 'global' ? document : this);
  }

  // ---------------------------------------------------------------------------
  // Player connection
  // ---------------------------------------------------------------------------

  private connectPlayer() {
    const player = this.assignedPlayer ?? getDefaultPlayer();
    if (!this.assignedPlayer && !this.offDefault) {
      this.offDefault = onDefaultPlayer(() => this.isConnected && !this.assignedPlayer && this.connectPlayer());
    }
    if (player === this.currentPlayer) return;
    this.disconnectPlayer();
    this.currentPlayer = player;
    this.applyKeyboard();
    if (!player) {
      this.hud.classList.add('empty');
      return;
    }
    this.queueDirty = true;
    this.unsubscribers = [
      player.state.subscribe((state) => this.render(state)),
      player.progress.subscribe((progress) => this.renderProgress(progress)),
      player.on('trackchange', (current) => this.onTrackChange(current)),
      player.on('error', (error) => {
        this.skippedTitle = error.item?.track.title ?? 'A track';
      }),
      player.on('blocked', () => this.whisper('Press play to start', 'The browser blocked autoplay')),
    ];
  }

  private disconnectPlayer() {
    this.offKeyboard?.();
    this.offKeyboard = null;
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
    this.currentPlayer = null;
    this.state = null;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  private query() {
    const $ = <E extends Element = HTMLElement>(selector: string) => this.root.querySelector(selector) as E;
    return {
      card: $('.card'),
      queue: $('.queue'),
      title: $('.title'),
      artist: $('.artist'),
      message: $('.message'),
      current: $('.time.cur'),
      end: $('.time.end'),
      seek: $<HTMLInputElement>('.seek-input'),
      shuffle: $('.shuffle'),
      prev: $('.prev'),
      next: $('.next'),
      repeat: $('.repeat'),
      mute: $('.mute'),
      volume: $<HTMLInputElement>('.volume-input'),
      volumeGroup: $('.volume'),
      queueToggle: $('.queue-toggle'),
      medallion: $('.medallion'),
      art: $<HTMLImageElement>('.art'),
      ringFill: $<SVGCircleElement>('.ring .fill'),
      swatchButton: $('.swatch-btn'),
      palette: $('.palette'),
      whisperTitle: $('.w-title'),
      whisperSub: $('.w-sub'),
      count: $('.q-count'),
      clear: $('.q-clear'),
      close: $('.q-close'),
      scroll: $('.q-scroll'),
      list: $<HTMLOListElement>('.q-list'),
      empty: $('.q-empty'),
    };
  }

  private render(state: PlayerState<Track>) {
    const previous = this.state;
    this.state = state;
    const els = this.els;
    const track = state.current?.track;
    const empty = state.queue.length === 0 && !this.hasAttribute('always-visible');

    this.hud.classList.toggle('empty', empty);
    this.hud.classList.toggle('playing', state.playing);
    this.hud.classList.toggle('loading', state.playing && state.status === 'loading');
    if (empty) {
      this.setQueueOpen(false);
      this.touchOpen = false;
      this.updateExpanded();
    }

    const title = track?.title ?? (track ? 'Untitled' : 'Nothing playing');
    setText(els.title, title);
    els.title.title = title;
    setText(els.artist, track?.artist ?? '');

    let message = '';
    if (state.blocked) message = 'Autoplay was blocked. Press play to start.';
    else if (state.status === 'error' && state.error) message = `Couldn't play this track. ${state.error.message}.`;
    else if (state.status === 'ended') message = 'End of queue. Press play to start over.';
    setText(els.message, message);
    if (state.status === 'error' && state.error && state.error !== this.lastErrorShown) {
      this.lastErrorShown = state.error;
      this.whisper(`Couldn't play “${state.error.item?.track.title ?? 'this track'}”`, state.error.message);
    }

    const artwork = track?.artwork ?? '';
    if (els.art.getAttribute('src') !== artwork) {
      if (artwork) els.art.src = artwork;
      else els.art.removeAttribute('src');
    }
    els.medallion.classList.toggle('has-art', Boolean(artwork) && this.hasAttribute('artwork'));
    els.medallion.setAttribute('aria-label', state.playing ? 'Pause' : 'Play');

    els.shuffle.setAttribute('aria-pressed', String(state.shuffle));
    els.repeat.setAttribute('aria-pressed', String(state.repeat !== 'off'));
    els.repeat.setAttribute('aria-label', `Repeat: ${state.repeat}`);
    if (previous?.repeat !== state.repeat) els.repeat.innerHTML = state.repeat === 'one' ? icons.repeatOne : icons.repeat;

    const silent = state.muted || state.volume === 0;
    const volumeIcon = silent ? icons.volumeMute : state.volume < 0.5 ? icons.volumeLow : icons.volumeHigh;
    if (els.mute.innerHTML !== volumeIcon) els.mute.innerHTML = volumeIcon;
    els.mute.setAttribute('aria-label', silent ? 'Unmute' : 'Mute');
    const shownVolume = state.muted ? 0 : state.volume;
    els.volume.value = String(shownVolume);
    els.volume.style.setProperty('--pct', `${shownVolume * 100}%`);

    if (previous?.queue !== state.queue || previous?.currentIndex !== state.currentIndex) this.queueDirty = true;
    if (this.queueOpen && this.queueDirty && !this.drag) this.renderQueue();
  }

  private renderProgress({ currentTime, duration }: ProgressState) {
    const els = this.els;
    const fraction = duration > 0 ? Math.min(1, currentTime / duration) : 0;
    els.ringFill.style.strokeDashoffset = String(RING * (1 - fraction));
    if (this.seeking) return;
    els.seek.max = String(duration || 0);
    els.seek.value = String(currentTime);
    els.seek.style.setProperty('--pct', `${fraction * 100}%`);
    els.seek.setAttribute('aria-valuetext', `${formatTime(currentTime)} of ${formatTime(duration)}`);
    setText(els.current, formatTime(currentTime));
    setText(els.end, formatTime(duration));
  }

  private renderQueue() {
    const state = this.state;
    if (!state) return;
    this.queueDirty = false;
    const els = this.els;
    const { queue, currentIndex } = state;

    const focusedQid =
      this.focusQidAfterRender ?? (this.root.activeElement?.closest<HTMLElement>('.q-row')?.dataset.qid ?? null);
    this.focusQidAfterRender = null;

    const played = Math.max(0, currentIndex);
    const upcoming = queue.length - currentIndex - 1;
    setText(els.count, queue.length === 1 ? '1 track' : `${queue.length} tracks`);
    els.clear.hidden = upcoming <= 0 || currentIndex === -1;
    els.empty.hidden = queue.length > 0;

    const items: HTMLElement[] = [];
    if (played > 0) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'text-btn q-history';
      toggle.textContent = this.showHistory ? 'Hide played' : played === 1 ? 'Show 1 played' : `Show ${played} played`;
      toggle.setAttribute('aria-expanded', String(this.showHistory));
      const li = document.createElement('li');
      li.append(toggle);
      items.push(li);
      if (this.showHistory) queue.slice(0, played).forEach((item, i) => items.push(this.queueRow(item, i, 'played')));
    }
    if (currentIndex >= 0) {
      items.push(label('Now playing'));
      items.push(this.queueRow(queue[currentIndex]!, currentIndex, 'current'));
    }
    const nextFrom = currentIndex + 1;
    if (nextFrom < queue.length) {
      items.push(label('Up next'));
      queue.slice(nextFrom).forEach((item, i) => items.push(this.queueRow(item, nextFrom + i, 'upcoming')));
    }
    els.list.replaceChildren(...items);

    if (focusedQid) this.focusRow(focusedQid);
  }

  private queueRow(item: QueueItem<Track>, index: number, kind: 'played' | 'current' | 'upcoming') {
    const li = document.createElement('li');
    li.className = `q-row ${kind}`;
    li.dataset.qid = item.qid;
    li.dataset.index = String(index);

    const grip = document.createElement('span');
    grip.className = 'q-grip';
    grip.setAttribute('aria-hidden', 'true');
    grip.innerHTML = icons.grip;

    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'q-main';
    if (kind === 'current') main.setAttribute('aria-current', 'true');
    const title = document.createElement('span');
    title.className = 'q-title';
    title.textContent = item.track.title ?? 'Untitled';
    const artist = document.createElement('span');
    artist.className = 'q-artist';
    artist.textContent = item.track.artist ?? '';
    main.append(title, artist);
    main.title = 'Play · Alt+↑/↓ to move · Delete to remove';

    const time = document.createElement('span');
    time.className = 'q-time';
    const duration = kind === 'current' ? this.currentPlayer?.progress.get().duration || item.track.duration : item.track.duration;
    time.textContent = duration ? formatTime(duration) : '';

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn q-remove';
    remove.setAttribute('aria-label', `Remove ${item.track.title ?? 'track'} from the queue`);
    remove.innerHTML = icons.close;

    li.append(grip, main, time, remove);
    return li;
  }

  private focusRow(qid: string) {
    this.els.list.querySelector<HTMLElement>(`.q-row[data-qid="${CSS.escape(qid)}"] .q-main`)?.focus();
  }

  // ---------------------------------------------------------------------------
  // Expanded / collapsed, whisper, resting
  // ---------------------------------------------------------------------------

  private updateExpanded() {
    const empty = this.hud.classList.contains('empty');
    const expanded = !empty && (this.hovering || this.keyboardFocus || this.queueOpen || this.touchOpen || this.interacting);
    const was = this.hud.classList.contains('expanded');
    if (expanded === was) return;
    this.hud.classList.toggle('expanded', expanded);
    if (expanded) {
      this.hud.classList.remove('resting', 'announcing');
      clearTimeout(this.timers.rest);
    } else {
      this.setPaletteOpen(false);
      this.scheduleRest();
    }
  }

  private scheduleRest() {
    clearTimeout(this.timers.rest);
    this.hud.classList.remove('resting');
    this.timers.rest = setTimeout(() => {
      if (!this.hud.classList.contains('expanded')) this.hud.classList.add('resting');
    }, REST_AFTER_MS);
  }

  private onTrackChange(current: QueueItem<Track> | null) {
    if (!current) return;
    const skipped = this.skippedTitle;
    this.skippedTitle = null;
    if (this.hasAttribute('quiet') && !skipped) return;
    const title = current.track.title ?? 'Untitled';
    if (skipped) this.whisper(title, `Skipped “${skipped}” because it couldn't load`, WHISPER_MS + 1500);
    else this.whisper(title, current.track.artist ?? '');
  }

  private whisper(title: string, sub: string, duration = WHISPER_MS) {
    if (this.hud.classList.contains('expanded')) return;
    setText(this.els.whisperTitle, title);
    setText(this.els.whisperSub, sub);
    this.hud.classList.add('announcing');
    this.scheduleRest();
    clearTimeout(this.timers.whisper);
    this.timers.whisper = setTimeout(() => this.hud.classList.remove('announcing'), duration);
  }

  private setQueueOpen(open: boolean) {
    if (open && this.hud.classList.contains('empty')) open = false;
    if (this.queueOpen === open) return;
    this.queueOpen = open;
    this.hud.classList.toggle('queue-open', open);
    this.els.queueToggle.setAttribute('aria-expanded', String(open));
    this.els.queueToggle.setAttribute('aria-label', open ? 'Hide queue' : 'Show queue');
    if (open) {
      if (this.queueDirty) this.renderQueue();
      const current = this.els.list.querySelector<HTMLElement>('.q-row.current');
      // Bring the current track near the top, keeping a little of what came before in view.
      if (current) this.els.scroll.scrollTop = Math.max(0, current.offsetTop - 96);
    }
    this.updateExpanded();
  }

  private applyAccent() {
    const current = this.getAttribute('accent');
    for (const swatch of this.els.palette.querySelectorAll<HTMLElement>('.swatch')) {
      const checked = swatch.dataset.accent === (isAccentName(current) ? current : 'red');
      swatch.setAttribute('aria-checked', String(checked));
      swatch.tabIndex = checked ? 0 : -1;
    }
  }

  /** Called when the listener picks a color: apply it, remember it, and tell the app. */
  private pickAccent(accent: AccentName) {
    this.setAttribute('accent', accent);
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      // Storage unavailable (private mode, blocked): the choice lasts for this page only.
    }
    this.dispatchEvent(new CustomEvent('accentchange', { detail: { accent }, bubbles: true, composed: true }));
  }

  private setPaletteOpen(open: boolean) {
    const palette = this.els.palette;
    if (palette.hidden === !open) return;
    palette.hidden = !open;
    this.els.swatchButton.setAttribute('aria-expanded', String(open));
  }

  private applyPosition() {
    const position = this.getAttribute('position') ?? 'bottom-left';
    this.hud.classList.toggle('top', position.startsWith('top'));
    this.hud.classList.toggle('left', position.endsWith('left'));
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  private bindEvents() {
    const els = this.els;
    const player = () => this.currentPlayer;

    // Hover with a little intent on the way in and some grace on the way out.
    for (const surface of [els.card, els.queue]) {
      surface.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        clearTimeout(this.timers.hover);
        this.timers.hover = setTimeout(() => {
          this.hovering = true;
          this.updateExpanded();
        }, HOVER_IN_MS);
      });
      surface.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'touch') return;
        clearTimeout(this.timers.hover);
        this.timers.hover = setTimeout(() => {
          this.hovering = false;
          this.updateExpanded();
        }, HOVER_OUT_MS);
      });
    }

    // Keyboard focus opens the card; a mouse click on a button doesn't pin it open.
    this.hud.addEventListener('focusin', () => {
      if (!this.keyboardMode) return;
      this.keyboardFocus = true;
      this.updateExpanded();
    });
    this.hud.addEventListener('focusout', (e) => {
      const next = e.relatedTarget as Node | null;
      if (next && this.root.contains(next)) return;
      this.keyboardFocus = false;
      this.updateExpanded();
    });
    this.hud.addEventListener('keydown', (e) => this.onKeyDown(e));

    // On touch, the first tap opens the card instead of toggling playback.
    els.medallion.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' && !this.hud.classList.contains('expanded')) {
        this.suppressClick = true;
        this.touchOpen = true;
        this.updateExpanded();
      }
    });
    els.medallion.addEventListener('click', () => {
      if (this.suppressClick) {
        this.suppressClick = false;
        return;
      }
      player()?.toggle();
    });

    els.prev.addEventListener('click', () => player()?.previous());
    els.next.addEventListener('click', () => player()?.next());
    els.shuffle.addEventListener('click', () => player()?.toggleShuffle());
    els.repeat.addEventListener('click', () => player()?.cycleRepeat());
    els.mute.addEventListener('click', () => player()?.toggleMute());
    els.queueToggle.addEventListener('click', () => this.setQueueOpen(!this.queueOpen));
    els.close.addEventListener('click', () => {
      this.setQueueOpen(false);
      els.queueToggle.focus();
    });
    els.clear.addEventListener('click', () => player()?.clearUpcoming());

    els.swatchButton.addEventListener('click', () => {
      const open = Boolean(els.palette.hidden);
      this.setPaletteOpen(open);
      if (open && this.keyboardMode) els.palette.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    });
    els.palette.addEventListener('click', (e) => {
      const swatch = (e.target as HTMLElement).closest<HTMLElement>('.swatch');
      if (!swatch || !isAccentName(swatch.dataset.accent)) return;
      this.pickAccent(swatch.dataset.accent);
      this.setPaletteOpen(false);
      if (this.keyboardMode) els.swatchButton.focus();
    });
    // Radio group keys: arrows move the selection.
    els.palette.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const all = [...els.palette.querySelectorAll<HTMLElement>('.swatch')];
      const next = all[(all.indexOf(e.target as HTMLElement) + step + all.length) % all.length]!;
      if (isAccentName(next.dataset.accent)) this.pickAccent(next.dataset.accent);
      next.focus();
    });

    // Seeking: preview while dragging, seek on release.
    const startInteracting = () => {
      this.interacting = true;
      this.updateExpanded();
      window.addEventListener(
        'pointerup',
        () => {
          this.interacting = false;
          this.updateExpanded();
        },
        { once: true },
      );
    };
    els.seek.addEventListener('pointerdown', () => {
      this.seeking = true;
      startInteracting();
    });
    els.seek.addEventListener('input', () => {
      this.seeking = true;
      const value = Number(els.seek.value);
      const max = Number(els.seek.max) || 1;
      els.seek.style.setProperty('--pct', `${(value / max) * 100}%`);
      setText(els.current, formatTime(value));
    });
    els.seek.addEventListener('change', () => {
      player()?.seek(Number(els.seek.value));
      this.seeking = false;
    });

    els.volume.addEventListener('pointerdown', startInteracting);
    els.volume.addEventListener('input', () => player()?.setVolume(Number(els.volume.value)));
    els.volumeGroup.addEventListener(
      'wheel',
      (e) => {
        const p = player();
        if (!p) return;
        e.preventDefault();
        p.setVolume(p.getState().volume - Math.sign(e.deltaY) * 0.05);
      },
      { passive: false },
    );

    // Queue rows (delegated).
    els.list.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.q-history')) {
        this.showHistory = !this.showHistory;
        this.focusQidAfterRender = null;
        this.renderQueue();
        this.els.list.querySelector<HTMLElement>('.q-history')?.focus();
        return;
      }
      const row = target.closest<HTMLElement>('.q-row');
      if (!row) return;
      const qid = row.dataset.qid!;
      if (target.closest('.q-remove')) this.removeRow(row);
      else if (target.closest('.q-main')) player()?.jumpTo(qid);
    });
    els.list.addEventListener('pointerdown', (e) => {
      const grip = (e.target as HTMLElement).closest<HTMLElement>('.q-grip');
      if (grip) this.startDrag(e, grip.closest<HTMLElement>('.q-row')!);
    });
  }

  private onDocumentPointerDown = (e: PointerEvent) => {
    this.keyboardMode = false;
    if (!e.composedPath().includes(this) && this.touchOpen) {
      this.touchOpen = false;
      this.updateExpanded();
    }
  };

  private onDocumentKeyDown = (e: KeyboardEvent) => {
    if (typeof e.key !== 'string') return;
    if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Enter' || e.key === ' ') this.keyboardMode = true;
  };

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.drag) return this.endDrag(true);
      if (!this.els.palette.hidden) {
        this.setPaletteOpen(false);
        this.els.swatchButton.focus();
        e.stopPropagation();
        return;
      }
      if (this.queueOpen) {
        this.setQueueOpen(false);
        this.els.queueToggle.focus();
      } else {
        this.touchOpen = false;
        this.keyboardFocus = false;
        (this.root.activeElement as HTMLElement | null)?.blur();
        this.updateExpanded();
      }
      e.stopPropagation();
      return;
    }

    const main = (e.target as HTMLElement).closest('.q-main');
    const row = main?.closest<HTMLElement>('.q-row');
    if (!row || !this.state) return;
    const qid = row.dataset.qid!;
    const index = Number(row.dataset.index);

    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      this.focusQidAfterRender = qid;
      this.currentPlayer?.move(qid, index + (e.key === 'ArrowUp' ? -1 : 1));
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const rows = [...this.els.list.querySelectorAll<HTMLElement>('.q-row')];
      const next = rows[rows.indexOf(row) + (e.key === 'ArrowUp' ? -1 : 1)];
      next?.querySelector<HTMLElement>('.q-main')?.focus();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.removeRow(row);
    }
  }

  private removeRow(row: HTMLElement) {
    // Keep keyboard focus in the list: move it to the neighbouring row.
    const rows = [...this.els.list.querySelectorAll<HTMLElement>('.q-row')];
    const at = rows.indexOf(row);
    const neighbour = rows[at + 1] ?? rows[at - 1];
    if (this.root.activeElement && row.contains(this.root.activeElement)) {
      this.focusQidAfterRender = neighbour?.dataset.qid ?? null;
    }
    this.currentPlayer?.remove(row.dataset.qid!);
  }

  // ---------------------------------------------------------------------------
  // Drag to reorder (pointer events, so it works with touch too)
  // ---------------------------------------------------------------------------

  private startDrag(e: PointerEvent, row: HTMLElement) {
    if (e.button !== 0 || this.drag) return;
    e.preventDefault();
    const rows = [...this.els.list.querySelectorAll<HTMLElement>('.q-row')];
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    this.drag = {
      row,
      rows,
      from: rows.indexOf(row),
      to: rows.indexOf(row),
      startY: e.clientY,
      startScroll: this.els.scroll.scrollTop,
      height: row.getBoundingClientRect().height,
      pointerId: e.pointerId,
    };
    row.classList.add('dragging');
    rows.forEach((r) => r !== row && r.classList.add('shifting'));
    this.interacting = true;
    this.updateExpanded();

    const move = (ev: PointerEvent) => this.moveDrag(ev);
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      this.endDrag(false);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  }

  private moveDrag(e: PointerEvent) {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const scroll = this.els.scroll;

    // Scroll the list when dragging near its edges.
    const bounds = scroll.getBoundingClientRect();
    if (e.clientY < bounds.top + 32) scroll.scrollTop -= 8;
    else if (e.clientY > bounds.bottom - 32) scroll.scrollTop += 8;

    const dy = e.clientY - drag.startY + (scroll.scrollTop - drag.startScroll);
    drag.row.style.transform = `translateY(${dy}px)`;

    const center = drag.row.offsetTop + drag.height / 2 + dy;
    let to = drag.from;
    drag.rows.forEach((r, i) => {
      const middle = r.offsetTop + r.offsetHeight / 2;
      if (i > drag.from && center > middle) to = i;
      if (i < drag.from && center < middle && to === drag.from) to = i;
    });
    if (to === drag.to) return;
    drag.to = to;
    drag.rows.forEach((r, i) => {
      if (r === drag.row) return;
      let shift = 0;
      if (drag.from < to && i > drag.from && i <= to) shift = -drag.height;
      if (drag.from > to && i < drag.from && i >= to) shift = drag.height;
      r.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  }

  private endDrag(cancel: boolean) {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    drag.rows.forEach((r) => {
      r.style.transform = '';
      r.classList.remove('dragging', 'shifting');
    });
    this.interacting = false;
    this.updateExpanded();
    if (!cancel && drag.to !== drag.from) {
      this.focusQidAfterRender = null;
      this.currentPlayer?.move(drag.row.dataset.qid!, Number(drag.rows[drag.to]!.dataset.index));
    } else if (this.queueDirty) {
      this.renderQueue();
    }
  }
}

function readSavedAccent(): AccentName | null {
  try {
    const saved = localStorage.getItem(ACCENT_KEY);
    return isAccentName(saved) ? saved : null;
  } catch {
    return null;
  }
}

const FONT_FAMILY = 'Nunito Sans';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,300..700&display=swap';

/**
 * Fonts declared inside a shadow root are ignored by some browsers, so the font is
 * registered on the page. Skipped when the page already provides it.
 */
function loadFont() {
  if (document.querySelector('link[data-makenoise-font], link[href*="Nunito+Sans"]')) return;
  // Not iterable in some non-browser DOMs (jsdom), where there is nothing to check anyway.
  const faces: Iterable<FontFace> = document.fonts && Symbol.iterator in document.fonts ? document.fonts : [];
  for (const face of faces) {
    if (face.family.replace(/["']/g, '') === FONT_FAMILY) return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONT_URL;
  link.dataset.makenoiseFont = '';
  document.head.append(link);
}

function label(text: string) {
  const li = document.createElement('li');
  li.className = 'q-label';
  li.textContent = text;
  return li;
}

function setText(el: Element, text: string) {
  if (el.textContent !== text) el.textContent = text;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
