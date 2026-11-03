import type { PaymentStatus, PricingType } from '@/types/entities';

export interface BillableLine {
  pricing_type: PricingType;
  rate_cents: number;
  minimum_qty?: number | null;
  weight_kg?: number | null;
  quantity?: number | null;
}

/** Weights are held in whole tenths of a kilogram so that no float reaches the money math. */
export function kgToTenths(weightKg: number): number {
  return Math.round(weightKg * 10);
}

/** The billable weight or quantity after any minimum is applied. */
export function billableQuantity(line: BillableLine): number {
  switch (line.pricing_type) {
    case 'per_kg': {
      const tenths = Math.max(kgToTenths(line.weight_kg ?? 0), kgToTenths(line.minimum_qty ?? 0));
      return tenths / 10;
    }
    case 'per_piece':
      return line.quantity ?? 0;
    case 'flat':
      return 1;
  }
}

export function lineSubtotalCents(line: BillableLine): number {
  switch (line.pricing_type) {
    case 'per_kg': {
      if (kgToTenths(line.weight_kg ?? 0) <= 0) return 0;
      const tenths = Math.max(kgToTenths(line.weight_kg ?? 0), kgToTenths(line.minimum_qty ?? 0));
      return Math.round((tenths * line.rate_cents) / 10);
    }
    case 'per_piece':
      return Math.max(0, Math.trunc(line.quantity ?? 0)) * line.rate_cents;
    case 'flat':
      return line.rate_cents;
  }
}

export function orderTotalCents(subtotals: readonly number[]): number {
  return subtotals.reduce((sum, value) => sum + value, 0);
}

export interface PaymentLike {
  amount_cents: number;
  voided_at: string | null;
}

export function amountPaidCents(payments: readonly PaymentLike[]): number {
  return payments.reduce((sum, p) => (p.voided_at ? sum : sum + p.amount_cents), 0);
}

export function balanceCents(totalCents: number, paidCents: number): number {
  return Math.max(0, totalCents - paidCents);
}

export function paymentStatus(totalCents: number, paidCents: number): PaymentStatus {
  if (paidCents <= 0) return 'unpaid';
  return paidCents >= totalCents ? 'paid' : 'partial';
}
