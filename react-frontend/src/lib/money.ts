const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const wholePeso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

/** 123450 -> ₱1,234.50 */
export function formatMoney(cents: number): string {
  return money.format(cents / 100);
}

/** 486000 -> ₱4,860, for KPI cards and chart labels. Rounded to the peso. */
export function formatPeso(cents: number): string {
  return wholePeso.format(Math.round(cents / 100));
}

/** Rate labels drop empty centavos: 3500 -> ₱35, 3550 -> ₱35.50. */
export function formatRate(cents: number): string {
  return cents % 100 === 0 ? formatPeso(cents) : formatMoney(cents);
}

/** "1,234.50" or "₱1234.5" -> 123450. Returns null for anything that is not a peso amount. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[₱,\s]/g, '');
  if (!/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === '' || cleaned === '.') return null;
  const [pesos = '0', centavos = ''] = cleaned.split('.');
  return Number(pesos || '0') * 100 + Number(centavos.padEnd(2, '0') || '0');
}

/** 123450 -> "1234.50", the plain value used inside amount inputs. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

const compactNumber = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(Math.round(value));
};

/** Chart axes and tight labels: 4825000 -> ₱48.3k, 95000 -> ₱950, 125000000 -> ₱1.3M. */
export function formatPesoCompact(cents: number): string {
  return `₱${compactNumber(Math.round(cents / 100))}`;
}
