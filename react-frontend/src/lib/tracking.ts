/** The URL a QR code encodes. It carries only the random token, never any customer data. */
export function trackingUrl(token: string): string {
  const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/track/${token}`;
}

export type ScannedCode = { token: string } | { order_number: string } | null;

/**
 * Reads what a camera or a keyboard produced: a tracking URL, a bare token or an order number.
 * Only the token is taken from a URL, so a QR from elsewhere can never navigate the app anywhere.
 */
export function parseScannedCode(raw: string): ScannedCode {
  const text = raw.trim();
  if (!text) return null;
  if (/^LF-\d{6}-\d{4}$/i.test(text)) return { order_number: text.toUpperCase() };
  const fromUrl = text.match(/\/track\/([A-Za-z0-9_-]{32})(?:[/?#]|$)/);
  if (fromUrl?.[1]) return { token: fromUrl[1] };
  if (/^[A-Za-z0-9_-]{32}$/.test(text)) return { token: text };
  return null;
}
