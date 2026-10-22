// One consistent icon family: 24×24 grid, 1.6 stroke, round joins.
const svg = (body: string, fill = false) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="${fill ? 'currentColor' : 'none'}" stroke="${fill ? 'none' : 'currentColor'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const icons = {
  play: svg('<path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5Z"/>', true),
  pause: svg('<rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/>', true),
  previous: svg('<path d="M6 5.5v13"/><path d="M18.5 6.2v11.6a.7.7 0 0 1-1.1.6L9.6 12.6a.7.7 0 0 1 0-1.2l7.8-5.8a.7.7 0 0 1 1.1.6Z"/>'),
  next: svg('<path d="M18 5.5v13"/><path d="M5.5 6.2v11.6a.7.7 0 0 0 1.1.6l7.8-5.8a.7.7 0 0 0 0-1.2L6.6 5.6a.7.7 0 0 0-1.1.6Z"/>'),
  shuffle: svg('<path d="M3.5 7h3.2c1.4 0 2.6.7 3.4 1.8l3.8 6.4c.8 1.1 2 1.8 3.4 1.8h3.2"/><path d="m18 14.5 2.5 2.5-2.5 2.5"/><path d="M3.5 17h3.2c.9 0 1.7-.3 2.4-.8"/><path d="M14.2 7.8c.7-.5 1.5-.8 2.4-.8h3.9"/><path d="m18 4.5 2.5 2.5L18 9.5"/>'),
  repeat: svg('<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19"/><path d="m16.5 3.5 2.5 2.5-2.5 2.5"/><path d="M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5"/><path d="m7.5 20.5-2.5-2.5 2.5-2.5"/>'),
  repeatOne: svg('<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19"/><path d="m16.5 3.5 2.5 2.5-2.5 2.5"/><path d="M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5"/><path d="m7.5 20.5-2.5-2.5 2.5-2.5"/><path d="M11.2 10.6 12.6 9.8v4.6"/>'),
  volumeHigh: svg('<path d="M4 9.5v5h3l4.5 3.8V5.7L7 9.5H4Z"/><path d="M15.3 9.2a4 4 0 0 1 0 5.6"/><path d="M17.9 6.6a7.6 7.6 0 0 1 0 10.8"/>'),
  volumeLow: svg('<path d="M4 9.5v5h3l4.5 3.8V5.7L7 9.5H4Z"/><path d="M15.3 9.2a4 4 0 0 1 0 5.6"/>'),
  volumeMute: svg('<path d="M4 9.5v5h3l4.5 3.8V5.7L7 9.5H4Z"/><path d="m15.5 9.5 5 5"/><path d="m20.5 9.5-5 5"/>'),
  queue: svg('<path d="M4 6.5h11"/><path d="M4 11.5h11"/><path d="M4 16.5h6"/><path d="M17.5 13.5v6"/><circle cx="15.8" cy="19.2" r="1.8"/><path d="M17.5 13.5 20 12.6"/>'),
  close: svg('<path d="m6.5 6.5 11 11"/><path d="m17.5 6.5-11 11"/>'),
  grip: svg('<circle cx="9.5" cy="7" r=".9"/><circle cx="14.5" cy="7" r=".9"/><circle cx="9.5" cy="12" r=".9"/><circle cx="14.5" cy="12" r=".9"/><circle cx="9.5" cy="17" r=".9"/><circle cx="14.5" cy="17" r=".9"/>'),
} as const;
