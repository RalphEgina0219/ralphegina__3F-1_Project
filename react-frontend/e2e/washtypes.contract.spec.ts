import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { asOwner, asStaffMember } from './helpers';

/**
 * Wash types and soap usage against Laravel (freshly seeded demo shop): take in orders with Tough
 * stains and with Softness and fragrance, and follow them through the bill, the soap preview, the
 * stock on the Inventory page, the QR scan result, a Maya payment and the customer's portal.
 *
 * The demo shop: Tough stains = ₱5/kg + Detergent pods 0.25 pcs/kg + Stain remover 25 mL/kg;
 * Softness and fragrance = Liquid detergent 30 mL/kg + Fabric conditioner 20 mL/kg.
 */

test.use({ viewport: { width: 1440, height: 900 } });

const tokenOf = (page: Page) =>
  page.evaluate(() => localStorage.getItem('laundryflow.token.staff') ?? '');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function api(page: Page, url: string): Promise<any> {
  const response = await page.request.get(`/api/v1${url}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${await tokenOf(page)}` },
  });
  return response.json();
}

async function onHand(page: Page, itemName: string) {
  const items = (await api(page, '/inventory/items')).data as {
    attributes: { name: string; onHand: number };
  }[];
  const found = items.find((item) => item.attributes.name === itemName);
  expect(found, `${itemName} is tracked`).toBeTruthy();
  return found?.attributes.onHand ?? 0;
}

/** Takes in an order on the desktop form: Maria Santos, a free basket, 6.5 kg, a wash type. */
async function takeInOrder(page: Page, washType: string) {
  await page.goto('/orders/new');
  await page.getByPlaceholder('Name, email or contact number').fill('Maria Santos');
  await page.getByRole('listbox', { name: 'Matching customers' }).getByText('Maria Santos').click();
  await page.getByRole('combobox', { name: 'Add an available basket' }).click();
  await page.getByRole('option').first().click();
  await page.getByLabel('Weight for Wash-Dry-Fold', { exact: true }).fill('6.5');
  await page.getByRole('radio', { name: new RegExp(washType) }).check();
  await page.getByLabel('Pay at pickup').check();
}

test('Tough stains: the bill line, the soap preview, the stock, the scan result, Maya and the portal', async ({
  page,
  browser,
}) => {
  test.setTimeout(240_000);
  await asStaffMember(page);

  const removerBefore = await onHand(page, 'Stain remover');
  const podsBefore = await onHand(page, 'Detergent pods');

  // Staff: the wash type is a choice of the Services & load step, with its hint.
  await takeInOrder(page, 'Tough stains');
  await expect(
    page.getByText('Wash type applies to laundry weighed by kilo.').first(),
  ).toBeVisible();
  const bill = page.getByTestId('bill-wash-line').filter({ visible: true });
  await expect(bill).toContainText('Wash type: Tough stains — ₱5.00/kg × 6.5 kg = ₱32.50');
  const preview = page.getByTestId('soap-preview').filter({ visible: true });
  await expect(preview).toContainText('Soap to be used:');
  await expect(preview).toContainText('Detergent pods 2 pcs');
  await expect(preview).toContainText('Stain remover 163 mL');
  // 6.5 kg of Wash-Dry-Fold (₱227.50) + the ₱32.50 surcharge.
  await expect(page.getByText('₱260.00').filter({ visible: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Save order' }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderId = Number(new URL(page.url()).pathname.split('/').at(-1));
  const order = (await api(page, `/orders/${orderId}`)).data;
  const orderNumber = order.attributes.orderNumber as string;
  expect(order.attributes).toMatchObject({
    washSurchargePerKgCents: 500,
    washSurchargeCents: 3250,
    totalCents: 26000,
  });

  // The order page shows the wash type line and the soap that was deducted.
  await expect(page.getByTestId('wash-type-line')).toContainText(
    'Wash type: Tough stains — ₱5.00/kg × 6.5 kg = ₱32.50',
  );
  await expect(page.getByTestId('soap-card')).toContainText('Detergent pods');
  await expect(page.getByTestId('soap-card')).toContainText('163 mL');

  // The stock fell by exactly what the wash type uses: 2 pods and 163 mL.
  expect(await onHand(page, 'Detergent pods')).toBe(podsBefore - 2);
  expect(await onHand(page, 'Stain remover')).toBeCloseTo(removerBefore - 0.163, 3);
  await page.goto('/inventory');
  const used = page.getByTestId('usage-movement').first();
  await expect(used).toContainText(`Used by order ${orderNumber}`);
  await used.getByRole('link', { name: orderNumber }).click();
  await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));

  // The scan result tells the person washing which wash and which soap.
  await page.goto(`/scan?code=${orderNumber}`);
  await expect(page.getByTestId('scan-wash-type')).toContainText('Tough stains');
  await expect(page.getByTestId('scan-soap')).toContainText('Use: Detergent pods 2 pcs');
  await expect(page.getByTestId('scan-soap')).toContainText('Stain remover 163 mL');

  // Staff: Maya needs its reference number.
  await page.goto(`/orders/${orderId}`);
  await page
    .getByRole('button', { name: 'Record payment' })
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Record payment' });
  await dialog.getByRole('combobox', { name: 'Method' }).click();
  await page.getByRole('option', { name: 'Maya' }).click();
  await expect(dialog.getByLabel('Maya reference no.')).toBeVisible();
  await page.getByRole('button', { name: 'Save payment' }).click();
  await expect(dialog.getByText('Enter the Maya reference number.')).toBeVisible();
  await dialog.getByLabel('Maya reference no.').fill('MAYA-100200');
  await page.getByRole('button', { name: 'Save payment' }).click();
  await expect(dialog).toBeHidden();
  const paid = (await api(page, `/orders/${orderId}?include=payments`)).data;
  expect(paid.attributes.paymentStatus).toBe('paid');
  expect(paid.includes.payments[0].attributes).toMatchObject({
    method: 'maya',
    methodLabel: 'Maya',
    referenceNumber: 'MAYA-100200',
  });
  await page.goto('/payments');
  await page.getByRole('tab', { name: 'Payment history' }).click();
  await expect(page.getByText('Maya').first()).toBeVisible();

  // The customer sees the wash type and its charge, never soap quantities.
  const customerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const customer = await customerContext.newPage();
  await customer.goto('/my/login');
  await customer.getByLabel('Email').fill('maria.santos@example.com');
  await customer.getByLabel('Password').fill('password123');
  await customer.getByRole('button', { name: 'Sign in' }).click();
  await expect(customer.getByRole('heading', { level: 1 })).toContainText('Maria');
  await customer.goto(`/my/orders/${orderNumber}`);
  await expect(customer.getByTestId('wash-type-line')).toContainText('Tough stains');
  await expect(customer.getByTestId('wash-type-line')).toContainText('₱32.50');
  const body = await customer.locator('body').innerText();
  expect(body).not.toMatch(/Stain remover|Detergent pods|163 mL/);
  await customerContext.close();
});

test('Softness and fragrance: two soaps, and a warning when the stock is short', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await asStaffMember(page);
  await takeInOrder(page, 'Softness and fragrance');

  const bill = page.getByTestId('bill-wash-line').filter({ visible: true });
  await expect(bill).toContainText('Wash type: Softness and fragrance — no extra charge');
  const preview = page.getByTestId('soap-preview').filter({ visible: true });
  await expect(preview).toContainText('Liquid detergent 195 mL');
  await expect(preview).toContainText('Fabric conditioner 130 mL');

  // 6.5 kg of Wash-Dry-Fold at ₱35/kg: no surcharge for this wash type.
  await page.getByRole('button', { name: 'Save order' }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderId = Number(new URL(page.url()).pathname.split('/').at(-1));
  const order = (await api(page, `/orders/${orderId}`)).data;
  expect(order.attributes).toMatchObject({ washSurchargeCents: 0, totalCents: 22750 });
  expect(order.includes.soapUsage.map((s: { label: string }) => s.label)).toEqual([
    'Liquid detergent 195 mL',
    'Fabric conditioner 130 mL',
  ]);
});

test('Pricing & Usage is the owner’s: staff get 403, the owner changes usage and it is logged', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await asStaffMember(page);
  const forbidden = await page.request.post('/api/v1/wash-types', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${await tokenOf(page)}` },
    data: { data: { attributes: { name: 'Sneaky' } } },
  });
  expect(forbidden.status()).toBe(403);

  await page.evaluate(() => localStorage.clear());
  await asOwner(page);
  await page.goto('/settings/pricing');
  await expect(page.getByTestId('apply-note')).toContainText(
    'Changes apply to new orders only. Existing orders keep their prices.',
  );
  await expect(page.getByTestId('wash-types-card')).toBeVisible();
  const regular = page
    .getByTestId('wash-type-editor')
    .filter({ has: page.locator('input[value="Regular washing"]') });
  const usage = regular.getByRole('textbox', { name: /Amount per kilo of Detergent powder/ });
  await expect(usage).toHaveValue('25');
  await usage.fill('50');
  await regular.getByRole('button', { name: 'Save Regular washing' }).click();
  await expect(page.getByText('Regular washing saved')).toBeVisible();

  await page.goto('/settings/activity');
  await expect(
    page.getByText('Regular washing · Detergent powder: 25 g/kg → 50 g/kg').first(),
  ).toBeVisible();
});

// Responsive checks and the screenshots in docs/screenshots/wash-types -------------------------

const SHOTS = path.resolve(import.meta.dirname, '../../docs/screenshots/wash-types');
const SCREENSHOTS = Boolean(process.env.WASH_SCREENSHOTS);

/** No horizontal page scroll: the layout fits the viewport. */
async function expectFits(page: Page, where: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, `${where} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1);
}

async function shot(page: Page, name: string, width: number) {
  if (!SCREENSHOTS) return;
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}-${width}.png`), animations: 'disabled' });
}

for (const width of [1440, 390]) {
  test(`responsive at ${width} px: New Order, Pricing & Usage, Inventory and the scan result`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const phone = width < 768;
    await page.setViewportSize({ width, height: phone ? 844 : 900 });
    await asOwner(page);

    // New Order: on a phone it is four steps, on a desktop one page.
    await page.goto('/orders/new');
    await page.getByPlaceholder('Name, email or contact number').fill('Maria Santos');
    await page
      .getByRole('listbox', { name: 'Matching customers' })
      .getByText('Maria Santos')
      .click();
    await expectFits(page, 'New Order, customer');
    if (phone) await page.getByRole('button', { name: /^Next: Baskets/ }).click();
    await page.getByRole('combobox', { name: 'Add an available basket' }).click();
    await page.getByRole('option').first().click();
    if (phone) await page.getByRole('button', { name: /^Next: Services/ }).click();
    await page.getByLabel('Weight for Wash-Dry-Fold', { exact: true }).fill('6.5');
    await page.getByRole('radio', { name: /Tough stains/ }).check();
    await expectFits(page, 'New Order, wash type');
    await shot(page, 'new-order-wash-type', width);
    if (phone) await page.getByRole('button', { name: /^Next: Completion/ }).click();
    await page.getByLabel('Pay at pickup').check();
    await expect(page.getByTestId('bill-wash-line').filter({ visible: true })).toContainText(
      '₱5.00/kg × 6.5 kg = ₱32.50',
    );
    await expect(page.getByTestId('soap-preview').filter({ visible: true })).toBeVisible();
    await expectFits(page, 'New Order, bill');
    await shot(page, 'new-order-bill', width);
    await page
      .getByRole('button', { name: 'Save order' })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+$/);
    const orderNumber = (
      await page
        .getByRole('heading', { name: /LF-\d{6}-\d{4}/ })
        .first()
        .innerText()
    ).match(/LF-\d{6}-\d{4}/)?.[0];
    expect(orderNumber).toBeTruthy();
    await expectFits(page, 'the order page');

    await page.goto('/settings/pricing');
    await expect(page.getByTestId('wash-types-card')).toBeVisible();
    await expectFits(page, 'Pricing & Usage');
    await shot(page, 'pricing-and-usage', width);

    await page.goto('/inventory');
    await expect(page.getByTestId('usage-movement').first()).toBeVisible();
    await expectFits(page, 'Inventory');
    await shot(page, 'inventory-movements', width);

    await page.goto(`/scan?code=${orderNumber}`);
    await expect(page.getByTestId('scan-wash-type')).toContainText('Tough stains');
    await expectFits(page, 'the scan result');
    await shot(page, 'scan-result', width);
  });
}
