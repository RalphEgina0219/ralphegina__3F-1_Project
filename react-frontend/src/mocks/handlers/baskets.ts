import { basketSequence, formatBasketNumber, parseScanInput } from '@/lib/basket';
import type { BasketStatus, Order } from '@/types/entities';
import { db, generateQrToken, nextId } from '../db';
import { asNumber, asString, fail, invalid, ok, paginate, route } from '../http';
import { activeAssignment, audit, toBasketDto, toOrderDetailDto, userRef } from '../queries';

const MAX_BULK = 100;

function findBasket(id: string | undefined) {
  return db().baskets.find((b) => b.id === Number(id));
}

/** A token no other basket has. Tokens are created once, on save, and never regenerated. */
function uniqueToken(): string {
  const taken = new Set(db().baskets.map((b) => b.qr_token));
  let token = generateQrToken();
  while (taken.has(token)) token = generateQrToken();
  return token;
}

function orderNumberOf(orderId: number) {
  return db().orders.find((o) => o.id === orderId)?.order_number ?? 'another order';
}

/**
 * Checks basket_ids for a new order. Every basket must exist, must not be retired and must not
 * already hold an active order. Phase 2 repeats this inside the transaction with lockForUpdate().
 */
export function validateBasketIds(raw: unknown): {
  error: string | null;
  ids: number[];
  /** A basket that holds another order: Laravel answers 409, not 422. */
  conflict?: string;
} {
  const list = Array.isArray(raw) ? raw.map((value) => asNumber(value)) : [];
  if (list.length === 0) return { error: 'Add at least one basket.', ids: [] };
  if (list.some((id) => id === null || !Number.isInteger(id))) {
    return { error: 'Choose baskets from the list.', ids: [] };
  }
  const ids = [...new Set(list as number[])];
  for (const id of ids) {
    const basket = db().baskets.find((b) => b.id === id);
    if (!basket) return { error: 'One of the baskets does not exist.', ids: [] };
    if (basket.status === 'retired') {
      return { error: `${basket.basket_number} is retired and cannot be used.`, ids: [] };
    }
  }
  for (const id of ids) {
    const active = activeAssignment(id);
    if (active) {
      const basket = db().baskets.find((b) => b.id === id);
      return {
        error: null,
        ids: [],
        conflict: `${basket?.basket_number} is in use by ${orderNumberOf(active.order_id)}.`,
      };
    }
  }
  return { error: null, ids };
}

/** Writes the assignment rows and marks the baskets in use, in the order's transaction. */
export function assignBaskets(
  order: Order,
  basketIds: readonly number[],
  userId: number,
  at: string,
) {
  const { order_baskets, baskets } = db();
  for (const basketId of basketIds) {
    // The mock's version of UNIQUE(basket_id, active_flag): never two open rows for one basket.
    if (activeAssignment(basketId))
      throw new Error(`Basket ${basketId} already has an active order`);
    order_baskets.push({
      id: nextId(order_baskets),
      order_id: order.id,
      basket_id: basketId,
      assigned_at: at,
      assigned_by: userId,
      released_at: null,
    });
    const basket = baskets.find((b) => b.id === basketId);
    if (basket) {
      basket.status = 'in_use';
      basket.updated_at = at;
    }
  }
}

/** On completion: close the order's open assignments and free its baskets for the next customer. */
export function releaseBaskets(order: Order, at: string) {
  const { order_baskets, baskets } = db();
  for (const row of order_baskets) {
    if (row.order_id !== order.id || row.released_at !== null) continue;
    row.released_at = at;
    const basket = baskets.find((b) => b.id === row.basket_id);
    if (basket && basket.status === 'in_use') {
      basket.status = 'available';
      basket.updated_at = at;
    }
  }
}

const NOT_RECOGNIZED = 'QR not recognized. Scan a LaundryFlow basket label.';

export const basketHandlers = [
  route('get', '/baskets', 'baskets.scan', ({ query }) => {
    const status = query.get('status') as BasketStatus | null;
    const search = (query.get('search') ?? '').trim().toLowerCase();
    const all = db().baskets.map(toBasketDto);
    const rows = all
      .filter((b) => !status || b.status === status)
      .filter(
        (b) =>
          !search ||
          b.basket_number.toLowerCase().includes(search) ||
          (b.label ?? '').toLowerCase().includes(search) ||
          (b.current_order?.order_number.toLowerCase().includes(search) ?? false),
      )
      .sort((a, b) => a.basket_number.localeCompare(b.basket_number));
    const counts = { available: 0, in_use: 0, retired: 0 } as Record<BasketStatus, number>;
    for (const basket of all) counts[basket.status] += 1;
    return ok(paginate(rows, query, { counts }, 20));
  }),

  route('post', '/baskets', 'baskets.manage', ({ user, body }) => {
    const count = body.count === undefined ? 1 : asNumber(body.count);
    if (count === null || !Number.isInteger(count) || count < 1 || count > MAX_BULK) {
      return invalid({ count: `Add between 1 and ${MAX_BULK} baskets at a time.` });
    }
    const label = asString(body.label) || null;
    const now = new Date().toISOString();
    // Numbers continue after the highest ever issued, retired ones included, so none is reused.
    let sequence = Math.max(0, ...db().baskets.map((b) => basketSequence(b.basket_number)));
    const created = Array.from({ length: count }, () => {
      sequence += 1;
      const basket = {
        id: nextId(db().baskets),
        basket_number: formatBasketNumber(sequence),
        qr_token: uniqueToken(),
        label,
        status: 'available' as const,
        notes: null,
        created_by: user.id,
        created_at: now,
        updated_at: now,
      };
      db().baskets.push(basket);
      return basket;
    });
    audit(user.id, 'basket.created', 'basket', created[0]?.id ?? null, {
      count,
      basket_number: created[0]?.basket_number,
    });
    return ok({ data: created.map(toBasketDto) }, 201);
  }),

  // Registered before /baskets/:id so that "available" is not read as an id.
  route('get', '/baskets/available', 'baskets.scan', () =>
    ok({
      data: db()
        .baskets.filter((b) => b.status === 'available' && !activeAssignment(b.id))
        .sort((a, b) => a.basket_number.localeCompare(b.basket_number))
        .map(toBasketDto),
    }),
  ),

  route('get', '/baskets/:id', 'baskets.scan', ({ params }) => {
    const basket = findBasket(params.id);
    return basket ? ok(toBasketDto(basket)) : fail(404, 'Basket not found.');
  }),

  route('put', '/baskets/:id', 'baskets.manage', ({ user, params, body }) => {
    const basket = findBasket(params.id);
    if (!basket) return fail(404, 'Basket not found.');
    // Only the label and notes can change. The number and the QR token are permanent.
    const before = { label: basket.label, notes: basket.notes };
    if ('label' in body) basket.label = asString(body.label) || null;
    if ('notes' in body) basket.notes = asString(body.notes) || null;
    basket.updated_at = new Date().toISOString();
    audit(
      user.id,
      'basket.updated',
      'basket',
      basket.id,
      { basket_number: basket.basket_number, label: basket.label, notes: basket.notes },
      before,
    );
    return ok(toBasketDto(basket));
  }),

  route('post', '/baskets/:id/retire', 'baskets.manage', ({ user, params, body }) => {
    const basket = findBasket(params.id);
    if (!basket) return fail(404, 'Basket not found.');
    if (basket.status === 'retired')
      return fail(409, `${basket.basket_number} is already retired.`);
    const active = activeAssignment(basket.id);
    if (active) {
      return fail(
        409,
        `${basket.basket_number} is in use by ${orderNumberOf(active.order_id)}. Complete that order first.`,
      );
    }
    const reason = asString(body.reason);
    basket.status = 'retired';
    if (reason) basket.notes = reason;
    basket.updated_at = new Date().toISOString();
    audit(user.id, 'basket.retired', 'basket', basket.id, {
      basket_number: basket.basket_number,
      reason: reason || null,
    });
    return ok(toBasketDto(basket));
  }),

  route('get', '/baskets/:id/history', 'baskets.scan', ({ params, query }) => {
    const basket = findBasket(params.id);
    if (!basket) return fail(404, 'Basket not found.');
    const { orders, customers } = db();
    const rows = db()
      .order_baskets.filter((ob) => ob.basket_id === basket.id)
      .sort((a, b) => b.assigned_at.localeCompare(a.assigned_at) || b.id - a.id)
      .map((ob) => {
        const order = orders.find((o) => o.id === ob.order_id);
        return {
          id: ob.id,
          order_id: ob.order_id,
          order_number: order?.order_number ?? '',
          customer_name: customers.find((c) => c.id === order?.customer_id)?.full_name ?? '',
          assigned_at: ob.assigned_at,
          assigned_by: userRef(ob.assigned_by),
          released_at: ob.released_at,
        };
      });
    return ok(paginate(rows, query, {}, 10));
  }),

  /** Resolves a basket label (token), a typed basket number or a typed order number. */
  route('get', '/scan/:code', 'baskets.scan', ({ params }) => {
    const input = parseScanInput(decodeURIComponent(params.code ?? ''));
    if (!input) return fail(404, NOT_RECOGNIZED);

    if (input.kind === 'order_number') {
      const order = db().orders.find((o) => o.order_number === input.value);
      return order
        ? ok({ type: 'order', order: toOrderDetailDto(order) })
        : fail(404, `No order matches ${input.value}.`);
    }

    const basket = db().baskets.find((b) =>
      input.kind === 'token' ? b.qr_token === input.value : b.basket_number === input.value,
    );
    if (!basket) {
      return fail(
        404,
        input.kind === 'token' ? NOT_RECOGNIZED : `No basket matches ${input.value}.`,
      );
    }
    const active = activeAssignment(basket.id);
    const order = active && db().orders.find((o) => o.id === active.order_id);
    return ok({
      type: 'basket',
      basket: toBasketDto(basket),
      active_order: order ? toOrderDetailDto(order) : null,
    });
  }),
];
