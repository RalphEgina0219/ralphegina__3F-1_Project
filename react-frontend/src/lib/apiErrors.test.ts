import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { newOrderField, stepOfField } from '@/features/orders/newOrderErrors';
import {
  applyFieldErrors,
  errorMessage,
  fieldError,
  OFFLINE_MESSAGE,
  safeNext,
  SERVER_ERROR_MESSAGE,
} from './api';
import { adaptError, fieldOf } from './apiAdapter';

/** An axios error carrying a Laravel answer in the course's error format, after the adapter. */
function failed(status: number, errors: { message: string; source?: string }[]) {
  const config = { headers: new AxiosHeaders() };
  const response = {
    status,
    statusText: '',
    headers: {},
    config,
    data: adaptError({ errors: errors.map((e) => ({ status, source: '', ...e })) }, status),
  } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, response);
}

describe('errors from the Laravel API, as the screens show them', () => {
  it('shows the 401, 403, 404 and 409 messages exactly as the API wrote them', () => {
    expect(errorMessage(failed(401, [{ message: 'Unauthenticated' }]))).toBe('Unauthenticated');
    expect(errorMessage(failed(403, [{ message: 'You are not authorized to view users.' }]))).toBe(
      'You are not authorized to view users.',
    );
    expect(errorMessage(failed(404, [{ message: 'The resource cannot be found.' }]))).toBe(
      'The resource cannot be found.',
    );
    for (const message of [
      'BSK-0007 is in use by LF-261110-0003.',
      'This basket has no active laundry session.',
      'This transaction is completed.',
      'Orders move one stage at a time. Next is Washing.',
      'Settle the balance before completing this order.',
    ]) {
      expect(errorMessage(failed(409, [{ message }]))).toBe(message);
    }
  });

  it("keeps a 429's own wording, and turns the framework's default into plain words", () => {
    expect(
      errorMessage(
        failed(429, [
          { message: 'Too many sign-in attempts. Please wait a minute and try again.' },
        ]),
      ),
    ).toBe('Too many sign-in attempts. Please wait a minute and try again.');
    expect(errorMessage(failed(429, [{ message: 'Too Many Attempts.' }]))).toBe(
      'Too many attempts. Please wait a minute and try again.',
    );
  });

  it('never shows what a 500 carried, whatever APP_DEBUG was', () => {
    const debug = failed(500, [
      {
        message: 'SQLSTATE[40001]: Serialization failure: 1213 Deadlock found',
        source: 'Line 864: C:\\laragon\\www\\vendor\\laravel\\framework\\src\\Connection.php',
      },
    ]);
    expect(errorMessage(debug)).toBe(SERVER_ERROR_MESSAGE);
    expect(errorMessage(failed(503, [{ message: 'Service Unavailable' }]))).toBe(
      SERVER_ERROR_MESSAGE,
    );
  });

  it('says the server cannot be reached when there is no answer at all', () => {
    const config = { headers: new AxiosHeaders() };
    expect(errorMessage(new AxiosError('Network Error', 'ERR_NETWORK', config))).toBe(
      OFFLINE_MESSAGE,
    );
  });

  it('puts every 422 message under its form field', () => {
    const error = failed(422, [
      { message: 'Enter the full name.', source: 'data.attributes.fullName' },
      { message: 'Choose your barangay.', source: 'data.relationships.barangay.data.id' },
      { message: 'Add at least one basket.', source: 'data.relationships.baskets.data' },
      { message: 'Enter a weight above zero.', source: 'data.attributes.items.0.weightKg' },
      { message: 'The passwords do not match.', source: 'password_confirmation' },
    ]);
    const set: Record<string, string | undefined> = {};
    expect(applyFieldErrors(error, (name, value) => (set[name] = value.message))).toBe(true);
    expect(set).toEqual({
      full_name: 'Enter the full name.',
      barangay_id: 'Choose your barangay.',
      basket_ids: 'Add at least one basket.',
      'items.0.weight_kg': 'Enter a weight above zero.',
      password_confirmation: 'The passwords do not match.',
    });
    expect(
      fieldError(failed(422, [{ message: 'Too long.', source: 'data.attributes.note' }]), [
        'reason',
        'note',
      ]),
    ).toBe('Too long.');
    // Not a 422: nothing goes onto the form, so the screen shows the message instead.
    expect(applyFieldErrors(failed(409, [{ message: 'x' }]), () => undefined)).toBe(false);
  });

  it('maps the order request onto the new-order form', () => {
    expect(fieldOf('data.relationships.customer.data.id')).toBe('customer_id');
    expect(newOrderField('items.1.weight_kg', 2)).toBe('items.1.amount');
    expect(newOrderField('items.0.quantity', 2)).toBe('items.0.amount');
    expect(newOrderField('items.0.service_id', 2)).toBe('items.0.service_id');
    expect(newOrderField('items.3.service_id', 2)).toBe('items');
    expect(newOrderField('payment.amount_cents', 1)).toBe('amount');
    expect(newOrderField('payment.reference_number', 1)).toBe('reference');
    expect(newOrderField('promised_at', 1)).toBe('promised_at');
    expect(newOrderField('something_else', 1)).toBeNull();
    expect(['customer_id', 'basket_ids', 'items.0.amount', 'amount'].map(stepOfField)).toEqual([
      1, 2, 3, 4,
    ]);
  });
});

describe('?next= after signing in', () => {
  it('keeps a path inside the app', () => {
    expect(safeNext('/orders/12?tab=payments')).toBe('/orders/12?tab=payments');
    expect(safeNext(null)).toBe('/');
  });

  it('refuses anything a browser would read as another site', () => {
    for (const next of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      '/\\/evil.example',
      '/\t/evil.example',
      '/\n/evil.example',
      'evil.example',
    ]) {
      expect(safeNext(next), JSON.stringify(next)).toBe('/');
    }
  });
});
