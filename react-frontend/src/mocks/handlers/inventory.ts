import { checkMovement, stockStatus } from '@/lib/inventory';
import { can } from '@/lib/permissions';
import type { InventoryItem, InventoryMovementType } from '@/types/entities';
import { db, nextId } from '../db';
import { asNumber, asString, fail, invalid, ok, paginate, route } from '../http';
import { addNotification, audit, itemOnHand, toInventoryItemDto, toMovementDto } from '../queries';

const MOVEMENT_TYPES: readonly InventoryMovementType[] = ['in', 'out', 'adjust'];

function validateItem(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const name = asString(body.name);
  const unit_id = asNumber(body.unit_id);
  const reorder_level = asNumber(body.reorder_level);
  if (name.length < 2) errors.name = 'Enter the item name.';
  if (!db().units.some((u) => u.id === unit_id)) errors.unit_id = 'Choose a unit.';
  if (reorder_level === null || reorder_level < 0) errors.reorder_level = 'Enter a reorder level.';
  return { errors, values: { name, unit_id: unit_id ?? 0, reorder_level: reorder_level ?? 0 } };
}

export const inventoryHandlers = [
  route('get', '/inventory/units', 'inventory.view', () => ok({ data: db().units })),

  route('get', '/inventory/items', 'inventory.view', () => {
    const rows = db()
      .inventory_items.filter((i) => i.is_active)
      .map(toInventoryItemDto)
      .sort((a, b) => {
        const rank = { critical: 0, low: 1, ok: 2 };
        return rank[a.stock_status] - rank[b.stock_status];
      });
    return ok({ data: rows });
  }),

  route('post', '/inventory/items', 'inventory.manage', ({ user, body }) => {
    const { errors, values } = validateItem(body);
    if (Object.keys(errors).length > 0) return invalid(errors);
    const item: InventoryItem = { id: nextId(db().inventory_items), ...values, is_active: true };
    db().inventory_items.push(item);
    audit(user.id, 'inventory.item_created', 'inventory_item', item.id, { name: item.name });
    return ok(toInventoryItemDto(item), 201);
  }),

  route('put', '/inventory/items/:id', 'inventory.manage', ({ user, params, body }) => {
    const item = db().inventory_items.find((i) => i.id === Number(params.id));
    if (!item) return fail(404, 'Item not found.');
    const { errors, values } = validateItem({ ...item, ...body });
    if (Object.keys(errors).length > 0) return invalid(errors);
    const before = { name: item.name, reorder_level: item.reorder_level };
    Object.assign(item, values, { is_active: body.is_active !== false });
    audit(
      user.id,
      'inventory.item_updated',
      'inventory_item',
      item.id,
      { name: item.name, reorder_level: item.reorder_level },
      before,
    );
    return ok(toInventoryItemDto(item));
  }),

  route(
    'post',
    '/inventory/movements',
    ['inventory.manage', 'inventory.stock_out'],
    ({ user, body }) => {
      const item = db().inventory_items.find((i) => i.id === asNumber(body.item_id) && i.is_active);
      const type = asString(body.type) as InventoryMovementType;
      const quantity = asNumber(body.quantity);
      const remarks = asString(body.remarks) || null;

      const errors: Record<string, string> = {};
      if (!item) errors.item_id = 'Choose an item.';
      if (!MOVEMENT_TYPES.includes(type)) errors.type = 'Choose a movement type.';
      if (quantity === null) errors.quantity = 'Enter a quantity.';
      if (type === 'adjust' && !remarks) errors.remarks = 'Say why the count is being adjusted.';
      if (Object.keys(errors).length > 0 || !item || quantity === null) return invalid(errors);

      if (type !== 'out' && !can(user, 'inventory.manage')) {
        return fail(403, 'Only an administrator can record stock-in or adjustments.');
      }

      const current = itemOnHand(item.id);
      const check = checkMovement(type, quantity, current);
      if (!check.ok) return invalid({ quantity: check.message });

      const movements = db().inventory_movements;
      const movement = {
        id: nextId(movements),
        item_id: item.id,
        user_id: user.id,
        type,
        quantity,
        remarks,
        moved_at: new Date().toISOString(),
      };
      movements.push(movement);

      const before = stockStatus(current, item.reorder_level);
      const after = stockStatus(itemOnHand(item.id), item.reorder_level);
      if (after !== 'ok' && after !== before) {
        const unit = db().units.find((u) => u.id === item.unit_id)?.code ?? '';
        addNotification(
          'low_stock',
          `${item.name} is ${after === 'critical' ? 'critically low' : 'below its reorder level'} (${itemOnHand(item.id)} ${unit} left).`,
        );
      }
      audit(user.id, 'inventory.movement', 'inventory_item', item.id, {
        item_name: item.name,
        type,
        quantity,
        remarks,
      });
      return ok(toMovementDto(movement), 201);
    },
  ),

  route('get', '/inventory/movements', 'inventory.view', ({ query }) => {
    const itemId = Number(query.get('item_id')) || null;
    const rows = db()
      .inventory_movements.filter((m) => !itemId || m.item_id === itemId)
      .sort((a, b) => b.moved_at.localeCompare(a.moved_at) || b.id - a.id)
      .map(toMovementDto);
    return ok(paginate(rows, query, {}, 8));
  }),
];
