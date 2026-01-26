import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should have working test infrastructure', () => {
    expect(true).toBe(true);
  });

  it('should have localStorage mock', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });

  it('should have HTMLAudioElement mock', () => {
    const audio = new HTMLAudioElement();
    expect(audio).toBeDefined();
    expect(audio.volume).toBe(1);
  });
});
