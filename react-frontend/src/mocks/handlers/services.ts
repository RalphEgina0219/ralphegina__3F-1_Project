import { formatRate } from '@/lib/money';
import type { PricingType, Service } from '@/types/entities';
import { db, nextId } from '../db';
import { asNumber, asString, fail, invalid, ok, route } from '../http';
import { audit } from '../queries';

const PRICING_TYPES: readonly PricingType[] = ['per_kg', 'per_piece', 'flat'];

function validateService(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const name = asString(body.name);
  const pricing_type = asString(body.pricing_type) as PricingType;
  const rate_cents = asNumber(body.rate_cents);
  const minimum_qty = asNumber(body.minimum_qty);

  if (name.length < 2) errors.name = 'Enter the service name.';
  if (!PRICING_TYPES.includes(pricing_type)) errors.pricing_type = 'Choose a pricing type.';
  if (rate_cents === null || rate_cents <= 0 || !Number.isInteger(rate_cents)) {
    errors.rate_cents = 'Enter a rate above zero.';
  }
  if (minimum_qty !== null && minimum_qty < 0)
    errors.minimum_qty = 'The minimum cannot be negative.';

  return {
    errors,
    values: {
      name,
      description: asString(body.description) || null,
      pricing_type,
      rate_cents: rate_cents ?? 0,
      minimum_qty: pricing_type === 'per_kg' ? (minimum_qty ?? 0) : null,
      is_active: body.is_active !== false,
    },
  };
}

export const serviceHandlers = [
  route('get', '/services', 'orders.manage', ({ query }) => {
    const active = query.get('active');
    const rows = db().services.filter(
      (s) =>
        active === null || active === '' || s.is_active === (active === '1' || active === 'true'),
    );
    return ok({ data: rows });
  }),

  route('post', '/services', 'settings.manage', ({ user, body }) => {
    const { errors, values } = validateService(body);
    if (Object.keys(errors).length > 0) return invalid(errors);
    const now = new Date().toISOString();
    const service: Service = {
      id: nextId(db().services),
      ...values,
      created_at: now,
      updated_at: now,
    };
    db().services.push(service);
    audit(user.id, 'service.created', 'service', service.id, { name: service.name });
    return ok(service, 201);
  }),

  route('put', '/services/:id', 'settings.manage', ({ user, params, body }) => {
    const service = db().services.find((s) => s.id === Number(params.id));
    if (!service) return fail(404, 'Service not found.');
    const { errors, values } = validateService({ ...service, ...body });
    if (Object.keys(errors).length > 0) return invalid(errors);

    const previousRate = service.rate_cents;
    const before = { name: service.name, rate_cents: previousRate, is_active: service.is_active };
    Object.assign(service, values, { updated_at: new Date().toISOString() });
    const rateChanged = previousRate !== service.rate_cents;
    audit(
      user.id,
      'service.updated',
      'service',
      service.id,
      {
        name: service.name,
        rate_cents: service.rate_cents,
        is_active: service.is_active,
        ...(rateChanged
          ? {
              summary: `updated rate ${service.name} ${formatRate(previousRate)} → ${formatRate(service.rate_cents)}`,
            }
          : {}),
      },
      before,
    );
    return ok(service);
  }),
];
