import { expect, test } from '@playwright/test';
import {
  emulateStandalone,
  installabilityInProfile,
  manifestErrors,
  offerInstall,
  pngSize,
  workerScripts,
} from './helpers';

interface ManifestImage {
  src: string;
  sizes: string;
  purpose?: string;
}

test('the manifest has every required field and every image it lists loads', async ({
  request,
}) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.status()).toBe(200);
  const manifest = await response.json();

  expect(manifest).toMatchObject({
    id: '/',
    name: 'LaundryFlow — Laundry Shop Management',
    short_name: 'LaundryFlow',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    theme_color: '#0B2E3F',
    background_color: '#F3F8FA',
    lang: 'en',
    categories: ['business', 'productivity'],
  });
  expect(manifest.description).toMatch(/laundry shop management/i);

  const icons = manifest.icons as ManifestImage[];
  expect(icons.map((icon) => `${icon.sizes} ${icon.purpose}`)).toEqual([
    '64x64 any',
    '192x192 any',
    '512x512 any',
    '512x512 maskable',
  ]);
  expect(manifest.shortcuts.map((shortcut: { url: string }) => shortcut.url)).toEqual([
    '/scan',
    '/orders/new',
    '/my',
  ]);
  const screenshots = manifest.screenshots as (ManifestImage & { form_factor: string })[];
  expect(screenshots.map((shot) => `${shot.form_factor} ${shot.sizes}`)).toEqual([
    'narrow 390x844',
    'narrow 390x844',
    'wide 1440x900',
  ]);

  const images: ManifestImage[] = [
    ...icons,
    ...manifest.shortcuts.flatMap((shortcut: { icons: ManifestImage[] }) => shortcut.icons),
    ...screenshots,
  ];
  for (const image of images) {
    const file = await request.get(`/${image.src}`);
    expect(file.status(), image.src).toBe(200);
    expect(file.headers()['content-type'], image.src).toBe('image/png');
    const { width, height } = pngSize(await file.body());
    expect(`${width}x${height}`, image.src).toBe(image.sizes);
  }
  for (const path of ['/favicon.ico', '/favicon.svg', '/apple-touch-icon-180x180.png']) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test('index.html carries the install and iOS tags', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest">');
  expect(html).toContain('content="width=device-width, initial-scale=1, viewport-fit=cover"');
  expect(html).not.toMatch(/user-scalable|maximum-scale/);
  expect(html).toContain('<meta name="theme-color" content="#0B2E3F"');
  expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes"');
  expect(html).toContain('content="black-translucent"');
  expect(html).toContain('<meta name="apple-mobile-web-app-title" content="LaundryFlow"');
  expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png"');
});

test('mock mode registers only the MSW worker, caches nothing, and is installable', async ({
  page,
}) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.ready).active));

  const scripts = await workerScripts(page);
  expect(scripts).toHaveLength(1);
  expect(scripts[0]).toMatch(/\/mockServiceWorker\.js$/);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);

  // The sw.js a mock build emits only unregisters itself; nothing registers it.
  const sw = await (await page.request.get('/sw.js')).text();
  expect(sw).toContain('self.registration.unregister()');

  expect(await manifestErrors(page)).toEqual([]);
  expect(await installabilityInProfile(page.url())).toEqual({ installability: [], manifest: [] });
});

test('a worker and cache left by a real-API build are gone after the demo loads', async ({
  page,
}) => {
  await page.goto('/login');
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.ready).active));
  // The earlier deploy: its sw.js owns "/" and its app shell sits in Cache Storage.
  await page.evaluate(async () => {
    for (const registration of await navigator.serviceWorker.getRegistrations()) {
      await registration.unregister();
    }
    const cache = await caches.open('workbox-precache-v2-http://old/');
    await cache.put('/index.html', new Response('old shell'));
    await navigator.serviceWorker.register('/sw.js');
  });
  await page.waitForTimeout(1000);
  await page.goto('/login');

  const state = () =>
    page
      .evaluate(async () => ({
        scripts: (await navigator.serviceWorker.getRegistrations()).map(
          (registration) => registration.active?.scriptURL ?? 'not active',
        ),
        caches: await caches.keys(),
      }))
      // The self-destroying worker reloads open pages; a poll may land mid-reload.
      .catch(() => null);
  await expect
    .poll(state, { timeout: 20_000 })
    .toEqual({ scripts: [expect.stringMatching(/\/mockServiceWorker\.js$/)], caches: [] });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('the existing flows still work on the built demo: staff scan and customer portal', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('liza.ramos');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText("Today's laundry flow")).toBeVisible();

  await page.goto('/scan');
  await page.locator('#manual-desktop').fill('BSK-0029');
  await page.getByRole('button', { name: 'Find' }).click();
  await expect(page.getByText('BSK-0029 is retired')).toBeVisible();

  await page.goto('/my/login');
  await page.getByLabel('Email').fill('maria.santos@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Maria');
});

test('"Install app" appears when the browser offers installation', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Install app' })).toHaveCount(0);
  await offerInstall(page);
  await expect(page.getByRole('button', { name: 'Install app' })).toBeVisible();
});

test('"Install app" stays hidden when running as the installed app', async ({ page }) => {
  await emulateStandalone(page);
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(display-mode: standalone)').matches)).toBe(true);
  await offerInstall(page);
  await page.waitForTimeout(500);
  await expect(page.getByRole('button', { name: 'Install app' })).toHaveCount(0);
});

test('iPhone Safari gets the Add to Home Screen guide instead of a prompt', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  await page.goto('/my/login');
  await page.getByRole('button', { name: 'Install app' }).click();
  const guide = page.getByRole('dialog', { name: 'Install LaundryFlow' });
  await expect(guide).toContainText('Tap Share, then Add to Home Screen.');
  await context.close();
});

test('the install banner shows on a phone from the second visit, once', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('laundryflow.visits', '2');
    localStorage.setItem('laundryflow.mock.session', '1');
  });
  await page.goto('/');
  await expect(page.getByText("Today's laundry flow")).toBeVisible();
  await offerInstall(page);
  const banner = page.getByRole('complementary', { name: 'Install LaundryFlow' });
  await expect(banner).toContainText('Install LaundryFlow for quicker access.');
  await banner.getByRole('button', { name: 'Dismiss' }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await offerInstall(page);
  await page.waitForTimeout(500);
  await expect(banner).toBeHidden();
  await context.close();
});
