import { stockStatus } from '@/lib/inventory';
import {
  formatAmount,
  formatUsage,
  shortageMessage,
  soapPlan,
  type SoapNeed,
  type SupplyLike,
} from '@/lib/wash';
import type { WashTypeDto } from '@/types/api';
import type { Order, WashType } from '@/types/entities';
import { db, nextId } from './db';
import { addNotification, itemOnHand } from './queries';

/** A wash type's soaps with each item's stock, as the order form and the settings page read them. */
export function supplyRows(
  washTypeId: number,
): (SupplyLike & { id: number; is_item_active: boolean })[] {
  const { wash_type_supplies, inventory_items, units } = db();
  return wash_type_supplies
    .filter((s) => s.wash_type_id === washTypeId)
    .sort((a, b) => a.id - b.id)
    .flatMap((supply) => {
      const item = inventory_items.find((i) => i.id === supply.inventory_item_id);
      if (!item) return [];
      return [
        {
          id: supply.id,
          inventory_item_id: item.id,
          item_name: item.name,
          unit_code: units.find((u) => u.id === item.unit_id)?.code ?? '',
          is_item_active: item.is_active,
          usage_per_kg_small_unit: supply.usage_per_kg_small_unit,
          on_hand: itemOnHand(item.id),
        },
      ];
    });
}

export function toWashTypeDto(washType: WashType): WashTypeDto {
  return {
    id: washType.id,
    name: washType.name,
    description: washType.description,
    surcharge_per_kg_cents: washType.surcharge_per_kg_cents,
    sort_order: washType.sort_order,
    is_active: washType.is_active,
    supplies: supplyRows(washType.id).map((row) => ({
      id: row.id,
      inventory_item_id: row.inventory_item_id,
      item_name: row.item_name,
      unit_code: row.unit_code,
      is_item_active: row.is_item_active,
      usage_per_kg_small_unit: row.usage_per_kg_small_unit,
      usage_label: formatUsage(row.unit_code, row.usage_per_kg_small_unit),
      on_hand: row.on_hand,
    })),
  };
}

/** What the order needs from each soap of its wash type, against the stock. */
export function planSoap(washTypeId: number, perKgTenths: number): SoapNeed[] {
  return soapPlan(supplyRows(washTypeId), perKgTenths);
}

/** The 409 message when the shop blocks orders on a shortage and a soap is short; otherwise null. */
export function blockedMessage(plan: readonly SoapNeed[]): string | null {
  if (!db().shop_settings.block_orders_on_low_soap) return null;
  const messages = plan
    .filter((row) => row.short > 0)
    .map((row) => shortageMessage(row.item_name, row.unit_code, row.needed, row.on_hand));
  return messages.length > 0 ? `Not enough soap in stock. ${messages.join('; ')}.` : null;
}

/** One usage movement per soap, by the staff member who took the order. Stock never goes below zero. */
export function deductSoap(
  order: Order,
  washType: WashType,
  perKgTenths: number,
  plan: readonly SoapNeed[],
  userId: number,
) {
  const { inventory_movements, inventory_items } = db();
  for (const row of plan) {
    const deducted = Math.round(Math.min(row.needed, row.on_hand) * 1000) / 1000;
    let remarks = `Order ${order.order_number} · ${washType.name} · ${perKgTenths / 10} kg`;
    if (row.short > 0) {
      remarks += ` · short by ${formatAmount(row.unit_code, row.short)}, only ${formatAmount(row.unit_code, row.on_hand)} was recorded`;
    }
    inventory_movements.push({
      id: nextId(inventory_movements),
      item_id: row.inventory_item_id,
      user_id: userId,
      order_id: order.id,
      type: 'usage',
      quantity: deducted,
      required_quantity: row.needed,
      remarks,
      moved_at: order.received_at,
    });

    if (row.short > 0) {
      addNotification(
        'low_stock',
        `Record a stock-in for ${row.item_name}: order ${order.order_number} needed ${formatAmount(row.unit_code, row.needed)} but only ${formatAmount(row.unit_code, row.on_hand)} was recorded.`,
        order.id,
      );
    }
    const item = inventory_items.find((i) => i.id === row.inventory_item_id);
    if (item) {
      const after = Math.round((row.on_hand - deducted) * 1000) / 1000;
      const before = stockStatus(row.on_hand, item.reorder_level);
      const now = stockStatus(after, item.reorder_level);
      if (now !== 'ok' && now !== before) {
        addNotification(
          'low_stock',
          `${item.name} is ${now === 'critical' ? 'critically low' : 'below its reorder level'} (${after} ${row.unit_code} left).`,
        );
      }
    }
  }
}
