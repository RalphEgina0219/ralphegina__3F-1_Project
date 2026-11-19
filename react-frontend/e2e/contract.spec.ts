import { expect, test } from '@playwright/test';
import { asOwner } from './helpers';

/**
 * The contract run (`npm run test:contract`): the real-API build against Laravel with a freshly
 * seeded database. Together with analytics.demo.spec.ts it checks that every screen reads the
 * Laravel answers the same way it reads the mock's.
 */

test('staff sign in with the form, scan a basket, and a customer signs in to the portal', async ({
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

test('a wrong password shows the API message on the sign-in form', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('liza.ramos');
  await page.getByLabel('Password').fill('not-the-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid credentials')).toBeVisible();
});

test('orders, an order page, customers, baskets, payments and inventory read the API', async ({
  page,
}) => {
  await asOwner(page);

  await page.goto('/orders');
  const firstOrder = page.getByRole('link', { name: /^LF-\d{6}-\d{4}/ }).first();
  await expect(firstOrder).toBeVisible();
  await firstOrder.click();
  await expect(page.getByRole('heading', { name: /LF-\d{6}-\d{4}/ }).first()).toBeVisible();
  await expect(page.getByText(/BSK-\d{4}/).first()).toBeVisible();

  await page.goto('/customers');
  await expect(page.getByText('Maria Santos').first()).toBeVisible();

  await page.goto('/payments');
  await expect(page.getByText('Outstanding balances')).toBeVisible();
  await page.getByRole('tab', { name: 'Payment history' }).click();
  await expect(page.getByText(/OR-\d{6}/).first()).toBeVisible();

  await page.goto('/inventory');
  await expect(page.getByText('Detergent powder').first()).toBeVisible();

  await page.goto('/settings/baskets');
  await expect(page.getByText('BSK-0001').first()).toBeVisible();
});

test('a scanned basket label opens its active order', async ({ page }) => {
  await asOwner(page);
  // A basket that holds laundry in the seeded data.
  const token = await page.evaluate(() => localStorage.getItem('laundryflow.token.staff'));
  const response = await page.request.get('/api/v1/baskets?status=in_use', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const { data } = (await response.json()) as { data: { attributes: { basketNumber: string } }[] };
  await page.goto(`/scan?code=${data[0]?.attributes.basketNumber}`);
  await expect(page.getByRole('link', { name: 'Open order summary' })).toBeVisible();
});

test('a staff password reset forces a new password at the next sign-in', async ({ page }) => {
  // aira.d, so the other specs can keep signing kevin.m in with the seeded password.
  await page.goto('/login');
  await page.getByLabel('Username').fill('liza.ramos');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText("Today's laundry flow")).toBeVisible();
  await page.goto('/settings/users');

  await page.getByRole('button', { name: 'Reset password of Aira Dimaculangan' }).click();
  const answer = page.waitForResponse((r) => r.url().includes('/reset-password'));
  await page.getByRole('dialog').getByRole('button', { name: 'Reset password' }).click();
  const { data } = (await (await answer).json()) as { data: { temporaryPassword: string } };
  const temporary = data.temporaryPassword;
  const shown = page.getByRole('dialog', { name: 'Temporary password' });
  await expect(shown).toContainText(temporary);
  await expect(shown.getByRole('button', { name: 'Copy password' })).toBeVisible();
  await shown.getByRole('button', { name: 'Done' }).click();
  // Shown once: nothing on the page keeps it.
  await expect(page.getByText(temporary)).toHaveCount(0);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Username').fill('aira.d');
  await page.getByLabel('Password').fill(temporary);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/password$/);
  await expect(page.getByRole('heading', { name: 'Choose your own password' })).toBeVisible();
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/password$/);

  await page.getByRole('textbox', { name: 'Temporary password', exact: true }).fill(temporary);
  await page.getByRole('textbox', { name: 'New password', exact: true }).fill('fresh-pass1');
  await page.getByRole('textbox', { name: 'Confirm new password', exact: true }).fill('different1');
  await page.getByRole('button', { name: 'Save my password' }).click();
  await expect(page.getByText('The passwords do not match.')).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Confirm new password', exact: true })
    .fill('fresh-pass1');
  await page.getByRole('button', { name: 'Save my password' }).click();

  await expect(page).not.toHaveURL(/\/password$/);
  await page.goto('/orders');
  await expect(page.getByRole('link', { name: /^LF-\d{6}-\d{4}/ }).first()).toBeVisible();
  // The voluntary entry in the account menu opens the same page without forcing it.
  await page.getByRole('link', { name: 'Change password' }).click();
  await expect(page.getByRole('heading', { name: 'Change password' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the app' })).toBeVisible();
});

test("the customer portal lists the customer's own orders and opens one", async ({ page }) => {
  await page.goto('/my/login');
  await page.getByLabel('Email').fill('maria.santos@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait for the sign-in to finish (the token is stored), then open the orders list.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Maria');
  await page.goto('/my/orders');
  const order = page.getByRole('link', { name: /LF-\d{6}-\d{4}/ }).first();
  await expect(order).toBeVisible();
  await order.click();
  await expect(page.getByText('Received').first()).toBeVisible();
});
