import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiErrorBody } from '@/types/api';
import {
  adaptError,
  adaptParams,
  adaptResponse,
  isFlatBodyPath,
  methodFor,
  toResourceBody,
} from './apiAdapter';
import { clearToken, getToken, setToken, type TokenKind } from './tokens';

/** The mock API (demo build, tests) speaks the screens' contract; the Laravel API needs the adapter. */
export const USING_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/** The versioned Laravel API (course L7). The mock answers at the same base. */
export const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

let onUnauthorized: (() => void) | null = null;
let onCustomerUnauthorized: (() => void) | null = null;
let onPasswordPending: ((kind: TokenKind) => void) | null = null;

/** The 403 both APIs send while a reset password has not been replaced yet. */
export const PASSWORD_PENDING_MESSAGE = 'Change your temporary password first.';

/**
 * A password reset while someone is signed in: their next request answers 403, and the app
 * re-reads the account so the guard can open the change-password page.
 */
export function setPasswordPendingHandler(handler: (kind: TokenKind) => void) {
  onPasswordPending = handler;
}

/** The app registers how to leave for /login; the auth endpoints handle their own 401s. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/** The customer portal's own session: a 401 there leads to /my/login, never to the staff login. */
export function setCustomerUnauthorizedHandler(handler: () => void) {
  onCustomerUnauthorized = handler;
}

const tokenKindOf = (url: string): TokenKind =>
  url.startsWith('/customer/') ? 'customer' : 'staff';
const isAuthPath = (url: string) => /^\/(customer\/)?auth\//.test(url);

if (!USING_MOCKS) {
  // Every request: the Bearer token of its guard, the course's body, parameters and methods.
  api.interceptors.request.use((config: InternalAxiosRequestConfig & { _adapted?: boolean }) => {
    const url = config.url ?? '';
    const token = getToken(tokenKindOf(url));
    if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
    // A retry after a token refresh is already in the course's shape.
    if (config._adapted) return config;
    config._adapted = true;
    config.method = methodFor((config.method ?? 'get').toLowerCase(), url);
    if (config.data !== undefined && !isFlatBodyPath(url))
      config.data = toResourceBody(config.data);
    config.params = adaptParams(url, config.params);
    return config;
  });

  api.interceptors.response.use(
    (response: AxiosResponse) => {
      response.data = adaptResponse(response.data);
      return response;
    },
    (error: AxiosError) => {
      if (error.response) {
        error.response.data = adaptError(error.response.data, error.response.status);
      }
      return Promise.reject(error);
    },
  );
}

/** One refresh at a time per guard, shared by every request that hit the expired token. */
const refreshing: Partial<Record<TokenKind, Promise<string | null>>> = {};

async function refreshToken(kind: TokenKind): Promise<string | null> {
  const current = getToken(kind);
  if (!current) return null;
  refreshing[kind] ??= axios
    .post<{ data?: { access_token?: string } }>(
      `${API_URL}${kind === 'customer' ? '/customer' : ''}/auth/refresh`,
      null,
      { headers: { Accept: 'application/json', Authorization: `Bearer ${current}` } },
    )
    .then(({ data }) => {
      const token = data.data?.access_token ?? null;
      setToken(kind, token);
      return token;
    })
    .catch(() => {
      clearToken(kind);
      return null;
    })
    .finally(() => {
      delete refreshing[kind];
    });
  return refreshing[kind];
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
  const url = config?.url ?? '';
  if (
    error.response?.status === 403 &&
    (error.response.data as Partial<ApiErrorBody> | undefined)?.message === PASSWORD_PENDING_MESSAGE
  ) {
    onPasswordPending?.(tokenKindOf(url));
    return Promise.reject(error);
  }
  if (error.response?.status !== 401 || isAuthPath(url)) return Promise.reject(error);

  const kind = tokenKindOf(url);

  // An expired token: exchange it once, then repeat the request with the new one.
  if (!USING_MOCKS && config && !config._retried) {
    const token = await refreshToken(kind);
    if (token) {
      config._retried = true;
      config.headers.Authorization = `Bearer ${token}`;
      return api.request(config);
    }
  }

  if (!USING_MOCKS) clearToken(kind);
  if (kind === 'customer') onCustomerUnauthorized?.();
  else onUnauthorized?.();
  return Promise.reject(error);
});

export function errorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export const SERVER_ERROR_MESSAGE =
  'Something went wrong on our side. Please try again in a moment.';
export const RATE_LIMIT_MESSAGE = 'Too many attempts. Please wait a minute and try again.';
export const OFFLINE_MESSAGE = 'Cannot reach the server. Check the connection and try again.';

/**
 * The text a screen shows for a failed request:
 * - 4xx: the API's own message, word for word (the 409s name the basket, the order, the stage);
 * - 429: the API's message when it wrote one, otherwise a plain "wait a minute";
 * - 5xx: always the same friendly sentence. Whatever the server sent (with APP_DEBUG on, the
 *   exception text) never reaches the screen.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return OFFLINE_MESSAGE;
    const { status } = error.response;
    if (status >= 500) return SERVER_ERROR_MESSAGE;
    const message = error.response.data?.message;
    if (status === 429 && (!message || /^too many (attempts|requests)\.?$/i.test(message))) {
      return RATE_LIMIT_MESSAGE;
    }
    return message || fallback;
  }
  return fallback;
}

/** The first 422 message for one of these fields, for inputs outside react-hook-form. */
export function fieldError(error: unknown, fields: readonly string[]): string | undefined {
  if (!axios.isAxiosError<ApiErrorBody>(error) || error.response?.status !== 422) return undefined;
  const errors = error.response.data?.errors ?? {};
  for (const field of fields) {
    const message = errors[field]?.[0];
    if (message) return message;
  }
  return undefined;
}

/**
 * Puts Laravel-style 422 field errors onto the form. Returns true when any were applied.
 * `rename` maps an API field to the form's own name (or null to skip it), for forms whose fields
 * differ from the request body, such as the new-order form's `amount` for `payment.amount_cents`.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  rename: (field: string) => string | null = (field) => field,
) {
  if (!axios.isAxiosError<ApiErrorBody>(error) || error.response?.status !== 422) return false;
  const errors = error.response.data?.errors ?? {};
  let applied = 0;
  for (const [field, messages] of Object.entries(errors)) {
    const name = rename(field);
    if (!name || !messages[0]) continue;
    setError(name as Path<T>, { type: 'server', message: messages[0] });
    applied += 1;
  }
  return applied > 0;
}

/** Drops empty filters so query strings stay clean. */
export function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  ) as Partial<T>;
}

/**
 * Only same-site paths are accepted, so that ?next= can never send anyone off the app.
 * Browsers read a backslash like a slash ("/\evil.example" is "//evil.example"), and tabs or
 * newlines are dropped from URLs, so any of those makes the value unsafe (GHSA-wrjc-x8rr-h8h6).
 */
export function safeNext(next: string | null, fallback = '/') {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}
