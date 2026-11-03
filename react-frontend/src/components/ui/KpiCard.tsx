import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'warn' | 'ok';
  className?: string;
}

export function KpiCard({ label, value, hint, tone = 'default', className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-card border p-4 md:p-5',
        tone === 'warn' ? 'border-warn-line bg-warn-bg' : 'border-line bg-surface',
        className,
      )}
    >
      <p className={cn('text-[13px] font-medium', tone === 'warn' ? 'text-warn' : 'text-muted')}>
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
    </div>
  );
}
