import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-line bg-surface', className)} {...props} />;
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Heading level for the document outline. */
  as?: 'h2' | 'h3';
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
  as: Heading = 'h2',
}: CardHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-2', className)}>
      <div className="min-w-0">
        <Heading className="text-[17px] font-bold">{title}</Heading>
        {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
