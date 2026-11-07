import { delay, http, HttpResponse, type HttpResponseResolver, type JsonBodyType } from 'msw';
import { manilaDay } from '@/lib/analytics/time';
import { API_URL } from '@/lib/api';
import { can, type Ability } from '@/lib/permissions';
import type { AuthUser } from '@/types/api';
import type { Customer, CustomerAccount } from '@/types/entities';
import { db, getCustomerSessionAccountId, getSessionUserId } from './db';
import { toAuthUser } from './queries';

const isTest = import.meta.env.MODE === 'test';

/** A short artificial wait so that loading states are visible in the demo. */
async function latency() {
  if (!isTest) await delay(300 + Math.floor(Math.random() * 300));
}

export function ok(body: unknown, status = 200) {
  return HttpResponse.json(body as JsonBodyType, { status });
}

export function fail(status: number, message: string, errors?: Record<string, string[]>) {
  return HttpResponse.json(errors ? { message, errors } : { message }, { status });
}

export function invalid(errors: Record<string, string>) {
  const entries = Object.entries(errors).map(([field, message]) => [field, [message]]);
  const first = entries[0]?.[1]?.[0] ?? 'The given data was invalid.';
  return fail(422, first, Object.fromEntries(entries));
}

export function currentUser(): AuthUser | null {
  const id = getSessionUserId();
  const user = id ? db().users.find((u) => u.id === id && u.is_active) : undefined;
  return user ? toAuthUser(user) : null;
}

export interface Ctx {
  user: AuthUser;
  params: Record<string, string>;
  query: URLSearchParams;
  body: Record<string, unknown>;
}

type Method = 'get' | 'post' | 'put';

/** The signed-in customer: an active account and its profile. Staff sessions never count. */
export function currentCustomer(): { account: CustomerAccount; customer: Customer } | null {
  const id = getCustomerSessionAccountId();
  const account = id ? db().customer_accounts.find((a) => a.id === id && a.is_active) : undefined;
  const customer = account && db().customers.find((c) => c.id === account.customer_id);
  return account && customer ? { account, customer } : null;
}

export interface CustomerCtx extends Omit<Ctx, 'user'> {
  account: CustomerAccount;
  customer: Customer;
}
type Handler = (ctx: Ctx) => Response | Promise<Response>;

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.method === 'GET') return {};
  try {
    const parsed: unknown = await request.clone().json();
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const path = (route: string) => `*${API_URL}${route}`;

/** A route behind the session. A missing session is 401, a missing ability is 403. */
export function route(
  method: Method,
  url: string,
  ability: Ability | Ability[] | null,
  handler: Handler,
) {
  const resolver: HttpResponseResolver = async ({ request, params }) => {
    await latency();
    const user = currentUser();
    if (!user) return fail(401, 'Unauthenticated.');
    const required = Array.isArray(ability) ? ability : ability ? [ability] : [];
    if (required.length > 0 && !required.some((a) => can(user, a))) {
      return fail(403, 'You do not have permission to do that.');
    }
    return handler({
      user,
      params: params as Record<string, string>,
      query: new URL(request.url).searchParams,
      body: await readBody(request),
    });
  };
  return http[method](path(url), resolver);
}

/**
 * A route behind the customer guard. A staff session is not enough: it answers 401 here, just as a
 * customer session answers 401 on every staff route. Until a temporary password is changed, only
 * the routes marked `whilePasswordPending` answer.
 */
export function customerRoute(
  method: Method,
  url: string,
  handler: (ctx: CustomerCtx) => Response | Promise<Response>,
  { whilePasswordPending = false }: { whilePasswordPending?: boolean } = {},
) {
  const resolver: HttpResponseResolver = async ({ request, params }) => {
    await latency();
    const signedIn = currentCustomer();
    if (!signedIn) return fail(401, 'Unauthenticated.');
    if (signedIn.account.must_change_password && !whilePasswordPending) {
      return fail(403, 'Change your temporary password first.');
    }
    return handler({
      ...signedIn,
      params: params as Record<string, string>,
      query: new URL(request.url).searchParams,
      body: await readBody(request),
    });
  };
  return http[method](path(url), resolver);
}

/** Any API path no handler claims, such as the removed receipt and public tracking endpoints. */
export const notFoundHandler = http.all(path('/*'), () => fail(404, 'Not found.'));

/** A route with no session: only the sign-in and registration endpoints use this. */
export function publicRoute(
  method: Method,
  url: string,
  handler: (ctx: Omit<Ctx, 'user'>) => Response | Promise<Response>,
) {
  const resolver: HttpResponseResolver = async ({ request, params }) => {
    await latency();
    return handler({
      params: params as Record<string, string>,
      query: new URL(request.url).searchParams,
      body: await readBody(request),
    });
  };
  return http[method](path(url), resolver);
}

export function paginate<T, M extends object>(
  rows: readonly T[],
  query: URLSearchParams,
  extra?: M,
  defaultPerPage = 15,
) {
  const perPage = Math.min(Math.max(1, Number(query.get('per_page')) || defaultPerPage), 500);
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, Number(query.get('page')) || 1), lastPage);
  return {
    data: rows.slice((page - 1) * perPage, page * perPage),
    meta: { current_page: page, per_page: perPage, total, last_page: lastPage, ...extra },
  };
}

/** Matches an ISO timestamp against yyyy-MM-dd bounds, by its calendar day in Manila. */
export function inRange(iso: string, from: string | null, to: string | null) {
  const day = manilaDay(iso);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
export const asNumber = (value: unknown) => {
  const number = typeof value === 'string' && value !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
};
