import { useSyncExternalStore } from 'react';

export type DisplayMode = 'standalone' | 'minimal-ui' | 'browser';

const QUERIES: [DisplayMode, string][] = [
  // An installed app on a desktop may run fullscreen or with window controls overlay.
  ['standalone', '(display-mode: standalone)'],
  ['standalone', '(display-mode: fullscreen)'],
  ['standalone', '(display-mode: window-controls-overlay)'],
  ['minimal-ui', '(display-mode: minimal-ui)'],
];

/** Which window LaundryFlow runs in. iOS reports a Home Screen app through navigator.standalone. */
export function getDisplayMode(): DisplayMode {
  if ((navigator as Navigator & { standalone?: boolean }).standalone) return 'standalone';
  for (const [mode, query] of QUERIES) {
    if (window.matchMedia?.(query).matches) return mode;
  }
  return 'browser';
}

function subscribe(notify: () => void) {
  const lists = QUERIES.map(([, query]) => window.matchMedia?.(query)).filter(Boolean);
  lists.forEach((list) => list.addEventListener('change', notify));
  return () => lists.forEach((list) => list.removeEventListener('change', notify));
}

/** Installed (standalone) or in a browser tab. Updates when the app moves between the two. */
export function useDisplayMode(): { mode: DisplayMode; standalone: boolean } {
  const mode = useSyncExternalStore(subscribe, getDisplayMode, () => 'browser' as const);
  return { mode, standalone: mode === 'standalone' };
}
