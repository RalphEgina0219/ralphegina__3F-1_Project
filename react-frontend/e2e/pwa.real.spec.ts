import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  emulateStandalone,
  installabilityInProfile,
  manifestErrors,
  offerInstall,
  waitForControllingWorker,
  workerScripts,
} from './helpers';

const DIST = path.resolve(import.meta.dirname, '../dist-e2e/real');

test('the real-API build ships no mock worker and no MSW code', () => {
  expect(fs.existsSync(path.join(DIST, 'sw.js'))).toBe(true);
  expect(fs.existsSync(path.join(DIST, 'mockServiceWorker.js'))).toBe(false);
  for (const file of fs.readdirSync(path.join(DIST, 'assets'))) {
    if (!file.endsWith('.js')) continue;
    const code = fs.readFileSync(path.join(DIST, 'assets', file), 'utf8');
    expect(code, file).not.toContain('setupWorker');
  }
});

test('only the Workbox worker registers, and it precaches the app shell', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await waitForControllingWorker(page);

  const scripts = await workerScripts(page);
  expect(scripts).toHaveLength(1);
  expect(scripts[0]).toMatch(/\/sw\.js$/);

  const precached = await page.evaluate(async () => {
    const name = (await caches.keys()).find((key) => key.includes('precache'));
    if (!name) return [];
    const cache = await caches.open(name);
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });
  expect(precached).toContain('/index.html');
  // The manifest and the icons follow the shop's branding (Laravel builds them), so the worker
  // never stores them: a changed logo or name must reach the next install.
  expect(precached).not.toContain('/manifest.webmanifest');
  expect(precached.some((file) => /pwa-|maskable-icon|apple-touch-icon/.test(file))).toBe(false);
  expect(precached.some((file) => file.startsWith('/storage/'))).toBe(false);
  expect(precached.some((file) => /^\/assets\/index-.*\.js$/.test(file))).toBe(true);
  expect(precached.some((file) => /^\/assets\/.*\.css$/.test(file))).toBe(true);
  expect(precached).not.toContain('/mockServiceWorker.js');
  expect(precached.some((file) => file.startsWith('/screenshots/'))).toBe(false);

  // The manifest is Laravel's (/manifest.webmanifest, proxied by `vite preview` to port 8000): this
  // part needs the API running (Docker or php artisan serve).
  expect(await manifestErrors(page)).toEqual([]);
  expect(await installabilityInProfile(page.url())).toEqual({ installability: [], manifest: [] });
});

test('offline, a reload still opens the app with the banner, and saving is blocked', async ({
  page,
  context,
}) => {
  await page.goto('/login');
  await waitForControllingWorker(page);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const banner = page.getByTestId('offline-banner');
  await expect(banner).toContainText("You're offline. Changes can't be saved until you reconnect.");

  // A route that was never opened still loads from the precache.
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  const create = page.getByRole('button', { name: 'Create account' });
  await expect(create).toHaveAttribute('aria-disabled', 'true');

  await page.goto('/login');
  const signIn = page.getByRole('button', { name: 'Sign in' });
  await expect(signIn).toHaveAttribute('aria-disabled', 'true');
  await page.getByLabel('Username').fill('liza.ramos');
  await page.getByLabel('Password').fill('password123');
  await signIn.hover();
  await expect(page.getByRole('tooltip')).toContainText("You're offline");
  // Playwright won't click an aria-disabled button by itself; a finger will.
  await signIn.click({ force: true });
  await expect(
    page.getByText("You're offline. This can't be saved until you reconnect.").first(),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  await context.setOffline(false);
  await expect(page.getByText('Back online')).toBeVisible();
  await expect(banner).toBeHidden();
  await expect(signIn).not.toHaveAttribute('aria-disabled', 'true');
});

test.describe('a new version', () => {
  const swPath = path.join(DIST, 'sw.js');
  let original = '';
  test.beforeEach(() => {
    original = fs.readFileSync(swPath, 'utf8');
  });
  test.afterEach(() => {
    fs.writeFileSync(swPath, original);
  });

  /** A newer deploy: the same app with a changed sw.js, which the browser then finds. */
  async function publishUpdate(page: import('@playwright/test').Page) {
    fs.writeFileSync(swPath, `${original}\n// e2e: newer build ${Date.now()}\n`);
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())?.update();
    });
  }

  test('shows a lasting Reload / Later toast; Later keeps the current version', async ({
    page,
  }) => {
    await page.goto('/login');
    await waitForControllingWorker(page);
    await publishUpdate(page);

    const toast = page.getByText('A new version of LaundryFlow is available');
    await expect(toast).toBeVisible();
    await page.waitForTimeout(4000); // longer than an ordinary toast lives
    await expect(toast).toBeVisible();
    await page.getByRole('button', { name: 'Later' }).click();
    await expect(toast).toBeHidden();
    expect(
      await page.evaluate(async () =>
        Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
      ),
    ).toBe(true);
  });

  test('Reload asks first when a form has unsaved changes, then activates the new worker', async ({
    page,
  }) => {
    await page.goto('/register');
    await waitForControllingWorker(page);
    await page.getByLabel('Full name').fill('Juan dela Cruz');
    await publishUpdate(page);

    await page.getByRole('button', { name: 'Reload' }).click();
    const confirm = page.getByRole('dialog', { name: 'Reload with unsaved changes?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    // Kept the work, and the offer comes back (a new toast; the old one may still be fading out).
    await expect(page.getByLabel('Full name')).toHaveValue('Juan dela Cruz');
    await expect(page.getByText('A new version of LaundryFlow is available')).toHaveCount(1);

    await page.getByRole('button', { name: 'Reload' }).click();
    await page.getByRole('button', { name: 'Reload anyway' }).click();
    await expect(page.getByLabel('Full name')).toHaveValue('');
    await expect
      .poll(() =>
        page
          .evaluate(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            return Boolean(registration?.active && !registration.waiting);
          })
          .catch(() => false),
      )
      .toBe(true);
  });
});

test('"Install app" is hidden in the installed app, shown in a browser tab', async ({
  context,
}) => {
  const tab = await context.newPage();
  await tab.goto('/login');
  await expect(tab.getByRole('heading', { level: 1 })).toBeVisible();
  await offerInstall(tab);
  await expect(tab.getByRole('button', { name: 'Install app' })).toBeVisible();
  await tab.close();

  const app = await context.newPage();
  await emulateStandalone(app);
  await app.goto('/login');
  await expect(app.getByRole('heading', { level: 1 })).toBeVisible();
  await offerInstall(app);
  await app.waitForTimeout(500);
  await expect(app.getByRole('button', { name: 'Install app' })).toHaveCount(0);
  await app.close();
});
