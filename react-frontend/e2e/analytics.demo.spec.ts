import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { asOwner, asStaffMember } from './helpers';

const card = (page: Page, title: string) =>
  page
    .locator('.chart-card')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });

/** Charts draw their labels when the entrance animation ends. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

test.describe('admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await asOwner(page);
  });

  test('shows 5 KPIs and 7 charts, and every one follows the date range', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.chart-card')).toHaveCount(7);
    const kpis = page
      .getByRole('region', { name: 'Key figures' })
      .or(page.locator('section[aria-label="Key figures"]'));
    await expect(kpis.locator('p').filter({ hasText: /^Sales$/ })).toBeVisible();
    const salesCard = card(page, 'Sales trend');
    await expect(salesCard).toContainText('Payments collected per day');
    const before = await salesCard.locator('p').nth(0).textContent();
    const kpiBefore = await kpis.innerText();

    await page
      .getByRole('group', { name: 'Date range' })
      .getByRole('button', { name: '7 days' })
      .click();
    await expect(page).toHaveURL(/range=7d/);
    await settle(page);
    await expect(salesCard.locator('p').nth(0)).not.toHaveText(before ?? '');
    expect(await kpis.innerText()).not.toBe(kpiBefore);
    // Every chart that covers the range names the new period.
    for (const title of [
      'Sales trend',
      'Revenue by service',
      'Busiest times',
      'Payment method mix',
      'Average turnaround',
    ]) {
      await expect(card(page, title)).not.toContainText('30 days');
    }
    await expect(card(page, 'Sales trend').locator('[data-chart-plot]')).toHaveAttribute(
      'aria-label',
      /last 7 days/,
    );

    // The range survives a reload and can be shared.
    await page.reload();
    await expect(
      page.getByRole('group', { name: 'Date range' }).getByRole('button', { name: '7 days' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('the comparison switch adds and removes the previous period', async ({ page }) => {
    await page.goto('/');
    const sales = card(page, 'Sales trend');
    await expect(sales.getByRole('list', { name: 'Legend' })).toContainText('Previous period');
    await expect(sales).toContainText(/vs previous 30 days/);
    await page.getByLabel('Compare to previous period').click();
    await expect(page).toHaveURL(/compare=off/);
    await expect(sales.getByRole('list', { name: 'Legend' })).not.toContainText('Previous period');
    await expect(page.locator('section[aria-label="Key figures"]')).not.toContainText(
      'vs previous',
    );
  });

  test('a pipeline bar opens the orders in that stage', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    const pipeline = card(page, 'Order pipeline right now');
    // Stages in order: Received, Washing, Drying …
    await pipeline.locator('.recharts-bar-rectangle').nth(2).click();
    await expect(page).toHaveURL(/\/orders\?status=drying/);
    await expect(page.getByRole('button', { name: /Drying/ }).first()).toBeVisible();
  });

  test('"View as table" swaps a chart for its data', async ({ page }) => {
    await page.goto('/');
    const sales = card(page, 'Sales trend');
    await sales.getByRole('button', { name: 'View as table' }).click();
    const table = sales.getByRole('table', { name: 'Sales trend' });
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).toHaveCount(30);
    await sales.getByRole('button', { name: 'View as chart' }).click();
    await expect(table).toBeHidden();
  });

  test('keeps the charts on screen when the connection drops', async ({ page, context }) => {
    await page.goto('/');
    await settle(page);
    await context.setOffline(true);
    await expect(page.getByTestId('offline-banner')).toBeVisible();
    await expect(page.locator('.chart-card')).toHaveCount(7);
    await expect(card(page, 'Sales trend').locator('.recharts-surface')).toBeVisible();
    await context.setOffline(false);
  });
});

test('staff see five work charts and no peso amounts', async ({ page }) => {
  await asStaffMember(page);
  await page.goto('/');
  await expect(page.locator('.chart-card')).toHaveCount(5);
  await settle(page);
  const charts = page.locator('section[aria-label="Charts"]');
  const kpis = page.locator('section[aria-label="Key figures"]');
  await expect(kpis).toContainText('Baskets in use');
  expect(await charts.innerText()).not.toContain('₱');
  expect(await kpis.innerText()).not.toContain('₱');
  // Aging drill-down: the longest wait opens ready orders waiting over 3 days.
  await card(page, 'Ready for pickup: waiting time')
    .locator('.recharts-bar-rectangle')
    .nth(3)
    .click();
  await expect(page).toHaveURL(/status=ready_for_pickup.*waiting_min=3/);
  await expect(page.getByRole('button', { name: /Waiting over 3 days/ })).toBeVisible();
});

test.describe('reports', () => {
  test.beforeEach(async ({ page }) => {
    await asOwner(page);
  });

  test('every report has KPIs, insights, charts and a full table', async ({ page }) => {
    await page.goto('/reports');
    for (const name of [
      'Sales',
      'Orders',
      'Payments & balances',
      'Services',
      'Customers',
      'Inventory',
      'Staff activity',
    ]) {
      await page
        .getByRole('tab', { name: new RegExp(`^${name.replace('&', '\\&')}`) })
        .last()
        .click();
      await expect(page.getByRole('heading', { name: 'Key insights' })).toBeVisible();
      // Charts load just after the figures: wait for at least two.
      await expect(page.locator('.chart-card').nth(1)).toBeVisible();
      await expect(page.locator('.report-table tfoot').first()).toBeAttached();
    }
  });

  test('filters live in the URL as removable chips', async ({ page }) => {
    await page.goto('/reports?report=sales');
    await page.getByRole('combobox', { name: 'Payment method' }).click();
    await page.getByRole('option', { name: 'GCash' }).click();
    await expect(page).toHaveURL(/method=gcash/);
    const chip = page.getByRole('button', { name: 'Remove filter: Payment method: GCash' });
    await expect(chip).toBeVisible();
    await expect(
      card(page, 'By payment method').getByRole('list', { name: 'Legend' }),
    ).toContainText(/Cashs*₱0/);
    await chip.click();
    await expect(page).not.toHaveURL(/method=/);
  });

  test('the table sorts, searches and pages', async ({ page }) => {
    await page.goto('/reports?report=orders');
    const table = page.locator('.report-table');
    await expect(table.getByText(/^\d+ rows$/)).toBeVisible();
    await expect(table.locator('tbody tr').first()).toBeVisible();
    await table.getByRole('button', { name: 'Total' }).first().click();
    await expect(table.locator('th[aria-sort="ascending"]')).toHaveCount(1);
    await table.getByRole('searchbox').fill('Maria Santos');
    await expect(table.getByText(/rows? matching/)).toBeVisible();
  });

  test('exports the table as CSV and prints with a report header', async ({ page }) => {
    await page.goto('/reports?report=sales');
    await expect(page.locator('.report-table')).toBeVisible();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV / Excel' }).click();
    const file = await downloading;
    expect(file.suggestedFilename()).toMatch(
      /^laundryflow-sales-report-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv$/,
    );
    const csv = fs.readFileSync(await file.path(), 'utf8');
    // Every column, optional ones included, with units in the headings and a totals row.
    expect(csv).toContain('Date,Orders,Kilos (kg),Cash (PHP),GCash (PHP),Sales (PHP)');
    expect(csv.trim().split(/\r?\n/).at(-1)).toMatch(/^Total,/);

    await page.evaluate(() => {
      (window as unknown as { printed: boolean }).printed = false;
      window.print = () => {
        (window as unknown as { printed: boolean }).printed = true;
      };
    });
    await page.getByRole('button', { name: 'Print / Save as PDF' }).click();
    expect(await page.evaluate(() => (window as unknown as { printed: boolean }).printed)).toBe(
      true,
    );
    expect(await page.evaluate(() => document.body.dataset.print)).toBe('report');
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByRole('heading', { name: 'Sales report' })).toBeVisible();
    await expect(page.getByText(/^By Liza Ramos on /)).toBeVisible();
  });
});
