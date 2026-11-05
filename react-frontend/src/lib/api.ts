import axios, { AxiosError } from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiErrorBody } from '@/types/api';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

let onUnauthorized: (() => void) | null = null;
let onCustomerUnauthorized: (() => void) | null = null;

/** The app registers how to leave for /login; the auth endpoints handle their own 401s. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/** The customer portal's own session: a 401 there leads to /my/login, never to the staff login. */
export function setCustomerUnauthorizedHandler(handler: () => void) {
  onCustomerUnauthorized = handler;
}

api.interceptors.response.use(undefined, (error: AxiosError) => {
  const url = error.config?.url ?? '';
  if (error.response?.status === 401) {
    if (url.startsWith('/customer/')) {
      if (!url.startsWith('/customer/auth/')) onCustomerUnauthorized?.();
    } else if (!url.startsWith('/auth/')) {
      onUnauthorized?.();
    }
  }
  return Promise.reject(error);
});

export function errorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Cannot reach the server. Check the connection and try again.';
    return error.response.data?.message || fallback;
  }
  return fallback;
}

/** Puts Laravel-style 422 field errors onto the form. Returns true when any were applied. */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  if (!axios.isAxiosError<ApiErrorBody>(error) || error.response?.status !== 422) return false;
  const errors = error.response.data?.errors ?? {};
  const entries = Object.entries(errors);
  for (const [field, messages] of entries) {
    setError(field as Path<T>, { type: 'server', message: messages[0] });
  }
  return entries.length > 0;
}

/** Drops empty filters so query strings stay clean. */
export function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  ) as Partial<T>;
}

/** Only same-site paths are accepted, so that ?next= can never send anyone off the app. */
export function safeNext(next: string | null, fallback = '/') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
