import type { InventoryMovementType } from '@/types/entities';

export type StockStatus = 'ok' | 'low' | 'critical';

export const STOCK_META: Record<
  StockStatus,
  { label: string; chip: string; bar: string; text: string }
> = {
  ok: { label: 'OK', chip: 'bg-ok-bg text-ok', bar: 'bg-ok-bar', text: 'text-text' },
  low: { label: 'Low', chip: 'bg-warn-bg text-warn', bar: 'bg-warn-bar', text: 'text-warn' },
  critical: {
    label: 'Critical',
    chip: 'bg-danger-bg text-danger',
    bar: 'bg-danger-bar',
    text: 'text-danger',
  },
};

/** Quantities stay exact to three decimals when summed. */
const round = (value: number) => Math.round(value * 1000) / 1000;

export function signedQuantity(type: InventoryMovementType, quantity: number): number {
  return type === 'out' || type === 'usage'
    ? -Math.abs(quantity)
    : type === 'in'
      ? Math.abs(quantity)
      : quantity;
}

export function onHand(
  movements: readonly { type: InventoryMovementType; quantity: number }[],
): number {
  return round(movements.reduce((sum, m) => sum + signedQuantity(m.type, m.quantity), 0));
}

export function stockStatus(onHandQty: number, reorderLevel: number): StockStatus {
  if (onHandQty <= reorderLevel * 0.5) return 'critical';
  return onHandQty <= reorderLevel ? 'low' : 'ok';
}

/** Bar fill: a full bar means at least twice the reorder level. */
export function stockLevelPercent(onHandQty: number, reorderLevel: number): number {
  if (reorderLevel <= 0) return onHandQty > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((onHandQty / (reorderLevel * 2)) * 100)));
}

export type MovementCheck = { ok: true } | { ok: false; message: string };

export function checkMovement(
  type: InventoryMovementType,
  quantity: number,
  currentOnHand: number,
): MovementCheck {
  if (type === 'adjust') {
    if (quantity === 0) return { ok: false, message: 'An adjustment cannot be zero.' };
    if (round(currentOnHand + quantity) < 0) {
      return {
        ok: false,
        message: `The adjustment would leave less than zero (${currentOnHand} on hand).`,
      };
    }
    return { ok: true };
  }
  if (quantity <= 0) return { ok: false, message: 'Quantity must be more than zero.' };
  if (type === 'out' && quantity > currentOnHand) {
    return { ok: false, message: `Stock-out cannot exceed the ${currentOnHand} on hand.` };
  }
  return { ok: true };
}
