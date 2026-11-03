import { describe, expect, it } from 'vitest';
import {
  amountPaidCents,
  balanceCents,
  billableQuantity,
  lineSubtotalCents,
  orderTotalCents,
  paymentStatus,
} from './billing';
import { formatMoney, parseMoney } from './money';

const wdf = { pricing_type: 'per_kg', rate_cents: 3500, minimum_qty: 3 } as const;

describe('lineSubtotalCents', () => {
  it('bills per kg above the minimum', () => {
    expect(lineSubtotalCents({ ...wdf, weight_kg: 6.5 })).toBe(22750);
  });

  it('applies the minimum weight', () => {
    expect(lineSubtotalCents({ ...wdf, weight_kg: 1.2 })).toBe(10500);
    expect(billableQuantity({ ...wdf, weight_kg: 1.2 })).toBe(3);
  });

  it('bills nothing for an empty per-kg line', () => {
    expect(lineSubtotalCents({ ...wdf, weight_kg: 0 })).toBe(0);
  });

  it('avoids float errors on 0.1 kg steps', () => {
    // 0.1 + 0.2 style errors would make this 26249 or 26251.
    expect(lineSubtotalCents({ ...wdf, weight_kg: 7.5 })).toBe(26250);
    expect(lineSubtotalCents({ pricing_type: 'per_kg', rate_cents: 3333, weight_kg: 3.3 })).toBe(
      10999,
    );
  });

  it('bills per piece and flat', () => {
    expect(lineSubtotalCents({ pricing_type: 'per_piece', rate_cents: 1500, quantity: 6 })).toBe(
      9000,
    );
    expect(lineSubtotalCents({ pricing_type: 'flat', rate_cents: 5000 })).toBe(5000);
  });
});

describe('order totals', () => {
  it('sums the mockup order to 367.50', () => {
    expect(orderTotalCents([22750, 9000, 5000])).toBe(36750);
  });

  it('ignores voided payments', () => {
    const paid = amountPaidCents([
      { amount_cents: 20000, voided_at: null },
      { amount_cents: 16750, voided_at: '2026-10-31T10:00:00Z' },
    ]);
    expect(paid).toBe(20000);
  });

  it('never returns a negative balance', () => {
    expect(balanceCents(36750, 20000)).toBe(16750);
    expect(balanceCents(36750, 40000)).toBe(0);
  });

  it('derives the payment status', () => {
    expect(paymentStatus(36750, 0)).toBe('unpaid');
    expect(paymentStatus(36750, 20000)).toBe('partial');
    expect(paymentStatus(36750, 36750)).toBe('paid');
    expect(paymentStatus(36750, 40000)).toBe('paid');
  });
});

describe('money', () => {
  it('formats centavos as pesos', () => {
    expect(formatMoney(123450)).toBe('₱1,234.50');
    expect(formatMoney(0)).toBe('₱0.00');
  });

  it('parses peso input without float errors', () => {
    expect(parseMoney('1,234.50')).toBe(123450);
    expect(parseMoney('₱19.99')).toBe(1999);
    expect(parseMoney('167.5')).toBe(16750);
    expect(parseMoney('12.345')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('')).toBeNull();
  });
});
