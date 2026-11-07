import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'warn' | 'ok';
  /** A small icon before the label. */
  icon?: ReactNode;
  /** Extra content under the hint: a change vs last period, a sparkline, a progress bar. */
  children?: ReactNode;
  className?: string;
}

export function KpiCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
  children,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-card border p-4 md:p-5',
        tone === 'warn' ? 'border-warn-line bg-warn-bg' : 'border-line bg-surface',
        className,
      )}
    >
      <p
        className={cn(
          'flex items-center gap-1.5 text-[13px] font-medium',
          tone === 'warn' ? 'text-warn' : 'text-muted',
        )}
      >
        {icon}
        {label}
      </p>
      <div
        className={cn(
          'mt-1 truncate text-[26px] leading-tight font-extrabold tracking-[-0.02em] md:text-[28px]',
          tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : 'text-text',
        )}
      >
        {value}
      </div>
      {hint && (
        <div className={cn('mt-1 text-[13px]', tone === 'warn' ? 'text-warn' : 'text-muted')}>
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}
