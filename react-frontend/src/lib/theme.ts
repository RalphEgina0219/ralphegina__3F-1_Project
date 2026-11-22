/**
 * Light and dark mode. One shared key for every interface (staff app, customer portal, sign-in
 * pages), the device setting as the default, and the choice remembered on this device. The inline
 * script in index.html applies the same rule before the first paint, so there is no flash.
 */
export type Theme = 'light' | 'dark';

export const THEME_KEY = 'laundryflow.theme';

export function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private windows and blocked storage: the choice lasts until the tab closes.
  }
}

export function systemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/** The remembered choice, otherwise the device setting. */
export function resolveTheme(stored: Theme | null, prefersDark: boolean): Theme {
  return stored ?? (prefersDark ? 'dark' : 'light');
}

export const currentTheme = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
