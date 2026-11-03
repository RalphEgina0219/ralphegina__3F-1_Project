import { cn } from '@/lib/cn';
import { formatMoney, formatPeso } from '@/lib/money';

interface MoneyProps {
  cents: number;
  className?: string;
  /** Round to the peso for KPI cards. */
  whole?: boolean;
  /** Warn color for any amount above zero. */
  warnIfDue?: boolean;
}

export function Money({ cents, className, whole, warnIfDue }: MoneyProps) {
  return (
    <span
      className={cn(
        'tabular whitespace-nowrap',
        warnIfDue && cents > 0 && 'font-bold text-warn',
        className,
      )}
    >
      {whole ? formatPeso(cents) : formatMoney(cents)}
    </span>
  );
}
