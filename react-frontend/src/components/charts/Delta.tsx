import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { previousLabel } from '@/lib/analytics/insights';
import { cn } from '@/lib/cn';

interface DeltaProps {
  pct: number | null;
  /** Days in the comparison period: "vs previous 30 days". */
  days: number;
  /** Up is bad: unpaid balances, waiting time. */
  inverse?: boolean;
  className?: string;
}

/**
 * "↗ +12.4% vs previous 30 days". The arrow and the sign carry the direction; colour only
 * reinforces it (good green, bad red), so it reads the same without colour.
 */
export function Delta({ pct, days, inverse = false, className }: DeltaProps) {
  if (pct === null) {
    return (
      <span className={cn('text-[13px] text-muted', className)}>No earlier data to compare</span>
    );
  }
  const flat = Math.abs(pct) < 0.05;
  const up = pct > 0;
  const good = flat ? null : up !== inverse;
  const Icon = flat ? ArrowRight : up ? ArrowUpRight : ArrowDownRight;
  const sign = flat ? '±' : up ? '+' : '−';
  const period = previousLabel(days).replace('the previous', 'previous');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[13px] font-semibold tabular',
        good === null ? 'text-muted' : good ? 'text-ok' : 'text-danger',
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>
        {sign}
        {Math.abs(pct).toFixed(1)}%<span className="font-normal text-muted"> vs {period}</span>
      </span>
    </span>
  );
}
