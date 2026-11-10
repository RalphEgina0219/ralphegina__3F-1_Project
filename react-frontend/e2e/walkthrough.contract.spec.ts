import { expect, test, type Page } from '@playwright/test';
import { asOwner, asStaffMember } from './helpers';

/**
 * The scripted QA walkthrough against Laravel (freshly seeded): every screen at a phone width
 * (390 px) and a desktop width (1440 px), as each role. A screen fails when it scrolls sideways,
 * shows an error state, or logs a console error.
 */

const WIDTHS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

/** Problems seen on the page so far: console errors and failed API calls. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (message) => {
    // A refused request is logged by the browser too; the API answers are checked below.
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
      problems.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('response', (response) => {
    const url = new URL(response.url());
    // 4xx answers are expected here and there (a guest's /auth/me is 401); a 5xx never is.
    if (url.pathname.startsWith('/api/') && response.status() >= 500) {
      problems.push(`${response.status()} ${url.pathname}`);
    }
  });
  return problems;
}

async function checkScreen(page: Page, path: string, ready: () => Promise<void>) {
  await page.goto(path);
  await ready();
  // Let lazy charts and lists settle.
  await page.waitForLoadState('networkidle');
  const overflow = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    return root.scrollWidth - window.innerWidth;
  });
  expect(overflow, `${path} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1);
  await expect(page.getByText('This could not be loaded'), `${path} shows an error`).toHaveCount(0);
}

const OWNER_SCREENS: [string, string | RegExp][] = [
  ['/', "Today's laundry flow"],
  ['/orders', /LF-\d{6}-\d{4}/],
  ['/orders/board', 'Received'],
  ['/orders/new', 'Customer'],
  ['/customers', 'Maria Santos'],
  ['/scan', 'Scan'],
  ['/payments', 'Outstanding balances'],
  ['/inventory', 'Detergent powder'],
  ['/reports', 'Key insights'],
  ['/settings/services', 'Wash-Dry-Fold'],
  ['/settings/users', 'Liza Ramos'],
  ['/settings/baskets', 'BSK-0001'],
  ['/settings/shop', 'Shop'],
  ['/settings/activity', 'Activity'],
  ['/password', 'Change password'],
];

const STAFF_SCREENS: [string, string | RegExp][] = [
  ['/', 'Order pipeline right now'],
  ['/orders', /LF-\d{6}-\d{4}/],
  ['/orders/new', 'Customer'],
  ['/customers', 'Maria Santos'],
  ['/scan', 'Scan'],
  ['/inventory', 'Detergent powder'],
];

for (const size of WIDTHS) {
  test.describe(`every screen at ${size.width}px`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test('owner', async ({ page }) => {
      const problems = watch(page);
      await asOwner(page);
      for (const [path, text] of OWNER_SCREENS) {
        await checkScreen(page, path, () =>
          expect(page.getByText(text).filter({ visible: true }).first(), path).toBeVisible(),
        );
      }
      expect(problems).toEqual([]);
    });

    test('staff', async ({ page }) => {
      const problems = watch(page);
      await asStaffMember(page);
      for (const [path, text] of STAFF_SCREENS) {
        await checkScreen(page, path, () =>
          expect(page.getByText(text).filter({ visible: true }).first(), path).toBeVisible(),
        );
      }
      expect(problems).toEqual([]);
    });

    test('customer', async ({ page }) => {
      const problems = watch(page);
      await page.goto('/my/login');
      await page.getByLabel('Email').fill('maria.santos@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Maria');
      for (const [path, text] of [
        ['/my', 'Maria'],
        ['/my/orders', 'LF-'],
        ['/my/account', 'Change password'],
      ] as const) {
        await checkScreen(page, path, () =>
          expect(page.getByText(text).filter({ visible: true }).first()).toBeVisible(),
        );
      }
      await checkScreen(page, '/register', () =>
        expect(page.getByRole('button', { name: /create/i }).first()).toBeVisible(),
      );
      expect(problems).toEqual([]);
    });
  });
}
