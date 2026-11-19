import { kgToTenths } from '@/lib/billing';
import type { PricingType } from '@/types/entities';

/**
 * Wash type and soap rules. The Laravel port is app/Support/WashRules.php; both are tested with
 * shared/wash-cases.json, so the two sides give the same answers.
 *
 * Weights are whole tenths of a kilogram. A wash type's surcharge and its soap both apply to the
 * order's per-kg weight: the actual weights of all per-kg lines (not the billable minimum).
 * Usage is entered per kilo in the item's small unit: g for kg items, mL for L items, pieces for
 * pcs items (usage_per_kg_small_unit).
 */

/** Shown wherever the wash type is chosen. */
export const WASH_TYPE_HINT = 'Wash type applies to laundry weighed by kilo.';

/** The units a soap item may have. */
export const SOAP_UNITS = ['L', 'kg', 'pcs'] as const;

export interface WeighedLine {
  pricing_type: PricingType;
  weight_kg?: number | null;
}

/** Total weight of the per-kg lines in tenths of a kilogram. Other lines do not count. */
export function perKgTenths(lines: readonly WeighedLine[]): number {
  return lines.reduce(
    (sum, line) => (line.pricing_type === 'per_kg' ? sum + kgToTenths(line.weight_kg ?? 0) : sum),
    0,
  );
}

/** surcharge per kg × weight, in whole centavos. */
export function washSurchargeCents(perKgTenthsValue: number, surchargePerKgCents: number): number {
  if (perKgTenthsValue <= 0 || surchargePerKgCents <= 0) return 0;
  return Math.round((perKgTenthsValue * surchargePerKgCents) / 10);
}

const roundTo = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/**
 * The amount of an item an order uses, in the item's unit. pcs rounds up to whole pieces; kg and
 * L keep three decimals (1 g or 1 mL).
 */
export function usageQuantity(
  unitCode: string,
  usagePerKgSmallUnit: number,
  perKgTenthsValue: number,
): number {
  if (perKgTenthsValue <= 0 || usagePerKgSmallUnit <= 0) return 0;
  // Rounded to 6 decimals first, so 3.0000000000000004 pieces is 3 and not 4.
  const small = roundTo((usagePerKgSmallUnit * perKgTenthsValue) / 10, 6);
  if (unitCode === 'pcs') return Math.ceil(small);
  if (unitCode === 'kg' || unitCode === 'L') return Math.round(small) / 1000;
  throw new Error(`Soap items use kg, L or pcs, not ${unitCode}`);
}

/** A number the way InventoryRules::format prints it: 2, 3.5, 0.125. */
const plain = (value: number) => String(roundTo(value, 3));

/** A soap quantity the way the shop says it: 1.250 kg, 25 g, 325 mL, 2 pcs. */
export function formatAmount(unitCode: string, quantity: number): string {
  const value = roundTo(quantity, 3);
  if (unitCode === 'kg' && value < 1) return `${Math.round(value * 1000)} g`;
  if (unitCode === 'L' && value < 1) return `${Math.round(value * 1000)} mL`;
  if (unitCode === 'kg' || unitCode === 'L') return `${value.toFixed(3)} ${unitCode}`;
  return `${plain(value)} ${unitCode}`;
}

/** The unit usage is entered in: g, mL or pcs. */
export function smallUnit(unitCode: string): string {
  return unitCode === 'kg' ? 'g' : unitCode === 'L' ? 'mL' : unitCode;
}

/** Usage per kilo as the owner enters it: 25 g/kg, 30 mL/kg, 0.25 pcs/kg. */
export function formatUsage(unitCode: string, usagePerKgSmallUnit: number): string {
  return `${plain(usagePerKgSmallUnit)} ${smallUnit(unitCode)}/kg`;
}

/** "Fabric conditioner: needs 130 mL, only 80 mL recorded". */
export function shortageMessage(
  itemName: string,
  unitCode: string,
  needed: number,
  onHand: number,
): string {
  return `${itemName}: needs ${formatAmount(unitCode, needed)}, only ${formatAmount(unitCode, onHand)} recorded`;
}

export interface SupplyLike {
  inventory_item_id: number;
  item_name: string;
  unit_code: string;
  usage_per_kg_small_unit: number;
  on_hand: number;
}

export interface SoapNeed {
  inventory_item_id: number;
  item_name: string;
  unit_code: string;
  needed: number;
  on_hand: number;
  /** What is missing: 0 when the stock covers the order. */
  short: number;
}

/** What an order of this weight needs from each supply, against what the stock records show. */
export function soapPlan(supplies: readonly SupplyLike[], perKgTenthsValue: number): SoapNeed[] {
  if (perKgTenthsValue <= 0) return [];
  return supplies.map((supply) => {
    const needed = usageQuantity(
      supply.unit_code,
      supply.usage_per_kg_small_unit,
      perKgTenthsValue,
    );
    const on_hand = Math.max(0, supply.on_hand);
    return {
      inventory_item_id: supply.inventory_item_id,
      item_name: supply.item_name,
      unit_code: supply.unit_code,
      needed,
      on_hand,
      short: roundTo(Math.max(0, needed - on_hand), 3),
    };
  });
}

/** "Soap to be used: Detergent powder 163 g · Fabric conditioner 130 mL" */
export function soapPreview(plan: readonly SoapNeed[]): string {
  return plan
    .map((row) => `${row.item_name} ${formatAmount(row.unit_code, row.needed)}`)
    .join(' · ');
}

/** The warning lines for the items that are short. */
export function shortages(plan: readonly SoapNeed[]): string[] {
  return plan
    .filter((row) => row.short > 0)
    .map((row) => shortageMessage(row.item_name, row.unit_code, row.needed, row.on_hand));
}

/** "Regular washing — no extra charge" or "Tough stains — ₱5.00/kg × 6.5 kg = ₱32.50". */
export function washBillLine(
  name: string,
  surchargePerKgCents: number,
  perKgTenthsValue: number,
  formatMoney: (cents: number) => string,
): string {
  if (surchargePerKgCents <= 0) return `${name} — no extra charge`;
  if (perKgTenthsValue <= 0)
    return `${name} — ${formatMoney(surchargePerKgCents)}/kg, no per-kg laundry`;
  const cents = washSurchargeCents(perKgTenthsValue, surchargePerKgCents);
  return `${name} — ${formatMoney(surchargePerKgCents)}/kg × ${perKgTenthsValue / 10} kg = ${formatMoney(cents)}`;
}
