import { isValidEmail, normalizeEmail } from '@/lib/accounts';
import { normalizePhone } from '@/lib/format';
import type { Customer, CustomerAccount } from '@/types/entities';
import { db, generateTemporaryPassword, nextId } from '../db';
import { asNumber, asString, fail, invalid, ok, paginate, route } from '../http';
import { accountOf, audit, toCustomerDto, toOrderDto } from '../queries';

export const digitsOnly = (value: string) => value.replace(/\D/g, '');

function validateCustomer(body: Record<string, unknown>, ignoreId?: number) {
  const errors: Record<string, string> = {};
  const full_name = asString(body.full_name).replace(/\s+/g, ' ');
  const contact_number = normalizePhone(asString(body.contact_number));
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

/** Email rules shared by every way an account is created. */
export function emailProblem(raw: unknown): string | null {
  const email = normalizeEmail(asString(raw));
  if (!email) return 'Enter an email address.';
  if (!isValidEmail(email)) return 'Enter a valid email address.';
  if (db().customer_accounts.some((a) => a.email === email)) {
    return 'This email is already registered.';
  }
  return null;
}

/**
 * Creates the account with a temporary password that staff read out once. Only the stand-in for
 * its hash is kept, and the customer must change it on first sign-in.
 */
function createAccountWithTemporaryPassword(customer: Customer, email: string) {
  const now = new Date().toISOString();
  const account: CustomerAccount = {
    id: nextId(db().customer_accounts),
    customer_id: customer.id,
    email: normalizeEmail(email),
    is_active: true,
    must_change_password: true,
    last_login_at: null,
    created_at: now,
    updated_at: now,
  };
  const temporary_password = generateTemporaryPassword();
  db().customer_accounts.push(account);
  db().customer_credentials[account.id] = temporary_password;
  return temporary_password;
}

function findCustomer(id: string | undefined) {
  return db().customers.find((c) => c.id === Number(id));
}

export const customerHandlers = [
  route('get', '/barangays', null, () => ok({ data: db().barangays })),

  route('get', '/customers', 'customers.manage', ({ query }) => {
    const search = (query.get('search') ?? '').trim().toLowerCase();
    const searchDigits = digitsOnly(search);
    const rows = db()
      .customers.map(toCustomerDto)
      .filter(
        (c) =>
          !search ||
          c.full_name.toLowerCase().includes(search) ||
          (c.account?.email.includes(search) ?? false) ||
          (searchDigits.length > 0 && c.contact_number.includes(searchDigits)),
      )
      .sort((a, b) => (b.last_visit_at ?? '').localeCompare(a.last_visit_at ?? ''));
    const withBalance = db()
      .customers.map(toCustomerDto)
      .filter((c) => c.balance_cents > 0).length;
    return ok(paginate(rows, query, { with_balance: withBalance }));
  }),

  /** Counter registration: the profile and its account in one step. */
  route('post', '/customers', 'customers.manage', ({ user, body }) => {
    const { errors, values } = validateCustomer(body);
    const email = emailProblem(body.email);
    if (email) errors.email = email;
    if (Object.keys(errors).length > 0) return invalid(errors);
    const now = new Date().toISOString();
    const customer: Customer = {
      id: nextId(db().customers),
      ...values,
      created_at: now,
      updated_at: now,
    };
    db().customers.push(customer);
    const temporary_password = createAccountWithTemporaryPassword(customer, asString(body.email));
    audit(user.id, 'customer.created', 'customer', customer.id, { full_name: customer.full_name });
    audit(user.id, 'customer.account_created', 'customer', customer.id, {
      full_name: customer.full_name,
    });
    return ok({ customer: toCustomerDto(customer), temporary_password }, 201);
  }),

  route('get', '/customers/:id', 'customers.manage', ({ params }) => {
    const customer = findCustomer(params.id);
    return customer ? ok(toCustomerDto(customer)) : fail(404, 'Customer not found.');
  }),

  route('put', '/customers/:id', 'customers.manage', ({ user, params, body }) => {
    const customer = findCustomer(params.id);
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

  /** "Create account" for a legacy profile: the same flow as counter registration. */
  route('post', '/customers/:id/account', 'customers.manage', ({ user, params, body }) => {
    const customer = findCustomer(params.id);
    if (!customer) return fail(404, 'Customer not found.');
    if (accountOf(customer.id)) return fail(409, 'This customer already has an account.');
    const email = emailProblem(body.email);
    if (email) return invalid({ email });
    const temporary_password = createAccountWithTemporaryPassword(customer, asString(body.email));
    audit(user.id, 'customer.account_created', 'customer', customer.id, {
      full_name: customer.full_name,
    });
    return ok({ customer: toCustomerDto(customer), temporary_password }, 201);
  }),

  route('post', '/customers/:id/reset-password', 'customers.manage', ({ user, params }) => {
    const customer = findCustomer(params.id);
    if (!customer) return fail(404, 'Customer not found.');
    const account = accountOf(customer.id);
    if (!account) return fail(409, 'This customer has no account yet. Create one first.');
    const temporary_password = generateTemporaryPassword();
    db().customer_credentials[account.id] = temporary_password;
    account.must_change_password = true;
    account.updated_at = new Date().toISOString();
    audit(user.id, 'customer.password_reset', 'customer', customer.id, {
      full_name: customer.full_name,
    });
    return ok({ customer: toCustomerDto(customer), temporary_password });
  }),

  /** Disable or enable sign-in. Owner only. Orders and history are untouched either way. */
  route('put', '/customers/:id/account', 'settings.manage', ({ user, params, body }) => {
    const customer = findCustomer(params.id);
    const account = customer && accountOf(customer.id);
    if (!customer || !account) return fail(404, 'Account not found.');
    if (typeof body.is_active !== 'boolean') return invalid({ is_active: 'Choose on or off.' });
    account.is_active = body.is_active;
    account.updated_at = new Date().toISOString();
    audit(user.id, 'customer.account_updated', 'customer', customer.id, {
      full_name: customer.full_name,
      is_active: account.is_active,
    });
    return ok(toCustomerDto(customer));
  }),
];
