import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEME_KEY, readStoredTheme, resolveTheme, storeTheme } from './theme';

const html = readFileSync(path.resolve(import.meta.dirname, '../../index.html'), 'utf8');
/** The inline script in index.html that runs before the first paint. */
const bootScript = /<script>\s*([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';

function runBoot({
  stored,
  dark,
  storageThrows = false,
}: {
  stored?: string;
  dark: boolean;
  storageThrows?: boolean;
}) {
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
  if (stored) localStorage.setItem(THEME_KEY, stored);
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: dark && query.includes('dark') }));
  if (storageThrows) {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
  }
  new Function(bootScript)();
  return document.documentElement.dataset.theme;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('resolveTheme', () => {
  it('follows the device when nothing is remembered', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('prefers the remembered choice over the device', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('the remembered choice', () => {
  it('is stored under one shared key and read back', () => {
    storeTheme('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(readStoredTheme()).toBe('dark');
  });

  it('ignores a garbled value and a blocked storage', () => {
    localStorage.setItem(THEME_KEY, 'purple');
    expect(readStoredTheme()).toBeNull();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStoredTheme()).toBeNull();
  });
});

describe('the pre-paint script in index.html', () => {
  it('exists', () => {
    expect(bootScript).toContain('laundryflow.theme');
  });

  it('applies the device setting without a remembered choice', () => {
    expect(runBoot({ dark: true })).toBe('dark');
    expect(runBoot({ dark: false })).toBe('light');
  });

  it('applies the remembered choice before the device setting', () => {
    expect(runBoot({ stored: 'light', dark: true })).toBe('light');
    expect(runBoot({ stored: 'dark', dark: false })).toBe('dark');
  });

  it('falls back to the device when storage is blocked, and agrees with resolveTheme', () => {
    expect(runBoot({ dark: true, storageThrows: true })).toBe('dark');
    vi.restoreAllMocks();
    for (const stored of [undefined, 'light', 'dark'] as const) {
      for (const dark of [true, false]) {
        expect(runBoot({ stored, dark })).toBe(resolveTheme(stored ?? null, dark));
      }
    }
  });
});
