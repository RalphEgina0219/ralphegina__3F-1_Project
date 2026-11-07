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
  const basket = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('laundryflow.mock.db.v2') ?? '{}');
    return data.baskets.find((b: { status: string }) => b.status === 'in_use').basket_number;
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
