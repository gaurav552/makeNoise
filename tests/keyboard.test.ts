// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bindKeyboard, type KeyboardOptions } from '../src/keyboard';
import { createPlayer, type Player } from '../src/player';
import { FakeEngine, tracks } from './helpers';

let player: Player;
let scope: HTMLElement;
let unbind: () => void;

function press(key: string, init: KeyboardEventInit = {}, target: Element = scope) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, composed: true, ...init });
  target.dispatchEvent(event);
  return event;
}

function bind(options?: KeyboardOptions, on: HTMLElement | Document = scope) {
  unbind = bindKeyboard(player, on, options);
}

beforeEach(() => {
  player = createPlayer({ engine: new FakeEngine(), mediaSession: false });
  player.play(tracks(3));
  scope = document.createElement('div');
  scope.innerHTML = '<button>b</button><input type="range"><textarea></textarea><span tabindex="0">s</span>';
  document.body.append(scope);
});

afterEach(() => {
  unbind?.();
  player.destroy();
  scope.remove();
});

const span = () => scope.querySelector('span')!;

describe('bindKeyboard', () => {
  it('runs the default actions', () => {
    bind();
    press(' ', {}, span());
    expect(player.getState().playing).toBe(false);
    press('k', {}, span());
    expect(player.getState().playing).toBe(true);

    press('ArrowRight', {}, span());
    expect(player.progress.get().currentTime).toBe(5);
    press('ArrowLeft', {}, span());
    expect(player.progress.get().currentTime).toBe(0);

    press('N', { shiftKey: true }, span());
    expect(player.getState().current?.track.id).toBe('t2');

    press('ArrowDown', {}, span());
    expect(player.getState().volume).toBeCloseTo(0.9);
    press('m', {}, span());
    expect(player.getState().muted).toBe(true);
    press('s', {}, span());
    expect(player.getState().shuffle).toBe(true);
    press('r', {}, span());
    expect(player.getState().repeat).toBe('all');
  });

  it('only listens inside its scope', () => {
    bind();
    const outside = document.createElement('p');
    document.body.append(outside);
    press('k', {}, outside);
    expect(player.getState().playing).toBe(true);
    outside.remove();
  });

  it('works page-wide when bound to the document', () => {
    bind(undefined, document);
    const outside = document.createElement('p');
    document.body.append(outside);
    press('k', {}, outside);
    expect(player.getState().playing).toBe(false);
    outside.remove();
  });

  it('leaves form controls, and Space on buttons, alone', () => {
    bind();
    expect(press('k', {}, scope.querySelector('textarea')!).defaultPrevented).toBe(false);
    expect(press('ArrowRight', {}, scope.querySelector('input')!).defaultPrevented).toBe(false);
    expect(press(' ', {}, scope.querySelector('button')!).defaultPrevented).toBe(false);
    expect(player.getState().playing).toBe(true);
    // Other keys still work from a button.
    expect(press('k', {}, scope.querySelector('button')!).defaultPrevented).toBe(true);
  });

  it('ignores modified keys, handled events, and an empty queue', () => {
    bind();
    press('k', { ctrlKey: true }, span());
    expect(player.getState().playing).toBe(true);

    span().addEventListener('keydown', (e) => e.preventDefault(), { once: true });
    press('k', {}, span());
    expect(player.getState().playing).toBe(true);

    player.clearQueue();
    expect(press('k', {}, span()).defaultPrevented).toBe(false);
  });

  it('accepts custom keys and steps', () => {
    bind({ keys: { toggle: ['p'], mute: false, next: ['Ctrl+ArrowRight'] }, seekStep: 10 });
    press('k', {}, span());
    expect(player.getState().playing).toBe(true);
    press('p', {}, span());
    expect(player.getState().playing).toBe(false);
    press('m', {}, span());
    expect(player.getState().muted).toBe(false);
    press('ArrowRight', {}, span());
    expect(player.progress.get().currentTime).toBe(10);
    press('ArrowRight', { ctrlKey: true }, span());
    expect(player.getState().current?.track.id).toBe('t2');
  });

  it('parses "+", Space, and Shift with symbols', () => {
    bind({ keys: { volumeUp: ['+'], volumeDown: ['Ctrl+-'], mute: ['Shift+?'], toggle: ['Space'] } });
    player.setVolume(0.5);
    press('+', { shiftKey: true }, span());
    expect(player.getState().volume).toBeCloseTo(0.6);
    press('-', { ctrlKey: true }, span());
    expect(player.getState().volume).toBeCloseTo(0.5);
    press('?', { shiftKey: true }, span());
    expect(player.getState().muted).toBe(true);
    press(' ', {}, span());
    expect(player.getState().playing).toBe(false);
  });

  it('ignores keydown events without a key', () => {
    bind(undefined, document);
    const event = new KeyboardEvent('keydown', { bubbles: true });
    Object.defineProperty(event, 'key', { value: undefined });
    expect(() => span().dispatchEvent(event)).not.toThrow();
  });

  it('reads the real target inside an open shadow root, and skips letters for closed ones', () => {
    bind(undefined, document);
    const open = document.createElement('open-widget');
    open.attachShadow({ mode: 'open' }).innerHTML = '<input>';
    const closed = document.createElement('closed-widget');
    closed.attachShadow({ mode: 'closed' });
    scope.append(open, closed);
    press('k', {}, open.shadowRoot!.querySelector('input')!);
    expect(player.getState().playing).toBe(true);
    press('k', {}, closed);
    expect(player.getState().playing).toBe(true);
  });

  it('stops when unbound', () => {
    bind();
    unbind();
    press('k', {}, span());
    expect(player.getState().playing).toBe(true);
  });
});
