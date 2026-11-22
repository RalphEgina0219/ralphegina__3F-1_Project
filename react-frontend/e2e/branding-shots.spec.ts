import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * `npm run screenshots:branding`: the screens in light and dark, with the LaundryFlow default
 * brand and a sample custom brand ("Suds & Co"), at 1440 and 390 wide, into
 * docs/screenshots/branding/. Runs against Laravel (the logo upload needs the real API).
 */
const OUT = path.resolve(import.meta.dirname, '../../docs/screenshots/branding');
const SIZES = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;
const MODES = ['light', 'dark'] as const;

const CUSTOM = {
  systemName: 'Suds & Co',
  shortName: 'Suds',
  tagline: 'Wash. Dry. Fold.',
  primaryColor: '#7c3aed',
  accentColor: '#f59e0b',
  sidebarColor: '#1e1b4b',
  loginMessage: 'Welcome to Suds & Co. Sign in to manage today’s laundry.',
  portalMessage: 'Suds & Co is open daily, 8 am to 6 pm.',
};

/** A purple drop on a transparent square: a stand-in logo. */
function logoPng(size = 256) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buffer: Buffer) => {
    let c = 0xffffffff;
    for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc(body), body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6; // RGBA
  const rows: Buffer[] = [];
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      const outer = d < size * 0.44;
      const inner = d < size * 0.2;
      const o = 1 + x * 4;
      if (inner) row.set([255, 255, 255, 255], o);
      else if (outer) row.set([124, 58, 237, 255], o);
    }
    rows.push(row);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function ownerToken(page: Page) {
  const response = await page.request.post('/api/v1/auth/login', {
    data: { username: 'liza.ramos', password: 'password123' },
    headers: { Accept: 'application/json' },
  });
  return ((await response.json()) as { data: { access_token: string } }).data.access_token;
}

async function setBrand(page: Page, brand: 'default' | 'custom') {
  const token = await ownerToken(page);
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  await page.request.post('/api/v1/settings/branding/reset', { headers });
  if (brand === 'default') return;
  await page.request.post('/api/v1/settings/branding/logo', {
    headers,
    multipart: { file: { name: 'suds.png', mimeType: 'image/png', buffer: logoPng() } },
  });
  const response = await page.request.put('/api/v1/settings/branding', {
    headers,
    data: { data: { attributes: CUSTOM } },
  });
  expect(response.status()).toBe(200);
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

async function shoot(page: Page, name: string) {
  await settle(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), animations: 'disabled' });
}

async function capture(browser: Browser, brand: 'default' | 'custom') {
  for (const mode of MODES) {
    for (const size of SIZES) {
      const context = await browser.newContext({ viewport: size, colorScheme: mode });
      const page = await context.newPage();
      const prefix = `${brand}-${mode}-${size.width}`;

      // Signed out: staff sign-in, customer sign-in.
      await page.goto('/login');
      await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
      await shoot(page, `${prefix}-login`);
      await page.goto('/my/login');
      await shoot(page, `${prefix}-portal-login`);

      // The customer portal.
      await page.getByLabel('Email').fill('maria.santos@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Maria');
      await shoot(page, `${prefix}-portal`);
      await page.goto('/my/orders');
      await shoot(page, `${prefix}-portal-orders`);

      // The staff app.
      const token = await ownerToken(page);
      await page.evaluate((t) => localStorage.setItem('laundryflow.token.staff', t), token);
      await page.goto('/');
      await expect(page.getByText("Today's laundry flow")).toBeVisible();
      await shoot(page, `${prefix}-dashboard`);
      await page.goto('/orders/board');
      await shoot(page, `${prefix}-board`);
      await page.goto('/orders/new');
      await shoot(page, `${prefix}-new-order`);
      await page.goto('/reports');
      await shoot(page, `${prefix}-reports`);
      await page.goto('/settings/branding');
      await expect(page.getByTestId('branding-page')).toBeVisible();
      // As tall as the page, so the sticky save bar and sidebar sit where a person sees them.
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewportSize({ width: size.width, height });
      await shoot(page, `${prefix}-settings-branding`);
      await context.close();
    }
  }
}

test('screenshots: default and custom brand, light and dark, 1440 and 390', async ({
  browser,
  page,
}) => {
  test.setTimeout(600_000);
  fs.mkdirSync(OUT, { recursive: true });
  await page.goto('/login');
  for (const brand of ['default', 'custom'] as const) {
    await setBrand(page, brand);
    await capture(browser, brand);
  }
  await setBrand(page, 'default');
});
