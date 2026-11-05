import { matchRoutes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from './router';

const leaf = (path: string) => matchRoutes(routes, path)?.at(-1)?.route.path;

describe('routes', () => {
  it('no longer has a receipt page or a public tracking page', () => {
    for (const path of [
      '/track',
      '/track/AbCdEfGhIjKlMnOpQrStUvWxYz012-_9',
      '/orders/12/receipt',
    ]) {
      expect(leaf(path), path).toBe('*');
    }
  });

  it('serves the basket URL and the customer portal outside the staff app', () => {
    expect(leaf('/b/AbCdEfGhIjKlMnOpQrStUvWxYz012-_9')).toBe('/b/:token');
    expect(leaf('/my/login')).toBe('/my/login');
    expect(leaf('/register')).toBe('/register');
    expect(leaf('/my')).toBe('/my');
    expect(leaf('/my/orders/LF-261105-0001')).toBe('/my/orders/:orderNumber');
    expect(leaf('/settings/baskets')).toBe('baskets');
  });

  it('leaves no link, call or print style pointing at the removed features', () => {
    const sources = import.meta.glob<string>(
      ['/src/**/*.{ts,tsx,css}', '!/src/**/*.test.{ts,tsx}'],
      { query: '?raw', import: 'default', eager: true },
    );
    expect(Object.keys(sources).length).toBeGreaterThan(50);
    for (const [file, text] of Object.entries(sources)) {
      expect(text, file).not.toMatch(
        /["'`]\/track\b|\/receipt["'`]|\/public\/track|receipt-58|receipt-a4|useReceipt/,
      );
    }
  });
});
