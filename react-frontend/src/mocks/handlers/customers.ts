import type { Customer } from '@/types/entities';
import { db, nextId } from '../db';
import { asNumber, asString, fail, invalid, ok, paginate, route } from '../http';
import { audit, toCustomerDto, toOrderDto } from '../queries';

export const digitsOnly = (value: string) => value.replace(/\D/g, '');

function validateCustomer(body: Record<string, unknown>, ignoreId?: number) {
  const errors: Record<string, string> = {};
  const full_name = asString(body.full_name);
  const contact_number = digitsOnly(asString(body.contact_number));
  const barangay_id = asNumber(body.barangay_id);

  if (full_name.length < 2) errors.full_name = 'Enter the full name.';
  if (!/^09\d{9}$/.test(contact_number)) {
    errors.contact_number = 'Use the format 09XX XXX XXXX.';
  } else if (db().customers.some((c) => c.contact_number === contact_number && c.id !== ignoreId)) {
    errors.contact_number = 'A customer with this contact number already exists.';
  }
  if (!db().barangays.some((b) => b.id === barangay_id)) errors.barangay_id = 'Choose a barangay.';

  return {
    errors,
    values: {
      full_name,
      contact_number,
      barangay_id: barangay_id ?? 0,
      street_address: asString(body.street_address) || null,
      notes: asString(body.notes) || null,
    },
  };
}

export const customerHandlers = [
  route('get', '/barangays', null, () => ok({ data: db().barangays })),

  route('get', '/customers', 'customers.manage', ({ query }) => {
    const search = (query.get('search') ?? '').trim().toLowerCase();
    const searchDigits = digitsOnly(search);
    const rows = db()
      .customers.filter(
        (c) =>
          !search ||
          c.full_name.toLowerCase().includes(search) ||
          (searchDigits.length > 0 && c.contact_number.includes(searchDigits)),
      )
      .map(toCustomerDto)
      .sort((a, b) => (b.last_visit_at ?? '').localeCompare(a.last_visit_at ?? ''));
    const withBalance = db()
      .customers.map(toCustomerDto)
      .filter((c) => c.balance_cents > 0).length;
    return ok(paginate(rows, query, { with_balance: withBalance }));
  }),

  route('post', '/customers', 'customers.manage', ({ user, body }) => {
    const { errors, values } = validateCustomer(body);
    if (Object.keys(errors).length > 0) return invalid(errors);
    const now = new Date().toISOString();
    const customer: Customer = {
      id: nextId(db().customers),
      ...values,
      created_at: now,
      updated_at: now,
    };
    db().customers.push(customer);
    audit(user.id, 'customer.created', 'customer', customer.id, { full_name: customer.full_name });
    return ok(toCustomerDto(customer), 201);
  }),

  route('get', '/customers/:id', 'customers.manage', ({ params }) => {
    const customer = db().customers.find((c) => c.id === Number(params.id));
    return customer ? ok(toCustomerDto(customer)) : fail(404, 'Customer not found.');
  }),

  route('put', '/customers/:id', 'customers.manage', ({ user, params, body }) => {
    const customer = db().customers.find((c) => c.id === Number(params.id));
    if (!customer) return fail(404, 'Customer not found.');
    const { errors, values } = validateCustomer(body, customer.id);
    if (Object.keys(errors).length > 0) return invalid(errors);
    const before = { full_name: customer.full_name, contact_number: customer.contact_number };
    Object.assign(customer, values, { updated_at: new Date().toISOString() });
    audit(
      user.id,
      'customer.updated',
      'customer',
      customer.id,
      { full_name: customer.full_name },
      before,
    );
    return ok(toCustomerDto(customer));
  }),

  route('get', '/customers/:id/orders', 'customers.manage', ({ params, query }) => {
    const rows = db()
      .orders.filter((o) => o.customer_id === Number(params.id))
      .sort((a, b) => b.received_at.localeCompare(a.received_at))
      .map(toOrderDto);
    return ok(paginate(rows, query, {}, 50));
  }),
];
