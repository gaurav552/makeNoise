import { MakeNoisePlayerElement } from './player-element.js';

export { MakeNoisePlayerElement };
export { accents, type AccentName } from './accents.js';

/** Registers `<mn-player>`. Safe to call more than once, and a no-op during server-side rendering. */
export function defineElements(): void {
  if (typeof customElements === 'undefined') return;
  if (!customElements.get('mn-player')) customElements.define('mn-player', MakeNoisePlayerElement);
}

defineElements();

declare global {
  interface HTMLElementTagNameMap {
    'mn-player': MakeNoisePlayerElement;
  }
}
