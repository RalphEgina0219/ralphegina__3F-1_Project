import { expect, test, type Page } from '@playwright/test';
import { asOwner, asStaffMember, emulateStandalone, waitForControllingWorker } from './helpers';

/**
 * The scripted QA walkthrough against Laravel (freshly seeded), role by role: the counter-to-pickup
 * flow with the customer watching, self-registration, permissions, and the admin screens. Every
 * page here must finish without a console error or a 5xx from the API.
 */

function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
      problems.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/') && response.status() >= 500) {
      problems.push(`${response.status()} ${url.pathname}`);
    }
  });
  return problems;
}

const tokenOf = (page: Page, kind: 'staff' | 'customer') =>
  page.evaluate((key) => localStorage.getItem(key) ?? '', `laundryflow.token.${kind}`);

interface Answer {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any;
}

async function apiAs(
  page: Page,
  kind: 'staff' | 'customer',
  method: 'get' | 'post' | 'put',
  url: string,
  data?: unknown,
): Promise<Answer> {
  const response = await page.request[method](`/api/v1${url}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${await tokenOf(page, kind)}` },
    ...(data === undefined ? {} : { data }),
  });
  const text = await response.text();
  return { status: response.status(), json: text ? JSON.parse(text) : null };
}

async function signInCustomer(page: Page, email: string, password: string) {
  await page.goto('/my/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

/** Replaces window.print so a test can see that printing was asked for. */
const stubPrint = (page: Page) =>
  page.evaluate(() => {
    delete document.body.dataset.printed;
    window.print = () => {
      document.body.dataset.printed = 'yes';
    };
  });

test.use({ viewport: { width: 1440, height: 900 } });

test('counter to pickup: register, take in, scan every stage, pay, complete, reuse the basket', async ({
  page,
  browser,
}) => {
  test.setTimeout(240_000);
  const problems = watch(page);
  const stamp = Date.now().toString().slice(-6);
  const name = `Walk Through ${stamp}`;
  const email = `walk.${stamp}@example.com`;

  // Staff: register a customer at the counter; the temporary password is shown once.
  await asStaffMember(page);
  await page.goto('/customers');
  await page
    .getByRole('button', { name: 'New customer' })
    .filter({ visible: true })
    .first()
    .click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Full name').fill(name);
  await form.getByLabel('Contact number').fill(`0917${stamp}1`);
  await form.getByLabel('Email').fill(email);
  await form.getByRole('combobox', { name: 'Barangay' }).click();
  await page.getByRole('option').first().click();
  await form.getByRole('button', { name: 'Register customer' }).click();
  const shown = page.getByRole('dialog', { name: 'Temporary password' });
  await expect(shown).toBeVisible();
  const temporary = (await shown.locator('.font-mono').first().innerText()).trim();
  expect(temporary).toMatch(/^[a-z2-9]{10}$/);
  await expect(shown.getByRole('button', { name: 'Copy password' })).toBeVisible();
  await shown.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText(temporary)).toHaveCount(0);

  // Staff: take in an order with a basket, to pay later.
  await page.goto('/orders/new');
  await page.getByPlaceholder('Name, email or contact number').fill(name);
  await page.getByRole('listbox', { name: 'Matching customers' }).getByText(name).click();
  await page.getByRole('combobox', { name: 'Add an available basket' }).click();
  const option = page.getByRole('option').first();
  const basketNumber = ((await option.innerText()).match(/BSK-\d{4}/) ?? [''])[0];
  expect(basketNumber).toMatch(/^BSK-\d{4}$/);
  await option.click();
  await expect(page.getByRole('list', { name: 'Baskets for this order' })).toContainText(
    basketNumber,
  );
  await page.getByRole('button', { name: 'Add service' }).filter({ visible: true }).first().click();
  await page.getByLabel('Pay later').check();
  await page.getByRole('button', { name: 'Save order' }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderId = Number(new URL(page.url()).pathname.split('/').at(-1));
  const detail = await apiAs(page, 'staff', 'get', `/orders/${orderId}`);
  const orderNumber = detail.json.data.attributes.orderNumber as string;
  expect(orderNumber).toMatch(/^LF-\d{6}-\d{4}$/);

  // Customer (on a phone): the temporary password must be replaced, then the order shows.
  const customerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const customer = await customerContext.newPage();
  const customerProblems = watch(customer);
  await signInCustomer(customer, email, temporary);
  await expect(customer).toHaveURL(/\/my\/password$/);
  await customer.goto('/my/orders');
  await expect(customer).toHaveURL(/\/my\/password$/);
  await customer.getByRole('textbox', { name: 'Temporary password', exact: true }).fill(temporary);
  await customer.getByRole('textbox', { name: 'New password', exact: true }).fill('walk-pass1');
  await customer
    .getByRole('textbox', { name: 'Confirm new password', exact: true })
    .fill('walk-pass1');
  await customer.getByRole('button', { name: 'Save my password' }).click();
  await expect(customer).toHaveURL(/\/my$/);
  const progress = customer.getByRole('list', { name: 'Laundry in progress' });
  await expect(progress).toContainText(orderNumber);
  await expect(progress).toContainText('Received');

  // Staff: scan the basket and move the order through every stage.
  await page.goto(`/scan?code=${basketNumber}`);
  for (const stage of ['Washing', 'Drying', 'Folding', 'Ready']) {
    await page.getByRole('button', { name: stage, exact: true }).click();
    await expect(page.getByRole('button', { name: `${stage} (current)` })).toBeVisible();
    if (stage === 'Washing') {
      // The customer's dashboard follows within its refresh interval (15 s).
      await expect(progress).toContainText('Washing', { timeout: 30_000 });
    }
  }
  // Completing is blocked while a balance is due.
  await expect(page.getByRole('button', { name: 'Completed', exact: true })).toBeDisabled();
  await expect(page.getByText('Completed is blocked until the balance is paid.')).toBeVisible();

  // Staff: a partial payment, then the rest.
  await page.goto(`/orders/${orderId}`);
  const total = detail.json.data.attributes.totalCents as number;
  const half = Math.floor(total / 2);
  for (const [round, cents] of [half, total - half].entries()) {
    await page
      .getByRole('button', { name: 'Record payment' })
      .filter({ visible: true })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: 'Record payment' });
    await dialog.getByLabel('Amount').fill((cents / 100).toFixed(2));
    await page.getByRole('button', { name: 'Save payment' }).click();
    await expect(dialog).toBeHidden();
    if (round === 0) {
      await expect(
        page.getByText(/Completing is blocked until the ₱[\d,.]+ balance is paid\./).first(),
      ).toBeVisible();
    }
  }

  // Staff: complete the order; its basket is free again.
  await page
    .getByRole('button', { name: 'Mark as completed' })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Mark as completed' }).click();
  await expect
    .poll(
      async () =>
        (await apiAs(page, 'staff', 'get', `/orders/${orderId}`)).json.data.attributes.status,
    )
    .toBe('released');
  const available = await apiAs(page, 'staff', 'get', '/baskets/available');
  const free = available.json.data as { id: number; attributes: { basketNumber: string } }[];
  const basket = free.find((b) => b.attributes.basketNumber === basketNumber);
  expect(basket, `${basketNumber} is available again`).toBeTruthy();

  // The same basket takes the next customer's laundry.
  const reused = await apiAs(page, 'staff', 'post', '/orders', {
    data: {
      attributes: {
        items: [{ serviceId: 1, weightKg: 4 }],
        promisedAt: new Date(Date.now() + 86_400_000).toISOString(),
      },
      relationships: { customer: { data: { id: 1 } }, baskets: { data: [{ id: basket?.id }] } },
    },
  });
  expect(reused.status).toBe(201);

  // Customer: the notices arrived; the history and the summary show the completed order.
  const notices = await apiAs(customer, 'customer', 'get', '/customer/notifications');
  expect(notices.status).toBe(200);
  expect((notices.json.data as unknown[]).length).toBeGreaterThanOrEqual(5);
  await customer.goto('/my/orders');
  await customer.getByRole('tab', { name: /^Completed/ }).click();
  await expect(customer.getByText(orderNumber).filter({ visible: true }).first()).toBeVisible();
  await customer.goto(`/my/orders/${orderNumber}`);
  await expect(customer.getByText('Completed').filter({ visible: true }).first()).toBeVisible();
  // Another customer's order number answers exactly like a missing one.
  const others = await apiAs(page, 'staff', 'get', '/orders?customer=1');
  const othersNumber = others.json.data[0]?.attributes.orderNumber as string;
  await customer.goto(`/my/orders/${othersNumber}`);
  await expect(customer.getByText('Order not found')).toBeVisible();

  expect(problems).toEqual([]);
  expect(customerProblems).toEqual([]);
  await customerContext.close();
});

test('a customer registers on their own and signs in again', async ({ page }) => {
  const problems = watch(page);
  const stamp = Date.now().toString().slice(-6);
  const email = `self.${stamp}@example.com`;
  await page.goto('/register');
  await page.getByLabel('Full name').fill(`Self Registered ${stamp}`);
  await page.getByLabel('Mobile number').fill(`0918${stamp}2`);
  await page.getByLabel('Email').fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('self-pass1');
  await page.getByRole('textbox', { name: /^Confirm/ }).fill('self-pass1');
  await page.getByRole('combobox', { name: 'Barangay' }).click();
  await page.getByRole('option').first().click();
  await page
    .getByRole('button', { name: /create/i })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/my$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Self');
  await page.evaluate(() => localStorage.removeItem('laundryflow.token.customer'));
  await signInCustomer(page, email, 'self-pass1');
  await expect(page).toHaveURL(/\/my$/);
  expect(problems).toEqual([]);
});

test('permissions: staff stay out of admin pages, a revoked permission stops at once, tokens keep to their side', async ({
  page,
}) => {
  await asStaffMember(page);
  for (const path of ['/settings/users', '/settings/shop', '/settings/baskets', '/reports']) {
    await page.goto(path);
    await expect(page.getByText('403: You do not have access to this page'), path).toBeVisible();
  }
  for (const url of [
    '/users',
    '/settings/shop',
    '/reports/sales',
    '/activity-logs',
    '/roles/permissions',
  ]) {
    expect((await apiAs(page, 'staff', 'get', url)).status, url).toBe(403);
  }

  // The owner revokes "Record payments": kevin's unexpired token is refused at once.
  const ownerLogin = await page.request.post('/api/v1/auth/login', {
    data: { username: 'liza.ramos', password: 'password123' },
    headers: { Accept: 'application/json' },
  });
  const ownerToken = ((await ownerLogin.json()) as { data: { access_token: string } }).data
    .access_token;
  const setStaffPermissions = (permissions: string[]) =>
    page.request.put('/api/v1/roles/staff/permissions', {
      headers: { Accept: 'application/json', Authorization: `Bearer ${ownerToken}` },
      data: { data: { attributes: { permissions } } },
    });
  const owing = (await apiAs(page, 'staff', 'get', '/balances')).json.data[0]?.id as number;
  expect(owing).toBeTruthy();
  const payment = { data: { attributes: { amountCents: 100, paymentMethod: 'cash' } } };
  expect((await setStaffPermissions(['inventory.stock_out'])).status()).toBe(200);
  expect((await apiAs(page, 'staff', 'post', `/orders/${owing}/payments`, payment)).status).toBe(
    403,
  );
  expect((await setStaffPermissions(['payments.record', 'inventory.stock_out'])).status()).toBe(
    200,
  );

  // A staff token on customer routes and a customer token on staff routes: 401 both ways.
  expect((await apiAs(page, 'staff', 'get', '/customer/orders')).status).toBe(401);
  const customerLogin = await page.request.post('/api/v1/customer/auth/login', {
    data: { email: 'maria.santos@example.com', password: 'password123' },
    headers: { Accept: 'application/json' },
  });
  const customerToken = ((await customerLogin.json()) as { data: { access_token: string } }).data
    .access_token;
  for (const url of ['/orders', '/customers', '/auth/me', '/dashboard/summary']) {
    const answer = await page.request.get(`/api/v1${url}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${customerToken}` },
    });
    expect(answer.status(), url).toBe(401);
  }
});

test('admin: every dashboard preset with and without compare, every report exported and printed', async ({
  page,
}) => {
  test.setTimeout(300_000);
  const problems = watch(page);
  await asOwner(page);
  await page.goto('/');
  const range = page.getByRole('group', { name: 'Date range' });
  const compare = page.getByRole('switch', { name: 'Compare to previous period' });
  for (const preset of ['Today', '7 days', '30 days', 'This month', 'Last month']) {
    await range.getByRole('button', { name: preset }).click();
    for (const on of [true, false]) {
      if ((await compare.getAttribute('aria-checked')) !== String(on)) await compare.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.chart-card'), `${preset}, compare ${on}`).toHaveCount(7);
      await expect(page.getByText('This could not be loaded')).toHaveCount(0);
    }
  }

  for (const kind of [
    'sales',
    'orders',
    'payments',
    'services',
    'customers',
    'inventory',
    'staff',
  ]) {
    await page.goto(`/reports?report=${kind}`);
    await expect(page.locator('.report-table'), kind).toBeVisible();
    await expect(page.getByText('This could not be loaded')).toHaveCount(0);
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV / Excel' }).click();
    const file = await downloading;
    expect(file.suggestedFilename(), kind).toMatch(
      new RegExp(`^laundryflow-${kind}-report-.*\\.csv$`),
    );
    await stubPrint(page);
    await page.getByRole('button', { name: 'Print / Save as PDF' }).click();
    expect(await page.evaluate(() => document.body.dataset.printed), kind).toBe('yes');
  }
  expect(problems).toEqual([]);
});

test('admin: services, users and permissions, shop settings, the activity log, baskets', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const problems = watch(page);
  const stamp = Date.now().toString().slice(-5);
  await asOwner(page);

  // A new service, then a new rate.
  const service = `Blanket wash ${stamp}`;
  await page.goto('/settings/services');
  await page.getByRole('button', { name: 'Add service' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Service name').fill(service);
  await dialog.getByLabel('Rate (₱)').fill('150');
  await dialog
    .getByRole('button', { name: /save|add/i })
    .last()
    .click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(service).filter({ visible: true }).first()).toBeVisible();
  await page
    .getByRole('button', { name: `Edit ${service}` })
    .filter({ visible: true })
    .first()
    .click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Rate (₱)').fill('175');
  await dialog.getByRole('button', { name: /save/i }).last().click();
  await expect(dialog).toBeHidden();

  // A new staff account, and one staff permission ticked on and off.
  await page.goto('/settings/users');
  await page.getByRole('button', { name: 'Add staff' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Full name').fill(`New Staff ${stamp}`);
  await dialog.getByLabel('Username').fill(`new.staff${stamp}`);
  await dialog.getByLabel('Temporary password').fill('start-pass1');
  await dialog
    .getByRole('button', { name: /save|add|create/i })
    .last()
    .click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(`new.staff${stamp}`).filter({ visible: true }).first()).toBeVisible();
  const voidBox = page.getByRole('checkbox', { name: /Void or edit a saved payment/ });
  await voidBox.check();
  await expect(page.getByText('Staff permissions updated').first()).toBeVisible();
  await voidBox.uncheck();

  // The shop profile.
  await page.goto('/settings/shop');
  await page.getByLabel('Opening hours').fill(`Mon–Sat 7:00–19:00 (${stamp})`);
  await page.getByRole('button', { name: 'Save shop profile' }).click();
  await expect(page.getByText(/saved/i).first()).toBeVisible();

  // The activity log has the changes.
  await page.goto('/settings/activity');
  await expect(
    page
      .getByText(/updated the shop profile/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();

  // Baskets: add two, print one's label, retire it.
  await page.goto('/settings/baskets');
  await page.getByRole('button', { name: 'Add baskets' }).click();
  dialog = page.getByRole('dialog', { name: 'Add baskets' });
  await dialog.getByLabel('How many').fill('2');
  await dialog.getByLabel('Label').fill(`Walk ${stamp}`);
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dialog).toBeHidden();
  const newest = (await apiAs(page, 'staff', 'get', '/baskets?sort=-basketNumber')).json.data[0]
    ?.attributes.basketNumber as string;
  expect(newest).toMatch(/^BSK-\d{4}$/);
  await page.getByLabel('Search by basket number, label or order number').fill(newest);
  const row = page.getByRole('row').filter({ hasText: newest });
  await row.getByRole('button', { name: 'Label' }).click();
  await stubPrint(page);
  await page.getByRole('dialog').getByRole('button', { name: /print/i }).last().click();
  // The sheet renders first; printing follows a moment later.
  await expect.poll(() => page.evaluate(() => document.body.dataset.printed)).toBe('yes');
  await page.keyboard.press('Escape');
  await row.getByRole('button', { name: 'Retire' }).click();
  await page.getByRole('dialog').getByLabel('Reason').fill('Cracked in the walkthrough');
  await page.getByRole('dialog').getByRole('button', { name: 'Retire basket' }).click();
  await expect(page.getByText(`${newest} retired`).first()).toBeVisible();
  expect(problems).toEqual([]);
});

test('the installed app works against Laravel, and the service worker never stores /api/v1/', async ({
  page,
}) => {
  await emulateStandalone(page);
  await page.goto('/login');
  await waitForControllingWorker(page);
  await page.getByLabel('Username').fill('liza.ramos');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText("Today's laundry flow")).toBeVisible();
  for (const path of ['/orders', '/customers', '/payments', '/settings/baskets']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  // Answers from Laravel came from the network, never from the worker's caches.
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) urls.push(request.url);
    }
    return urls;
  });
  expect(cached.length).toBeGreaterThan(0);
  expect(cached.filter((url) => new URL(url).pathname.startsWith('/api/'))).toEqual([]);
});
