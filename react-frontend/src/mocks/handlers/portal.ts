import {
  cleanName,
  LOGIN_ATTEMPTS_PER_MINUTE,
  normalizeEmail,
  passwordProblem,
} from '@/lib/accounts';
import { normalizePhone } from '@/lib/format';
import { isActiveStatus } from '@/lib/status';
import type { Customer, CustomerAccount } from '@/types/entities';
import {
  clearCustomerSession,
  db,
  loginAttempts,
  nextId,
  persist,
  setCustomerSession,
} from '../db';
import {
  asNumber,
  asString,
  currentCustomer,
  customerRoute,
  fail,
  invalid,
  ok,
  paginate,
  publicRoute,
} from '../http';
import {
  accountOf,
  audit,
  statusCode,
  toCustomerSelfDto,
  toPortalOrderDetailDto,
  toPortalOrderDto,
} from '../queries';
import { emailProblem } from './customers';

const MOCK_IP = '127.0.0.1';
const WINDOW_MS = 60_000;

/** Laravel's RateLimiter in miniature: 5 failed sign-ins per minute per email and IP. */
function throttleKey(email: string) {
  return `${email}|${MOCK_IP}`;
}

function recentFailures(key: string) {
  const since = Date.now() - WINDOW_MS;
  const recent = (loginAttempts.get(key) ?? []).filter((at) => at > since);
  loginAttempts.set(key, recent);
  return recent;
}

/** One rule for the phone, whether it comes from registration or the account page. */
function phoneProblem(raw: unknown, ignoreCustomerId?: number): string | null {
  const phone = normalizePhone(asString(raw));
  if (!/^09\d{9}$/.test(phone)) return 'Use a PH mobile number: 09XX XXX XXXX.';
  const owner = db().customers.find((c) => c.contact_number === phone);
  if (!owner || owner.id === ignoreCustomerId) return null;
  return accountOf(owner.id)
    ? 'This number is already registered.'
    : 'This number is already on file. Please ask the shop to set up your account.';
}

function confirmationProblem(body: Record<string, unknown>): Record<string, string> {
  const password = typeof body.password === 'string' ? body.password : '';
  const errors: Record<string, string> = {};
  const problem = passwordProblem(password);
  if (problem) errors.password = problem;
  else if (password !== body.password_confirmation) {
    errors.password_confirmation = 'The passwords do not match.';
  }
  return errors;
}

function ownOrder(customerId: number, orderNumber: string | undefined) {
  // Another customer's order answers exactly like a missing one, so numbers cannot be probed.
  return db().orders.find(
    (o) => o.customer_id === customerId && o.order_number === (orderNumber ?? '').toUpperCase(),
  );
}

export const portalHandlers = [
  // Registration needs the list before anyone is signed in. Names only, nothing private.
  publicRoute('get', '/customer/barangays', () => ok({ data: db().barangays })),

  publicRoute('post', '/customer/auth/register', ({ body }) => {
    const errors: Record<string, string> = {};
    const full_name = cleanName(asString(body.full_name));
    const barangay_id = asNumber(body.barangay_id);

    if (full_name.length < 2) errors.full_name = 'Enter your full name.';
    const phone = phoneProblem(body.contact_number);
    if (phone) errors.contact_number = phone;
    const email = emailProblem(body.email);
    if (email) errors.email = email;
    Object.assign(errors, confirmationProblem(body));
    if (!db().barangays.some((b) => b.id === barangay_id))
      errors.barangay_id = 'Choose your barangay.';
    if (Object.keys(errors).length > 0) return invalid(errors);

    // Customer and account together: in Phase 2, one DB transaction.
    const now = new Date().toISOString();
    const customer: Customer = {
      id: nextId(db().customers),
      full_name,
      contact_number: normalizePhone(asString(body.contact_number)),
      barangay_id: barangay_id ?? 0,
      street_address: asString(body.street_address) || null,
      notes: null,
      created_at: now,
      updated_at: now,
    };
    const account: CustomerAccount = {
      id: nextId(db().customer_accounts),
      customer_id: customer.id,
      email: normalizeEmail(asString(body.email)),
      is_active: true,
      must_change_password: false,
      last_login_at: now,
      created_at: now,
      updated_at: now,
    };
    db().customers.push(customer);
    db().customer_accounts.push(account);
    db().customer_credentials[account.id] = body.password as string;
    setCustomerSession(account.id);
    audit(null, 'customer.registered', 'customer', customer.id, { full_name });
    return ok({ customer: toCustomerSelfDto(customer) }, 201);
  }),

  publicRoute('post', '/customer/auth/login', ({ body }) => {
    const email = normalizeEmail(asString(body.email));
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return invalid({
        ...(email ? {} : { email: 'Enter your email.' }),
        ...(password ? {} : { password: 'Enter your password.' }),
      });
    }

    const key = throttleKey(email);
    if (recentFailures(key).length >= LOGIN_ATTEMPTS_PER_MINUTE) {
      return fail(429, 'Too many sign-in attempts. Please wait a minute and try again.');
    }

    const account = db().customer_accounts.find((a) => a.email === email);
    if (!account || db().customer_credentials[account.id] !== password) {
      loginAttempts.set(key, [...recentFailures(key), Date.now()]);
      return fail(422, 'These credentials do not match our records.', {
        email: ['These credentials do not match our records.'],
      });
    }
    if (!account.is_active) {
      return fail(422, 'This account is disabled. Please ask the shop.', {
        email: ['This account is disabled. Please ask the shop.'],
      });
    }

    loginAttempts.delete(key);
    account.last_login_at = new Date().toISOString();
    setCustomerSession(account.id);
    persist();
    const customer = db().customers.find((c) => c.id === account.customer_id) as Customer;
    return ok({ customer: toCustomerSelfDto(customer) });
  }),

  publicRoute('post', '/customer/auth/logout', () => {
    clearCustomerSession();
    return new Response(null, { status: 204 });
  }),

  publicRoute('get', '/customer/auth/me', () => {
    const signedIn = currentCustomer();
    return signedIn
      ? ok({ customer: toCustomerSelfDto(signedIn.customer) })
      : fail(401, 'Unauthenticated.');
  }),

  customerRoute('put', '/customer/account', ({ customer, body }) => {
    const errors: Record<string, string> = {};
    if ('contact_number' in body) {
      const phone = phoneProblem(body.contact_number, customer.id);
      if (phone) errors.contact_number = phone;
    }
    if ('barangay_id' in body && !db().barangays.some((b) => b.id === asNumber(body.barangay_id))) {
      errors.barangay_id = 'Choose your barangay.';
    }
    if (Object.keys(errors).length > 0) return invalid(errors);
    // Only these three fields: name, email, notes and everything else stay with the shop.
    if ('contact_number' in body)
      customer.contact_number = normalizePhone(asString(body.contact_number));
    if ('barangay_id' in body)
      customer.barangay_id = asNumber(body.barangay_id) ?? customer.barangay_id;
    if ('street_address' in body) customer.street_address = asString(body.street_address) || null;
    customer.updated_at = new Date().toISOString();
    persist();
    return ok({ customer: toCustomerSelfDto(customer) });
  }),

  customerRoute(
    'put',
    '/customer/account/password',
    ({ account, customer, body }) => {
      const current = typeof body.current_password === 'string' ? body.current_password : '';
      if (db().customer_credentials[account.id] !== current) {
        return invalid({ current_password: 'The current password is not correct.' });
      }
      const errors = confirmationProblem(body);
      if (!errors.password && body.password === current) {
        errors.password = 'Choose a password different from the current one.';
      }
      if (Object.keys(errors).length > 0) return invalid(errors);
      db().customer_credentials[account.id] = body.password as string;
      account.must_change_password = false;
      account.updated_at = new Date().toISOString();
      persist();
      return ok({ customer: toCustomerSelfDto(customer) });
    },
    { whilePasswordPending: true },
  ),

  customerRoute('get', '/customer/orders', ({ customer, query }) => {
    const filter = query.get('status');
    const own = db()
      .orders.filter((o) => o.customer_id === customer.id)
      .sort((a, b) => b.received_at.localeCompare(a.received_at));
    const active = own.filter((o) => isActiveStatus(statusCode(o.current_status_id)));
    const rows =
      filter === 'active'
        ? active
        : filter === 'completed'
          ? own.filter((o) => !isActiveStatus(statusCode(o.current_status_id)))
          : own;
    return ok(
      paginate(
        rows.map(toPortalOrderDto),
        query,
        { active: active.length, completed: own.length - active.length },
        10,
      ),
    );
  }),

  customerRoute('get', '/customer/orders/:orderNumber', ({ customer, params }) => {
    const order = ownOrder(customer.id, params.orderNumber);
    return order ? ok(toPortalOrderDetailDto(order)) : fail(404, 'Order not found.');
  }),

  customerRoute('get', '/customer/notifications', ({ customer, query }) => {
    const rows = db()
      .customer_notifications.filter((n) => n.customer_id === customer.id)
      .sort((a, b) => b.sent_at.localeCompare(a.sent_at) || b.id - a.id)
      .map((n) => ({
        ...n,
        order_number: db().orders.find((o) => o.id === n.order_id)?.order_number ?? '',
      }));
    return ok(paginate(rows, query, { unread: rows.filter((n) => !n.read_at).length }, 20));
  }),

  customerRoute('post', '/customer/notifications/:id/read', ({ customer, params }) => {
    const row = db().customer_notifications.find(
      (n) => n.id === Number(params.id) && n.customer_id === customer.id,
    );
    if (!row) return fail(404, 'Notification not found.');
    row.read_at = row.read_at ?? new Date().toISOString();
    persist();
    return ok(row);
  }),
];
