import zlib from 'node:zlib';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { asOwner, asStaffMember } from './helpers';

/**
 * White-label branding and dark mode against Laravel (freshly seeded demo shop):
 *  1. the owner renames the system, uploads a logo and picks colors;
 *  2. the sidebar, login page, portal, tab title and manifest follow;
 *  3. a renamed status shows on the board and in the portal;
 *  4. turning Maya off removes it from the payment form;
 *  5. the dark toggle switches, survives a reload and appears once per interface;
 *  6. "Reset to LaundryFlow defaults" puts everything back.
 */

test.use({ viewport: { width: 1440, height: 900 } });

const TOGGLE = '[data-testid="theme-toggle"]';

/** A solid-color PNG of the given size, built with zlib (no image library needed). */
function solidPng(size: number, [r, g, b]: [number, number, number]) {
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
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array(size).fill([r, g, b]).flat())]);
  const raw = Buffer.concat(Array(size).fill(row));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function manifest(page: Page) {
  const response = await page.request.get('/manifest.webmanifest');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('manifest+json');
  expect(response.headers()['cache-control']).toContain('no-cache');
  return response.json() as Promise<{
    name: string;
    short_name: string;
    theme_color: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  }>;
}

async function newVisitor(browser: Browser, width = 1440, height = 900) {
  const context = await browser.newContext({ viewport: { width, height } });
  return { context, page: await context.newPage() };
}

async function signInCustomer(page: Page) {
  await page.goto('/my/login');
  await page.getByLabel('Email').fill('maria.santos@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Maria');
}

test('the owner brands the shop and every screen follows; reset restores LaundryFlow', async ({
  page,
  browser,
}) => {
  test.setTimeout(240_000);
  await asOwner(page);
  // Start from the LaundryFlow defaults, whatever an earlier run left behind.
  const token = await page.evaluate(() => localStorage.getItem('laundryflow.token.staff'));
  await page.request.post('/api/v1/settings/branding/reset', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  await page.goto('/settings/branding');
  await expect(page.getByTestId('branding-page')).toBeVisible();

  // 1. Name, logo, colors, messages, a renamed status, Maya off.
  await page.getByLabel('System name').fill('Suds & Co');
  await page.getByLabel('Short name').fill('Suds');
  await page.getByTestId('file-logo').setInputFiles({
    name: 'suds-logo.png',
    mimeType: 'image/png',
    buffer: solidPng(256, [124, 58, 237]),
  });
  await expect(page.getByTestId('slot-logo').locator('img')).toBeVisible();
  await page.getByLabel('Primary color', { exact: true }).fill('#7c3aed');
  await page.getByLabel('Sidebar / header color', { exact: true }).fill('#1e1b4b');
  await expect(page.getByTestId('contrast-report')).toContainText('readable');
  await page.getByLabel('Login page welcome message').fill('Welcome to Suds & Co laundry.');
  await page.getByLabel('Customer portal message').fill('Suds & Co is open 8 to 6.');
  await page.getByLabel('Stage 2').fill('In the wash');
  await page.getByRole('switch', { name: 'Maya is on' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Branding saved')).toBeVisible();

  // 2. The staff app: sidebar, tab title, logo; the public branding; the manifest.
  await expect(page).toHaveTitle(/Suds & Co/);
  await expect(page.getByText('Suds & Co', { exact: true }).first()).toBeVisible();
  await expect(page.locator('img[src*="/storage/branding/logo-"]').first()).toBeVisible();
  const branding = (await (await page.request.get('/api/v1/branding')).json()).data.attributes;
  expect(branding).toMatchObject({
    systemName: 'Suds & Co',
    shortName: 'Suds',
    primaryColor: '#7c3aed',
    sidebarColor: '#1e1b4b',
  });
  expect(branding.logoUrl).toMatch(/^\/storage\/branding\/logo-[0-9a-f]+\.png$/);
  const logo = await page.request.get(branding.logoUrl);
  expect(logo.status()).toBe(200);
  expect(logo.headers()['content-type']).toContain('image/png');

  const installed = await manifest(page);
  expect(installed).toMatchObject({ name: 'Suds & Co', short_name: 'Suds' });
  expect(installed.icons.some((icon) => icon.sizes === '512x512')).toBe(true);
  expect(installed.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  expect(installed.icons.every((icon) => icon.src.startsWith('/storage/branding/'))).toBe(true);

  // The login page (nobody signed in) and the customer portal.
  const visitor = await newVisitor(browser);
  await visitor.page.goto('/login');
  await expect(visitor.page.getByText('Suds & Co', { exact: true }).first()).toBeVisible();
  await expect(visitor.page.getByTestId('login-message')).toContainText('Welcome to Suds');
  await expect(visitor.page).toHaveTitle(/Suds/);
  await signInCustomer(visitor.page);
  await expect(visitor.page.getByTestId('portal-message')).toContainText('open 8 to 6');

  // 3. The renamed status: the board, and the customer's order (Maria's is in the wash).
  await page.goto('/orders/board');
  await expect(page.getByText('In the wash').first()).toBeVisible();
  await visitor.page.goto('/my/orders');
  await expect(visitor.page.getByText('In the wash').first()).toBeVisible();
  await expect(visitor.page.getByText('Washing', { exact: true })).toHaveCount(0);

  // 4. Maya is off for new payments; the others stay.
  await page.goto('/payments');
  await page
    .getByRole('button', { name: /^Collect / })
    .first()
    .click();
  await page.getByRole('combobox', { name: 'Method' }).click();
  await expect(page.getByRole('option', { name: 'GCash' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Maya' })).toHaveCount(0);
  await page.keyboard.press('Escape');

  // Staff and customers cannot open or change the branding.
  const staff = await newVisitor(browser);
  await asStaffMember(staff.page);
  await staff.page.goto('/settings/branding');
  await expect(staff.page.getByTestId('branding-page')).toHaveCount(0);
  const staffToken = await staff.page.evaluate(() =>
    localStorage.getItem('laundryflow.token.staff'),
  );
  const denied = await staff.page.request.put('/api/v1/settings/branding', {
    headers: { Authorization: `Bearer ${staffToken}`, Accept: 'application/json' },
    data: { data: { attributes: { systemName: 'Hacked' } } },
  });
  expect(denied.status()).toBe(403);
  await staff.context.close();

  // 5. Dark mode: one toggle per interface, instant, remembered after a reload.
  await page.goto('/');
  await expect(page.locator(TOGGLE)).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  await page.locator(TOGGLE).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator(TOGGLE)).toHaveAccessibleName('Switch to light mode');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('laundryflow.theme'))).toBe('dark');
  await expect(page.locator(TOGGLE)).toHaveCount(1);
  await page.locator(TOGGLE).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  const phone = await newVisitor(browser, 390, 844);
  await asOwner(phone.page);
  await phone.page.goto('/');
  await expect(phone.page.locator(TOGGLE)).toHaveCount(1);
  await expect(phone.page.locator(TOGGLE)).toBeVisible();
  await phone.context.close();

  await visitor.page.goto('/my');
  await expect(visitor.page.locator(TOGGLE)).toHaveCount(1);
  await visitor.page.locator(TOGGLE).click();
  await expect(visitor.page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await visitor.page.locator(TOGGLE).click();

  const anonymous = await newVisitor(browser);
  for (const path of ['/login', '/my/login', '/register', '/b/not-a-real-token', '/offline']) {
    await anonymous.page.goto(path);
    await expect(anonymous.page.locator(TOGGLE), `${path} has one toggle`).toHaveCount(1);
  }
  await anonymous.context.close();
  await visitor.context.close();

  // 6. Reset to the LaundryFlow defaults, after the confirmation.
  await page.goto('/settings/branding');
  await page.getByRole('button', { name: 'Reset to LaundryFlow defaults' }).click();
  const confirm = page.getByRole('dialog');
  await expect(confirm).toContainText('Reset to the LaundryFlow defaults?');
  await confirm.getByRole('button', { name: 'Reset branding' }).click();
  await expect(page.getByText('Branding reset')).toBeVisible();
  await expect(page).toHaveTitle(/LaundryFlow/);
  const reset = (await (await page.request.get('/api/v1/branding')).json()).data.attributes;
  expect(reset).toMatchObject({
    systemName: 'LaundryFlow',
    primaryColor: '#0e7490',
    logoUrl: null,
  });
  expect(reset.statusLabels.washing).toBe('Washing');
  expect(reset.paymentMethods.find((m: { code: string }) => m.code === 'maya').isActive).toBe(true);
  expect((await manifest(page)).name).toContain('LaundryFlow');
  await page.goto('/orders/board');
  await expect(page.getByText('Washing').first()).toBeVisible();
});
