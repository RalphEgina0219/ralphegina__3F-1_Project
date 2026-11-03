import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { STOCK_META, type StockStatus } from '@/lib/inventory';
import { STATUS_META } from '@/lib/status';
import type { PaymentStatus, StatusCode } from '@/types/entities';

const chipBase =
  'inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'flow' | 'ink';
}

const TONES: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-foam-2 text-text',
  ok: 'bg-ok-bg text-ok',
  warn: 'border border-warn-line bg-warn-bg text-warn',
  danger: 'bg-danger-bg text-danger',
  flow: 'bg-flow-soft text-flow-hover',
  ink: 'bg-ink text-on-ink',
};

export function Badge({ children, className, tone = 'neutral' }: BadgeProps) {
  return <span className={cn(chipBase, TONES[tone], className)}>{children}</span>;
}

interface StatusChipProps {
  status: StatusCode;
  className?: string;
  /** Show "Ready" rather than "Ready for Pickup" where space is tight. */
  short?: boolean;
  dot?: boolean;
  suffix?: ReactNode;
}

export function StatusChip({ status, className, short, dot, suffix }: StatusChipProps) {
  const meta = STATUS_META[status];
  return (
    <span className={cn(chipBase, meta.chip, className)}>
      {dot && <span className={cn('size-2 rounded-full', meta.dot)} aria-hidden="true" />}
      {short ? meta.shortLabel : meta.label}
      {suffix}
    </span>
  );
}

const PAYMENT_META: Record<PaymentStatus, { label: string; tone: BadgeProps['tone'] }> = {
  paid: { label: 'Paid', tone: 'ok' },
  partial: { label: 'Partial', tone: 'warn' },
  unpaid: { label: 'Unpaid', tone: 'danger' },
};

export function PaymentChip({
  status,
  suffix,
  className,
}: {
  status: PaymentStatus;
  suffix?: ReactNode;
  className?: string;
}) {
  const meta = PAYMENT_META[status];
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
      {suffix}
    </Badge>
  );
}

export function StockChip({ status }: { status: StockStatus }) {
  const meta = STOCK_META[status];
  return <span className={cn(chipBase, meta.chip)}>{meta.label}</span>;
}
