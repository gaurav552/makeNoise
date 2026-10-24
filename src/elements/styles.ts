import { accents, DEFAULT_ACCENT } from './accents.js';

// Styles for <mn-player>. Everything a page should customise is a --mn-* custom property
// on the element, or a ::part(). Page styles override these defaults.
const accentRules = Object.entries(accents)
  .map(([name, color]) => `:host([accent='${name}']) { --mn-accent: ${color}; }`)
  .join('\n');

export const styles = /* css */ `
:host {
  --mn-accent: ${accents[DEFAULT_ACCENT]};
  /* Accent for text and icons. Pastels are too light to read on light surfaces, so it's darkened there. */
  --mn-accent-ink: color-mix(in srgb, var(--mn-accent) 60%, #000);
  --mn-surface: rgb(251 249 245 / 0.84);
  --mn-surface-solid: #fbf9f5;
  --mn-text: #1e1b17;
  --mn-muted: rgb(30 27 23 / 0.6);
  --mn-line: rgb(30 27 23 / 0.12);
  --mn-hover: rgb(30 27 23 / 0.06);
  --mn-highlight: rgb(255 255 255 / 0.5);
  --mn-shadow: 0 1px 2px rgb(20 16 10 / 0.08), 0 12px 32px -8px rgb(20 16 10 / 0.22);

  --mn-font-title: 'Nunito Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --mn-font-ui: 'Nunito Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --mn-title-weight: 300;
  --mn-width: 340px;
  --mn-radius: 24px;
  --mn-offset-x: 20px;
  --mn-offset-y: 20px;
  --mn-z: 2147483000;

  --pad: 12px;
  --m: 48px;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  position: fixed;
  left: var(--mn-offset-x);
  bottom: var(--mn-offset-y);
  z-index: var(--mn-z);
  width: min(var(--mn-width), calc(100vw - 2 * var(--mn-offset-x)));
  pointer-events: none;
  color: var(--mn-text);
  font-family: var(--mn-font-ui);
  -webkit-font-smoothing: antialiased;
}

/* theme="auto" (default) follows the OS; "light" and "dark" force one. */
:host([theme='light']) { color-scheme: light; }
:host([theme='dark']) {
  color-scheme: dark;
  --mn-accent-ink: var(--mn-accent);
  --mn-surface: rgb(30 28 26 / 0.8);
  --mn-surface-solid: #1e1c1a;
  --mn-text: #f3efe7;
  --mn-muted: rgb(243 239 231 / 0.58);
  --mn-line: rgb(243 239 231 / 0.13);
  --mn-hover: rgb(243 239 231 / 0.08);
  --mn-highlight: rgb(255 255 255 / 0.07);
  --mn-shadow: 0 1px 2px rgb(0 0 0 / 0.3), 0 16px 40px -10px rgb(0 0 0 / 0.6);
}
@media (prefers-color-scheme: dark) {
  :host(:not([theme='light']):not([theme='dark'])) {
    color-scheme: dark;
    --mn-accent-ink: var(--mn-accent);
    --mn-surface: rgb(30 28 26 / 0.8);
    --mn-surface-solid: #1e1c1a;
    --mn-text: #f3efe7;
    --mn-muted: rgb(243 239 231 / 0.58);
    --mn-line: rgb(243 239 231 / 0.13);
    --mn-hover: rgb(243 239 231 / 0.08);
    --mn-highlight: rgb(255 255 255 / 0.07);
    --mn-shadow: 0 1px 2px rgb(0 0 0 / 0.3), 0 16px 40px -10px rgb(0 0 0 / 0.6);
  }
}

:host([position='bottom-right']), :host([position='top-right']) { left: auto; right: var(--mn-offset-x); }
:host([position='top-right']), :host([position='top-left']) { bottom: auto; top: var(--mn-offset-y); }
:host([hidden]) { display: none; }
${accentRules}

*, *::before, *::after { box-sizing: border-box; }
button { font: inherit; color: inherit; margin: 0; border: 0; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
p, h2, ol { margin: 0; padding: 0; }
svg { display: block; flex: none; }
:focus-visible { outline: 2px solid var(--mn-accent-ink); outline-offset: 2px; }

/* ------------------------------------------------------------------ layout */

.hud { display: flex; flex-direction: column; gap: 8px; position: relative; }
.hud.top { flex-direction: column-reverse; }

.surface {
  background: var(--mn-surface);
  -webkit-backdrop-filter: blur(22px) saturate(1.5);
  backdrop-filter: blur(22px) saturate(1.5);
  box-shadow: inset 0 0 0 1px var(--mn-line), inset 0 1px 0 var(--mn-highlight);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .surface { background: var(--mn-surface-solid); }
}

/* --------------------------------------------------- card: medallion ⇄ card */

.card-wrap { position: relative; }

/* The card's shadow lives on a separate plate: clip-path would cut it off. */
.card-plate, .medallion-plate { position: absolute; pointer-events: none; box-shadow: var(--mn-shadow); }
.card-plate { inset: 0; border-radius: var(--mn-radius); opacity: 0; transition: opacity 160ms var(--ease-out); }
.medallion-plate { width: var(--m); height: var(--m); border-radius: 50%; right: var(--pad); bottom: var(--pad); }
.left .medallion-plate { right: auto; left: var(--pad); }
.top .medallion-plate { bottom: auto; top: var(--pad); }

.card {
  --clip: inset(calc(100% - var(--pad) - var(--m)) var(--pad) var(--pad) calc(100% - var(--pad) - var(--m)) round calc(var(--m) / 2));
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px var(--pad) var(--pad) 16px;
  border-radius: var(--mn-radius);
  clip-path: var(--clip);
  pointer-events: auto;
  transition: clip-path 190ms var(--ease-out);
}
.left .card { --clip: inset(calc(100% - var(--pad) - var(--m)) calc(100% - var(--pad) - var(--m)) var(--pad) var(--pad) round calc(var(--m) / 2)); padding: 14px 16px var(--pad) var(--pad); }
.top .card { --clip: inset(var(--pad) var(--pad) calc(100% - var(--pad) - var(--m)) calc(100% - var(--pad) - var(--m)) round calc(var(--m) / 2)); flex-direction: column-reverse; padding: var(--pad) var(--pad) 14px 16px; }
.top.left .card { --clip: inset(var(--pad) calc(100% - var(--pad) - var(--m)) calc(100% - var(--pad) - var(--m)) var(--pad) round calc(var(--m) / 2)); padding: var(--pad) 16px 14px var(--pad); }

.expanded .card { clip-path: inset(0 0 0 0 round var(--mn-radius)); transition: clip-path 280ms var(--ease-drawer); }
.expanded .card-plate { opacity: 1; transition: opacity 220ms var(--ease-out) 40ms; }

/* Everything except the medallion fades in after the surface starts unfolding,
   and out immediately when it folds away. */
.fade { opacity: 0; transition: opacity 90ms var(--ease-out); }
.expanded .fade { opacity: 1; transition: opacity 180ms var(--ease-out) 70ms, color 120ms ease, background-color 120ms ease, transform 140ms var(--ease-out); }

/* Resting: the collapsed medallion recedes after a few seconds untouched. */
.card-wrap { transition: opacity 120ms var(--ease-out); }
.resting:not(.expanded) .card-wrap { opacity: var(--mn-rest-opacity, 0.55); transition: opacity 900ms ease; }

/* Hidden while there's nothing to play; appears from its corner. */
.empty .card-wrap, .empty .whisper { opacity: 0; transform: scale(0.94); visibility: hidden; }
.card-wrap { transform-origin: bottom right; transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out), visibility 0s; }
.left .card-wrap { transform-origin: bottom left; }
.top .card-wrap { transform-origin: top right; }
.top.left .card-wrap { transform-origin: top left; }

/* ------------------------------------------------------------------- info */

.info-row { display: flex; align-items: flex-start; gap: 6px; }
.info { flex: 1; min-width: 0; }
.swatch-btn { width: 28px; height: 28px; margin: -4px -4px 0 0; }
.left .swatch-btn { margin: -4px -6px 0 0; }
.swatch-btn::after { display: none; }
.swatch-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--mn-accent); box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08); }
:host([no-color-picker]) .swatch-btn { display: none; }

.palette { display: flex; align-items: center; gap: 10px; padding: 2px 0 2px 1px; }
.palette[hidden] { display: none; }
.swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--swatch);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
  transition: box-shadow 120ms ease, transform 140ms var(--ease-out);
}
.swatch:active { transform: scale(0.92); }
.swatch[aria-checked='true'] { box-shadow: 0 0 0 2px var(--mn-surface-solid), 0 0 0 3.5px var(--swatch); }
.swatch:focus-visible { outline-offset: 4px; }
@media (hover: hover) and (pointer: fine) {
  .swatch:not([aria-checked='true']):hover { box-shadow: 0 0 0 2px var(--mn-surface-solid), 0 0 0 3.5px var(--mn-line); }
}
.title {
  font-family: var(--mn-font-title);
  font-weight: var(--mn-title-weight);
  font-size: 16px;
  line-height: 1.3;
  letter-spacing: 0.002em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.artist { margin-top: 3px; font-size: 12.5px; color: var(--mn-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.message { margin-top: 6px; font-size: 12px; color: var(--mn-accent-ink); }
.message:empty { display: none; }

/* ------------------------------------------------------------------- seek */

.seek { display: flex; align-items: center; gap: 10px; }
.time { font-size: 11px; font-variant-numeric: tabular-nums; color: var(--mn-muted); min-width: 30px; }
.time.end { text-align: right; }

input[type='range'] {
  --pct: 0%;
  flex: 1;
  min-width: 0;
  height: 18px;
  margin: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}
input[type='range']::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(to right, var(--mn-accent) var(--pct), var(--mn-line) var(--pct));
}
input[type='range']::-moz-range-track { height: 3px; border-radius: 3px; background: var(--mn-line); }
input[type='range']::-moz-range-progress { height: 3px; border-radius: 3px; background: var(--mn-accent); }
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 11px;
  height: 11px;
  margin-top: -4px;
  border-radius: 50%;
  background: var(--mn-text);
  opacity: 0;
  transform: scale(0.7);
  transition: opacity 120ms ease, transform 140ms var(--ease-out);
}
input[type='range']::-moz-range-thumb { width: 11px; height: 11px; border: 0; border-radius: 50%; background: var(--mn-text); opacity: 0; transform: scale(0.7); transition: opacity 120ms ease, transform 140ms var(--ease-out); }
input[type='range']:focus-visible { outline: none; }
input[type='range']:focus-visible::-webkit-slider-thumb { opacity: 1; transform: none; box-shadow: 0 0 0 3px var(--mn-accent-ink); }
input[type='range']:focus-visible::-moz-range-thumb { opacity: 1; transform: none; box-shadow: 0 0 0 3px var(--mn-accent-ink); }
input[type='range']:active::-webkit-slider-thumb { opacity: 1; transform: none; }
input[type='range']:active::-moz-range-thumb { opacity: 1; transform: none; }
@media (hover: hover) and (pointer: fine) {
  input[type='range']:hover::-webkit-slider-thumb { opacity: 1; transform: none; }
  input[type='range']:hover::-moz-range-thumb { opacity: 1; transform: none; }
}
@media (pointer: coarse) {
  input[type='range']::-webkit-slider-thumb { opacity: 1; transform: none; }
  input[type='range']::-moz-range-thumb { opacity: 1; transform: none; }
}

/* --------------------------------------------------------------- controls */

.controls { display: flex; align-items: center; gap: 2px; height: var(--m); }
.spacer { flex: 1; }

.btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  color: var(--mn-muted);
  transition: color 120ms ease, background-color 120ms ease, transform 140ms var(--ease-out);
}
.btn:active { transform: scale(0.94); }
.btn[aria-pressed='true'], .btn[aria-expanded='true'] { color: var(--mn-accent-ink); }
.btn[aria-pressed='true']::after, .btn[aria-expanded='true']::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 3px;
  height: 3px;
  margin-left: -1.5px;
  border-radius: 50%;
  background: currentColor;
}
.btn.strong { color: var(--mn-text); }
@media (hover: hover) and (pointer: fine) {
  .btn:hover { color: var(--mn-text); background: var(--mn-hover); }
  .btn[aria-pressed='true']:hover, .btn[aria-expanded='true']:hover { color: var(--mn-accent-ink); }
}

.volume { display: flex; align-items: center; }
.volume input { flex: none; width: 64px; margin-right: 4px; }
.volume input::-webkit-slider-runnable-track { background: linear-gradient(to right, var(--mn-text) var(--pct), var(--mn-line) var(--pct)); }
.volume input::-moz-range-progress { background: var(--mn-text); }

/* -------------------------------------------------------------- medallion */

.medallion {
  position: relative;
  flex: none;
  width: var(--m);
  height: var(--m);
  margin-left: 4px;
  border-radius: 50%;
  background: var(--mn-surface-solid);
  color: var(--mn-text);
  transition: transform 140ms var(--ease-out);
}
.left .medallion { order: -1; margin: 0 4px 0 0; }
.medallion:active { transform: scale(0.95); }
.medallion:focus-visible { outline-offset: 3px; }

.art, .glyph { position: absolute; inset: 5px; border-radius: 50%; }
.art { width: calc(100% - 10px); height: calc(100% - 10px); object-fit: cover; }
.medallion:not(.has-art) .art { display: none; }

.glyph {
  display: grid;
  place-items: center;
  color: var(--mn-accent-ink);
  background: radial-gradient(circle at 32% 26%, color-mix(in srgb, var(--mn-accent) 36%, var(--mn-surface-solid)), color-mix(in srgb, var(--mn-accent) 12%, var(--mn-surface-solid)) 78%);
  opacity: 1;
  transition: opacity 140ms ease;
}
.has-art .glyph { color: #fff; background: rgb(12 10 8 / 0.42); }
.glyph svg { width: 16px; height: 16px; }
.glyph .i-pause { display: none; }
.playing .glyph .i-play { display: none; }
.playing .glyph .i-pause { display: block; }

/* With artwork, the collapsed medallion shows just the artwork while playing; the control shows on hover. */
.playing:not(.expanded) .has-art .glyph { opacity: 0; }
@media (hover: hover) and (pointer: fine) {
  .playing:not(.expanded) .medallion.has-art:hover .glyph { opacity: 1; }
}

.ring { position: absolute; inset: 0; transform: rotate(-90deg); pointer-events: none; }
.ring circle { fill: none; stroke-width: 1.75; }
.ring .track { stroke: var(--mn-line); }
.ring .fill { stroke: var(--mn-accent); stroke-linecap: round; transition: stroke-dashoffset 250ms linear; }
.loading .ring { animation: mn-spin 0.9s linear infinite; }
.loading .ring .fill { stroke-dashoffset: 108 !important; transition: none; }
@keyframes mn-spin { to { transform: rotate(270deg); } }

/* ---------------------------------------------------------------- whisper */

.whisper {
  position: absolute;
  bottom: var(--pad);
  right: calc(var(--pad) + var(--m) + 10px);
  max-width: min(260px, calc(100vw - var(--m) - 80px));
  min-height: var(--m);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 6px 16px;
  border-radius: calc(var(--m) / 2);
  pointer-events: none;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 160ms var(--ease-out), transform 160ms var(--ease-out);
  box-shadow: inset 0 0 0 1px var(--mn-line), var(--mn-shadow);
}
.left .whisper { right: auto; left: calc(var(--pad) + var(--m) + 10px); transform: translateX(-6px); }
.top .whisper { bottom: auto; top: var(--pad); }
.announcing:not(.expanded) .whisper { opacity: 1; transform: none; transition-duration: 240ms; }
.w-title { font-family: var(--mn-font-title); font-weight: var(--mn-title-weight); font-size: 14px; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-sub { font-size: 11.5px; color: var(--mn-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-sub:empty { display: none; }

/* ------------------------------------------------------------------ queue */

.queue {
  display: flex;
  flex-direction: column;
  max-height: min(52vh, 440px);
  border-radius: 20px;
  box-shadow: inset 0 0 0 1px var(--mn-line), inset 0 1px 0 var(--mn-highlight), var(--mn-shadow);
  pointer-events: auto;
  transform-origin: bottom center;
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  visibility: hidden;
  transition: opacity 140ms var(--ease-out), transform 140ms var(--ease-out), visibility 0s 140ms;
}
.top .queue { transform-origin: top center; transform: translateY(-8px) scale(0.98); }
.queue-open .queue { opacity: 1; transform: none; visibility: visible; transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out), visibility 0s; }

.q-head { display: flex; align-items: center; gap: 8px; padding: 10px 8px 6px 16px; }
.q-heading { font-size: 13px; font-weight: 600; }
.q-count { font-size: 12px; color: var(--mn-muted); font-variant-numeric: tabular-nums; }
.q-head .spacer { flex: 1; }
.text-btn { font-size: 12px; color: var(--mn-muted); padding: 5px 8px; border-radius: 8px; transition: color 120ms ease, background-color 120ms ease; }
@media (hover: hover) and (pointer: fine) { .text-btn:hover { color: var(--mn-text); background: var(--mn-hover); } }
.text-btn[hidden] { display: none; }

.q-scroll { overflow-y: auto; overscroll-behavior: contain; padding: 0 6px 8px; scrollbar-width: thin; scrollbar-color: var(--mn-line) transparent; }
.q-list { list-style: none; position: relative; }
.q-label { font-size: 11.5px; font-weight: 600; color: var(--mn-muted); padding: 10px 10px 4px; }
.q-history { display: block; width: 100%; text-align: left; margin: 2px 0; }
.q-empty { padding: 22px 16px 26px; font-size: 13px; color: var(--mn-muted); text-align: center; line-height: 1.45; }

.q-row {
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto 28px;
  align-items: center;
  height: 50px;
  padding: 0 2px 0 0;
  border-radius: 12px;
  transition: background-color 120ms ease;
}
.q-row.played { opacity: 0.55; }
.q-row.current { background: color-mix(in srgb, var(--mn-accent) 18%, transparent); }
.q-row.current .q-title { color: var(--mn-accent-ink); }
@media (hover: hover) and (pointer: fine) { .q-row:hover { background: var(--mn-hover); } .q-row.current:hover { background: color-mix(in srgb, var(--mn-accent) 24%, transparent); } }

.q-grip { display: grid; place-items: center; height: 100%; color: var(--mn-muted); cursor: grab; touch-action: none; opacity: 0; transition: opacity 120ms ease; }
.q-grip svg { width: 14px; height: 14px; }
.q-row:focus-within .q-grip, .q-row.dragging .q-grip { opacity: 1; }
@media (hover: hover) and (pointer: fine) { .q-row:hover .q-grip { opacity: 1; } }
@media (pointer: coarse) { .q-grip { opacity: 0.6; } }

.q-main { display: flex; flex-direction: column; justify-content: center; min-width: 0; height: 100%; text-align: left; padding-right: 8px; border-radius: 8px; }
.q-main:focus-visible { outline-offset: -2px; }
.q-title { font-family: var(--mn-font-title); font-weight: var(--mn-title-weight); font-size: 14.5px; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.q-artist { font-size: 11.5px; color: var(--mn-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.q-time { font-size: 11px; color: var(--mn-muted); font-variant-numeric: tabular-nums; padding-right: 2px; }
.q-remove { width: 28px; height: 28px; opacity: 0; }
.q-remove svg { width: 14px; height: 14px; }
.q-row:focus-within .q-remove { opacity: 1; }
@media (hover: hover) and (pointer: fine) { .q-row:hover .q-remove { opacity: 1; } }
@media (pointer: coarse) { .q-remove { opacity: 0.7; } }

.q-row.dragging { z-index: 2; background: var(--mn-surface-solid); box-shadow: var(--mn-shadow); cursor: grabbing; transition: none; }
.q-row.shifting { transition: transform 160ms var(--ease-out); }

/* ---------------------------------------------------------- touch & motion */

@media (pointer: coarse) {
  .volume input { display: none; }
  .btn { width: 38px; height: 38px; }
}

@media (prefers-reduced-motion: reduce) {
  .card, .expanded .card { transition: none; }
  .whisper, .queue, .queue-open .queue { transform: none; }
  .loading .ring { animation: none; }
  .loading .ring .fill { stroke-dashoffset: 72 !important; }
  .q-row.shifting { transition: none; }
}
`;
