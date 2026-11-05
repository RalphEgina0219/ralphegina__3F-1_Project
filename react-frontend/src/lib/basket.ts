/**
 * Basket QR codes are the only QR codes in the system. A label is permanent: it encodes the URL
 * below with a random token that carries no order or customer data, and is never regenerated.
 */

const TOKEN = /^[A-Za-z0-9_-]{32}$/;
const ORDER_NUMBER = /^LF-\d{6}-\d{4}$/i;
const BASKET_NUMBER = /^BSK-?(\d{1,6})$/i;

/** BSK-0001, BSK-0002, ... Numbers are never reused, even after a basket is retired. */
export function formatBasketNumber(sequence: number): string {
  return `BSK-${String(sequence).padStart(4, '0')}`;
}

export function basketSequence(basketNumber: string): number {
  return Number(basketNumber.replace(/^BSK-/i, '')) || 0;
}

/** The URL printed on the label. A phone camera opens it; only signed-in staff see anything. */
export function basketUrl(token: string): string {
  const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/b/${token}`;
}

export type ScanInput =
  | { kind: 'token'; value: string }
  | { kind: 'basket_number'; value: string }
  | { kind: 'order_number'; value: string };

/**
 * Reads what a camera or keyboard produced: a basket label URL, a bare token, a basket number or
 * an order number. Only the token is taken from a URL, so a QR from elsewhere goes nowhere.
 */
export function parseScanInput(raw: string): ScanInput | null {
  const text = raw.trim();
  if (!text) return null;
  if (ORDER_NUMBER.test(text)) return { kind: 'order_number', value: text.toUpperCase() };
  const basket = text.match(BASKET_NUMBER);
  if (basket?.[1]) return { kind: 'basket_number', value: formatBasketNumber(Number(basket[1])) };
  const fromUrl = text.match(/\/b\/([A-Za-z0-9_-]{32})(?:[/?#]|$)/);
  if (fromUrl?.[1]) return { kind: 'token', value: fromUrl[1] };
  if (TOKEN.test(text)) return { kind: 'token', value: text };
  return null;
}
