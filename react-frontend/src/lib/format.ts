import type { OrderItemDto } from '@/types/api';

/** "09178452210" -> "0917 845 2210" */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11
    ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    : value;
}

export function formatKg(weight: number): string {
  return `${weight.toFixed(1)} kg`;
}

/** Plural-aware "6 pcs" or "1 pc". */
export function formatPieces(quantity: number): string {
  return `${quantity} ${quantity === 1 ? 'pc' : 'pcs'}`;
}

/** The order's load across all lines, for example "6.5 kg · 6 pcs". Flat add-ons add no load. */
export function loadSummary(items: readonly OrderItemDto[]): string {
  const kilos = items.reduce((sum, item) => sum + (item.weight_kg ?? 0), 0);
  const pieces = items
    .filter((item) => item.pricing_type === 'per_piece')
    .reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const parts = [kilos > 0 && formatKg(kilos), pieces > 0 && formatPieces(pieces)].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

/** "Wash-Dry-Fold", or "WDF + Ironing" when several services share the space. */
export function servicesSummary(items: readonly OrderItemDto[]): string {
  const names = items.map((item) => item.service_name);
  if (names.length <= 1) return names[0] ?? '—';
  return names
    .map((name) =>
      name
        .replace('Wash-Dry-Fold', 'WDF')
        .replace(' (same day)', '')
        .replace('Comforter / Blanket', 'Comforter'),
    )
    .join(' + ');
}

export function itemQuantityLabel(item: OrderItemDto): string {
  if (item.pricing_type === 'per_kg') return formatKg(item.weight_kg ?? 0);
  if (item.pricing_type === 'per_piece') return formatPieces(item.quantity ?? 0);
  return '1 order';
}

export function itemRateSuffix(item: { pricing_type: OrderItemDto['pricing_type'] }): string {
  if (item.pricing_type === 'per_kg') return ' / kg';
  return item.pricing_type === 'per_piece' ? ' / pc' : '';
}

/** Shows an order token without revealing it: ••••q9Zx */
export function maskToken(token: string): string {
  return `••••${token.slice(-4)}`;
}
