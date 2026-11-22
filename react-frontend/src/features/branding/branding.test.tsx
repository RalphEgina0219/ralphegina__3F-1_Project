import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STATUS_META } from '@/lib/status';
import { ThemeProvider } from '../theme/ThemeProvider';
import { ThemeToggle } from '../theme/ThemeToggle';
import {
  applyBranding,
  brandName,
  brandSlug,
  cacheBranding,
  DEFAULT_BRANDING,
  readCachedBranding,
  reportFooter,
} from './branding';

const custom = {
  ...DEFAULT_BRANDING,
  system_name: 'Suds & Co',
  short_name: 'Suds',
  primary_color: '#7c3aed',
  sidebar_color: '#1e1b4b',
  report_footer: 'Suds & Co · Calapan',
  status_labels: {
    ...DEFAULT_BRANDING.status_labels,
    washing: 'In the wash',
    ready_for_pickup: 'Ready!',
  },
};

afterEach(() => {
  applyBranding(DEFAULT_BRANDING, 'light');
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('applying the branding', () => {
  it('sets no inline colors for the LaundryFlow defaults, so index.css governs light and dark', () => {
    applyBranding(DEFAULT_BRANDING, 'light');
    expect(document.documentElement.style.getPropertyValue('--color-flow')).toBe('');
    expect(brandName()).toBe('LaundryFlow');
  });

  it('writes the generated tokens for a custom color, per mode, and clears them on reset', () => {
    applyBranding(custom, 'light');
    expect(document.documentElement.style.getPropertyValue('--color-flow')).toBe('#7c3aed');
    expect(document.documentElement.style.getPropertyValue('--color-ink')).toBe('#1e1b4b');
    expect(document.documentElement.style.getPropertyValue('--color-on-flow')).toBe('#ffffff');

    applyBranding(custom, 'dark');
    expect(document.documentElement.style.getPropertyValue('--color-flow-text')).not.toBe(
      '#7c3aed',
    );

    applyBranding(DEFAULT_BRANDING, 'light');
    expect(document.documentElement.style.getPropertyValue('--color-flow')).toBe('');
  });

  it('renames the statuses on screen and restores them', () => {
    applyBranding(custom, 'light');
    expect(STATUS_META.washing.label).toBe('In the wash');
    expect(STATUS_META.ready_for_pickup.shortLabel).toBe('Ready!');
    applyBranding(DEFAULT_BRANDING, 'light');
    expect(STATUS_META.washing.label).toBe('Washing');
    expect(STATUS_META.ready_for_pickup.shortLabel).toBe('Ready');
    expect(STATUS_META.released.label).toBe('Completed');
  });

  it('names the file prefix, the report footer and the app title from the system name', () => {
    applyBranding(custom, 'light');
    expect(brandName()).toBe('Suds & Co');
    expect(brandSlug()).toBe('suds-co');
    expect(reportFooter()).toBe('Suds & Co · Calapan');
    expect(
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content'),
    ).toBe('Suds');
  });
});

describe('the cache that prevents a flash of the default look', () => {
  it('returns the last branding the server sent', () => {
    expect(readCachedBranding()).toBeNull();
    cacheBranding(custom);
    expect(readCachedBranding()?.system_name).toBe('Suds & Co');
  });

  it('falls back to nothing when storage is blocked or holds rubbish', () => {
    localStorage.setItem('laundryflow.branding.v1', '{not json');
    expect(readCachedBranding()).toBeNull();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readCachedBranding()).toBeNull();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => cacheBranding(custom)).not.toThrow();
  });
});

describe('the theme toggle', () => {
  it('switches the mode, remembers it, and says what it will do', async () => {
    document.documentElement.dataset.theme = 'light';
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    const toggle = screen.getByTestId('theme-toggle');
    expect(toggle).toHaveAccessibleName('Switch to dark mode');

    await userEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('laundryflow.theme')).toBe('dark');
    expect(toggle).toHaveAccessibleName('Switch to light mode');

    await userEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('laundryflow.theme')).toBe('light');
  });
});
