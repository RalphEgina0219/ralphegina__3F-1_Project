import { expect, test, type Page } from '@playwright/test';
import { asOwner, asStaffMember } from './helpers';

/**
 * One example of each error status, from the Laravel API (course format
 * `{ errors: [{ status, message, source }] }`) through src/lib/apiAdapter.ts to the screen.
 */

const staffToken = (page: Page) =>
  page.evaluate(() => localStorage.getItem('laundryflow.token.staff') ?? '');

async function api(page: Page, method: 'get' | 'post', url: string, data?: unknown) {
  const response = await page.request[method](`/api/v1${url}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${await staffToken(page)}` },
    ...(data === undefined ? {} : { data }),
  });
  return { status: response.status(), body: (await response.json()) as Record<string, never> };
}

test('401: without a token the app goes to the sign-in page', async ({ page }) => {
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login\?next=%2Forders$/);
  const answer = await page.request.get('/api/v1/orders', {
    headers: { Accept: 'application/json' },
  });
  expect(answer.status()).toBe(401);
  expect(await answer.json()).toEqual({
    errors: [{ status: 401, message: 'Unauthenticated', source: '' }],
  });
});

test('403: staff see the not-allowed page, and the API refuses them too', async ({ page }) => {
  await asStaffMember(page);
  await page.goto('/settings/users');
  await expect(page.getByText('403: You do not have access to this page')).toBeVisible();
  const answer = await api(page, 'get', '/users');
  expect(answer.status).toBe(403);
  expect(answer.body).toMatchObject({ errors: [{ status: 403 }] });
});

test('404: an order that does not exist shows "Order not found"', async ({ page }) => {
  await asOwner(page);
  await page.goto('/orders/999999');
  await expect(page.getByText('Order not found')).toBeVisible();
});

test("409: a stale screen shows the API's message word for word", async ({ page }) => {
  await asOwner(page);
  // A fresh order at Received, open on this screen.
  const basket = (await api(page, 'get', '/baskets/available')).body as unknown as {
    data: { id: number }[];
  };
  const created = await api(page, 'post', '/orders', {
    data: {
      attributes: {
        items: [{ serviceId: 1, weightKg: 5 }],
        promisedAt: new Date(Date.now() + 86_400_000).toISOString(),
      },
      relationships: {
        customer: { data: { id: 1 } },
        baskets: { data: [{ id: basket.data[0]?.id }] },
      },
    },
  });
  expect(created.status).toBe(201);
  const id = (created.body as unknown as { data: { id: number } }).data.id;
  await page.goto(`/orders/${id}`);
  const move = page.getByRole('button', { name: 'Move to Washing' }).first();
  await expect(move).toBeVisible();

  // Another counter moves it on first.
  const other = await api(page, 'post', `/orders/${id}/status`, {
    data: { attributes: { toStatus: 'washing' } },
  });
  expect(other.status).toBe(200);

  await move.click();
  await expect(page.getByText('The order is already Washing.')).toBeVisible();
});

test('422: field errors appear under their own field', async ({ page }) => {
  await asStaffMember(page);
  await page.goto('/password');
  await page.getByRole('textbox', { name: 'Current password', exact: true }).fill('not-it-1');
  await page.getByRole('textbox', { name: 'New password', exact: true }).fill('another-pass1');
  await page
    .getByRole('textbox', { name: 'Confirm new password', exact: true })
    .fill('another-pass1');
  await page.getByRole('button', { name: 'Change password' }).click();
  const current = page.getByRole('textbox', { name: 'Current password', exact: true });
  await expect(current).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('The current password is not correct.')).toBeVisible();
});

test('429: the sixth failed sign-in in a minute asks to wait', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('no.such.user');
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    await page.getByLabel('Password').fill(`wrong-${attempt}`);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  }
  await expect(page.getByRole('alert')).toHaveText(
    'Too many sign-in attempts. Please wait a minute and try again.',
  );
});

test('500: a crash shows a friendly sentence, never what the server sent', async ({ page }) => {
  await asOwner(page);
  // What Laravel sends for a crash while APP_DEBUG is on; with it off there is even less.
  await page.route(
    (url) => url.pathname === '/api/v1/orders',
    (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: [
            {
              type: 'QueryException',
              status: 500,
              message: 'SQLSTATE[40001]: Serialization failure: 1213 Deadlock found',
              source: 'Line 864: C:\\laragon\\www\\vendor\\laravel\\framework\\src\\Connection.php',
            },
          ],
        }),
      }),
  );
  await page.goto('/orders');
  await expect(
    page.getByText('Something went wrong on our side. Please try again in a moment.').first(),
  ).toBeVisible();
  await expect(page.getByText(/SQLSTATE|Connection\.php|QueryException/)).toHaveCount(0);
});
