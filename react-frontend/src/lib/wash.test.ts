import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';
import {
  formatAmount,
  formatUsage,
  perKgTenths,
  shortageMessage,
  shortages,
  soapPlan,
  soapPreview,
  usageQuantity,
  washBillLine,
  washSurchargeCents,
  type WeighedLine,
} from './wash';

// One set of cases for both sides: laravel-backend/tests/Unit/WashRulesTest.php reads the same file.
const cases = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../../shared/wash-cases.json'), 'utf8'),
) as {
  perKgTenths: { name: string; lines: WeighedLine[]; expected: number }[];
  surcharge: { name: string; perKgTenths: number; perKgCents: number; expected: number }[];
  usage: {
    name: string;
    unit: string;
    usagePerKg: number;
    perKgTenths: number;
    expected: number;
  }[];
  format: { unit: string; quantity: number; expected: string }[];
  formatUsage: { unit: string; usagePerKg: number; expected: string }[];
  shortage: { item: string; unit: string; needed: number; onHand: number; expected: string }[];
};

describe('perKgTenths', () => {
  it.each(cases.perKgTenths)('$name', ({ lines, expected }) => {
    expect(perKgTenths(lines)).toBe(expected);
  });
});

describe('washSurchargeCents', () => {
  it.each(cases.surcharge)('$name', ({ perKgTenths: tenths, perKgCents, expected }) => {
    expect(washSurchargeCents(tenths, perKgCents)).toBe(expected);
  });
});

describe('usageQuantity', () => {
  it.each(cases.usage)('$name', ({ unit, usagePerKg, perKgTenths: tenths, expected }) => {
    expect(usageQuantity(unit, usagePerKg, tenths)).toBeCloseTo(expected, 9);
  });

  it('refuses units that are not soap units', () => {
    expect(() => usageQuantity('rolls', 5, 10)).toThrow();
  });
});

describe('formatting', () => {
  it.each(cases.format)('prints $quantity $unit as $expected', ({ unit, quantity, expected }) => {
    expect(formatAmount(unit, quantity)).toBe(expected);
  });

  it.each(cases.formatUsage)('prints usage $usagePerKg $unit as $expected', (row) => {
    expect(formatUsage(row.unit, row.usagePerKg)).toBe(row.expected);
  });

  it.each(cases.shortage)('words a shortage: $expected', (row) => {
    expect(shortageMessage(row.item, row.unit, row.needed, row.onHand)).toBe(row.expected);
  });
});

describe('the New Order bill', () => {
  it('words the wash type line', () => {
    expect(washBillLine('Regular washing', 0, 65, formatMoney)).toBe(
      'Regular washing — no extra charge',
    );
    expect(washBillLine('Tough stains', 500, 65, formatMoney)).toBe(
      'Tough stains — ₱5.00/kg × 6.5 kg = ₱32.50',
    );
  });

  it('plans the soap and warns about what is short', () => {
    const plan = soapPlan(
      [
        {
          inventory_item_id: 1,
          item_name: 'Detergent powder',
          unit_code: 'kg',
          usage_per_kg_small_unit: 25,
          on_hand: 5,
        },
        {
          inventory_item_id: 2,
          item_name: 'Fabric conditioner',
          unit_code: 'L',
          usage_per_kg_small_unit: 20,
          on_hand: 0.08,
        },
      ],
      65,
    );
    expect(soapPreview(plan)).toBe('Detergent powder 163 g · Fabric conditioner 130 mL');
    expect(shortages(plan)).toEqual(['Fabric conditioner: needs 130 mL, only 80 mL recorded']);
    expect(plan[1]?.short).toBeCloseTo(0.05, 9);
  });

  it('plans nothing without per-kg weight', () => {
    expect(
      soapPlan(
        [
          {
            inventory_item_id: 1,
            item_name: 'A',
            unit_code: 'L',
            usage_per_kg_small_unit: 30,
            on_hand: 1,
          },
        ],
        0,
      ),
    ).toEqual([]);
  });
});
