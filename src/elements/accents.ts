/**
 * Built-in pastel accent colors. Listeners can pick one in the player; apps can set one
 * with `<mn-player accent="green">`, or use any color with the `--mn-accent` property.
 */
export const accents = {
  red: '#e3726c',
  orange: '#eb9a5c',
  green: '#6fb98a',
  teal: '#5fb5b0',
  blue: '#6f9fe0',
  purple: '#a68ad8',
} as const;

export type AccentName = keyof typeof accents;

export const DEFAULT_ACCENT: AccentName = 'red';

export function isAccentName(value: unknown): value is AccentName {
  return typeof value === 'string' && Object.hasOwn(accents, value);
}
