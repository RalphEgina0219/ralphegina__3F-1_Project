import { formatMoney } from '@/lib/money';
import { formatUsage, SOAP_UNITS } from '@/lib/wash';
import type { WashType } from '@/types/entities';
import { db, nextId, persist } from '../db';
import { asNumber, asString, fail, invalid, ok, route } from '../http';
import { audit } from '../queries';
import { toWashTypeDto } from '../soap';

interface RawSupply {
  inventory_item_id?: unknown;
  usage_per_kg_small_unit?: unknown;
}

/** The same rules as Laravel's SaveWashTypeRequest. */
function validate(body: Record<string, unknown>, current: WashType | null) {
  const errors: Record<string, string> = {};
  const { wash_types, inventory_items, units } = db();

  if ('name' in body || !current) {
    const name = asString(body.name);
    if (!name) errors.name = 'Enter the wash type name.';
    else if (wash_types.some((w) => w.name === name && w.id !== current?.id)) {
      errors.name = 'Another wash type already has that name.';
    }
  }
  if (body.surcharge_per_kg_cents !== undefined) {
    const cents = asNumber(body.surcharge_per_kg_cents);
    if (cents === null || !Number.isInteger(cents) || cents < 0 || cents > 1_000_000) {
      errors.surcharge_per_kg_cents = 'Enter an amount of 0 or more, with at most 2 decimals.';
    }
  }
  if (
    body.is_active === false &&
    current?.is_active &&
    !wash_types.some((w) => w.is_active && w.id !== current.id)
  ) {
    errors.is_active = 'At least one wash type must stay active.';
  }

  if (Array.isArray(body.supplies)) {
    const seen = new Set<number>();
    (body.supplies as RawSupply[]).forEach((supply, index) => {
      const item = inventory_items.find((i) => i.id === asNumber(supply.inventory_item_id));
      const unit = units.find((u) => u.id === item?.unit_id)?.code ?? '';
      if (!item || !item.is_active || !(SOAP_UNITS as readonly string[]).includes(unit)) {
        errors[`supplies.${index}.inventory_item_id`] =
          'Choose an active item that is counted in L, kg or pcs.';
        return;
      }
      if (seen.has(item.id)) {
        errors[`supplies.${index}.inventory_item_id`] =
          `${item.name} is already used by this wash type.`;
        return;
      }
      seen.add(item.id);
      const usage = asNumber(supply.usage_per_kg_small_unit);
      if (usage === null || usage <= 0 || usage > 1_000_000) {
        errors[`supplies.${index}.usage_per_kg_small_unit`] = 'Enter an amount above zero.';
      } else if (Math.abs(usage * 1000 - Math.round(usage * 1000)) > 1e-6) {
        errors[`supplies.${index}.usage_per_kg_small_unit`] = 'Use at most 3 decimals.';
      }
    });
  }
  return errors;
}

/** Writes one audit row per change, like Laravel's SaveWashType action. */
function save(userId: number, washType: WashType | null, body: Record<string, unknown>) {
  const now = new Date().toISOString();
  const { wash_types, wash_type_supplies, inventory_items, units } = db();
  const unitOf = (itemId: number) =>
    units.find((u) => u.id === inventory_items.find((i) => i.id === itemId)?.unit_id)?.code ?? '';
  const nameOf = (itemId: number) => inventory_items.find((i) => i.id === itemId)?.name ?? '';
  const usageOf = (id: number) =>
    new Map(
      wash_type_supplies
        .filter((s) => s.wash_type_id === id)
        .map((s) => [s.inventory_item_id, s.usage_per_kg_small_unit] as const),
    );

  const log = (
    target: WashType,
    summary: string,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null,
  ) =>
    audit(
      userId,
      'wash_type.updated',
      'wash_type',
      target.id,
      { summary, wash_type: target.name, ...newValues },
      oldValues,
    );

  const isNew = !washType;
  const oldSupplies = washType ? usageOf(washType.id) : new Map<number, number>();
  const before = washType ? { ...washType } : null;
  const target: WashType =
    washType ??
    ({
      id: nextId(wash_types),
      name: '',
      description: null,
      surcharge_per_kg_cents: 0,
      sort_order: wash_types.reduce((max, w) => Math.max(max, w.sort_order), 0) + 1,
      is_active: true,
      created_at: now,
      updated_at: now,
    } satisfies WashType);

  if (body.name !== undefined) target.name = asString(body.name);
  if (body.description !== undefined) target.description = asString(body.description) || null;
  if (body.surcharge_per_kg_cents !== undefined) {
    target.surcharge_per_kg_cents = Number(body.surcharge_per_kg_cents);
  }
  if (body.sort_order !== undefined) target.sort_order = Number(body.sort_order);
  if (typeof body.is_active === 'boolean') target.is_active = body.is_active;
  target.updated_at = now;
  if (isNew) wash_types.push(target);

  if (Array.isArray(body.supplies)) {
    const next = (body.supplies as RawSupply[]).map((s) => ({
      item: Number(s.inventory_item_id),
      usage: Number(s.usage_per_kg_small_unit),
    }));
    const kept = wash_type_supplies.filter((s) => s.wash_type_id !== target.id);
    wash_type_supplies.length = 0;
    wash_type_supplies.push(...kept);
    for (const row of next) {
      wash_type_supplies.push({
        id: nextId(wash_type_supplies),
        wash_type_id: target.id,
        inventory_item_id: row.item,
        usage_per_kg_small_unit: row.usage,
      });
    }
  }

  const name = target.name;
  if (!before) {
    log(target, `added wash type ${name}`, null, { name });
  } else {
    if (before.name !== name)
      log(target, `renamed wash type ${before.name} → ${name}`, { name: before.name }, { name });
    if (before.description !== target.description) {
      log(
        target,
        `${name} · description changed`,
        { description: before.description },
        { description: target.description },
      );
    }
    if (before.surcharge_per_kg_cents !== target.surcharge_per_kg_cents) {
      log(
        target,
        `${name} · surcharge: ${formatMoney(before.surcharge_per_kg_cents)}/kg → ${formatMoney(target.surcharge_per_kg_cents)}/kg`,
        { surcharge_per_kg_cents: before.surcharge_per_kg_cents },
        { surcharge_per_kg_cents: target.surcharge_per_kg_cents },
      );
    }
    if (before.sort_order !== target.sort_order) {
      log(
        target,
        `${name} · order: ${before.sort_order} → ${target.sort_order}`,
        { sort_order: before.sort_order },
        { sort_order: target.sort_order },
      );
    }
    if (before.is_active !== target.is_active) {
      log(
        target,
        `${name} · ${target.is_active ? 'activated' : 'deactivated'}`,
        { is_active: before.is_active },
        { is_active: target.is_active },
      );
    }
  }

  const newSupplies = usageOf(target.id);
  for (const itemId of new Set([...newSupplies.keys(), ...oldSupplies.keys()])) {
    const was = oldSupplies.get(itemId);
    const now2 = newSupplies.get(itemId);
    if (was !== undefined && now2 !== undefined && was === now2) continue;
    const item = nameOf(itemId);
    const unit = unitOf(itemId);
    const summary =
      was === undefined
        ? `${name} · added ${item}: ${formatUsage(unit, now2 as number)}`
        : now2 === undefined
          ? `${name} · removed ${item}: ${formatUsage(unit, was)}`
          : `${name} · ${item}: ${formatUsage(unit, was)} → ${formatUsage(unit, now2)}`;
    log(
      target,
      summary,
      was === undefined ? null : { item, usage_per_kg_small_unit: was },
      now2 === undefined ? null : { item, usage_per_kg_small_unit: now2 },
    );
  }
  persist();
  return target;
}

export const washTypeHandlers = [
  // Staff read the wash types to take orders (with the soap and its stock); only the owner edits them.
  route('get', '/wash-types', 'orders.manage', ({ query }) => {
    const active = query.get('active');
    const rows = db()
      .wash_types.filter(
        (w) => active === null || w.is_active === (active === '1' || active === 'true'),
      )
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
      .map(toWashTypeDto);
    return ok({
      data: rows,
      meta: { block_orders_on_low_soap: db().shop_settings.block_orders_on_low_soap },
    });
  }),

  route('post', '/wash-types', 'settings.manage', ({ user, body }) => {
    const errors = validate(body, null);
    if (Object.keys(errors).length > 0) return invalid(errors);
    return ok(toWashTypeDto(save(user.id, null, body)), 201);
  }),

  route('put', '/wash-types/:id', 'settings.manage', ({ user, params, body }) => {
    const washType = db().wash_types.find((w) => w.id === Number(params.id));
    if (!washType) return fail(404, 'Wash type not found.');
    const errors = validate(body, washType);
    if (Object.keys(errors).length > 0) return invalid(errors);
    return ok(toWashTypeDto(save(user.id, washType, body)));
  }),

  route('put', '/settings/stock-rule', 'settings.manage', ({ user, body }) => {
    if (typeof body.block_orders_on_low_soap !== 'boolean') {
      return invalid({ block_orders_on_low_soap: 'Choose on or off.' });
    }
    const settings = db().shop_settings;
    const before = settings.block_orders_on_low_soap;
    settings.block_orders_on_low_soap = body.block_orders_on_low_soap;
    if (before !== settings.block_orders_on_low_soap) {
      audit(
        user.id,
        'settings.stock_rule_updated',
        'shop_settings',
        1,
        {
          summary: `turned ${settings.block_orders_on_low_soap ? 'on' : 'off'} "Block new orders when soap stock is insufficient"`,
          block_orders_on_low_soap: settings.block_orders_on_low_soap,
        },
        { block_orders_on_low_soap: before },
      );
    }
    return ok({ block_orders_on_low_soap: settings.block_orders_on_low_soap });
  }),
];
