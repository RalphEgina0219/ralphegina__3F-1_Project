import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { asOwner } from './helpers';

/**
 * `npm run screenshots`: the images Android shows in the richer install dialog, captured from the
 * demo build into public/screenshots/ (committed). Re-run after a visible change to these screens.
 */
const OUT = path.resolve(import.meta.dirname, '../public/screenshots');

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  // Fonts and the last skeletons.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}

test.use({ colorScheme: 'light' });

test('narrow: the phone dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await asOwner(page);
  await page.goto('/');
  await expect(page.getByText("Today's laundry flow")).toBeVisible();
  await settle(page);
  await page.screenshot({ path: path.join(OUT, 'home-narrow.png'), animations: 'disabled' });
});

test('narrow: scanning a basket', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await asOwner(page);
  // A basket that holds laundry in the seeded demo data.
  // Ask the mock API, once its service worker controls the page.
  await page.goto('/');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const basket = await page.evaluate(async () => {
    const response = await fetch('/api/baskets?status=in_use');
    const { data } = (await response.json()) as { data: { basket_number: string }[] };
    return data[0]?.basket_number;
  });
  await page.goto(`/scan?code=${basket}`);
  await expect(page.getByRole('link', { name: 'Open order summary' })).toBeVisible();
  await settle(page);
  await page.screenshot({ path: path.join(OUT, 'scan-narrow.png'), animations: 'disabled' });
});

test('wide: the shop dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await asOwner(page);
  await page.goto('/');
  await expect(page.getByText("Today's laundry flow")).toBeVisible();
  await settle(page);
  await page.screenshot({ path: path.join(OUT, 'dashboard-wide.png'), animations: 'disabled' });
});

// docs/screenshots: the analytics screens for the project write-up, at desktop and phone width.
const DOCS = path.resolve(import.meta.dirname, '../docs/screenshots');

const DOC_SCREENS = [
  { name: 'dashboard-admin', user: '1', url: '/' },
  { name: 'dashboard-staff', user: '2', url: '/' },
  { name: 'report-sales', user: '1', url: '/reports?report=sales' },
  { name: 'report-payments', user: '1', url: '/reports?report=payments' },
] as const;

for (const screen of DOC_SCREENS) {
  for (const width of [1440, 390]) {
    test(`docs: ${screen.name} at ${width}px`, async ({ page }) => {
      await page.goto('/login');
      await page.evaluate(
        (id) => localStorage.setItem('laundryflow.mock.session', id),
        screen.user,
      );
      await page.setViewportSize({ width, height: 900 });
      await page.goto(screen.url);
      await expect(page.locator('.chart-card').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      // Grow the window to the whole page first, so no chart redraws while the picture is taken.
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(2500);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(DOCS, `${screen.name}-${width}.png`),
        animations: 'disabled',
      });
    });
  }
}
