import type { ValueFormat } from '@/lib/analytics/types';
import { formatPeso, formatPesoCompact } from '@/lib/money';

const integer = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 1 });

/** A value for tables, tooltips and KPI cards: ₱48,250 · 1,234 · 6.5 kg · 22.4 hr · 61%. */
export function formatValue(value: number | null | undefined, format: ValueFormat): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  switch (format) {
    case 'money':
      return formatPeso(value);
    case 'count':
      return integer.format(value);
    case 'kg':
      return `${oneDecimal.format(value)} kg`;
    case 'hours':
      return `${oneDecimal.format(value)} hr`;
    case 'percent':
      return `${oneDecimal.format(value)}%`;
    case 'number':
      return oneDecimal.format(value);
  }
}

/** Axis ticks: compact pesos (₱48.3k), whole counts, short units. */
export function formatAxis(value: number, format: ValueFormat): string {
  switch (format) {
    case 'money':
      return formatPesoCompact(value);
    case 'kg':
      return `${oneDecimal.format(value)}`;
    case 'hours':
      return `${integer.format(value)} h`;
    case 'percent':
      return `${integer.format(value)}%`;
    case 'number':
      return oneDecimal.format(value);
    default:
      return value >= 1000 ? `${oneDecimal.format(value / 1000)}k` : integer.format(value);
  }
}

/** Plain numbers for CSV: pesos with two decimals, never a currency sign. */
export function csvValue(value: number | null | undefined, format: ValueFormat): string | number {
  if (value === null || value === undefined) return '';
  return format === 'money' ? (value / 100).toFixed(2) : value;
}

export const shareLabel = (share: number) => `${Math.round(share * 100)}%`;

/** Column heading in a CSV export, with the unit: "Sales (PHP)". */
export function csvHeader(label: string, format: ValueFormat): string {
  if (format === 'money') return `${label} (PHP)`;
  if (format === 'kg') return `${label} (kg)`;
  if (format === 'hours') return `${label} (hours)`;
  if (format === 'percent') return `${label} (%)`;
  return label;
}
