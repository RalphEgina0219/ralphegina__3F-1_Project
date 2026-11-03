import { AlertTriangle, RotateCw, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      {Icon && (
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-flow-soft text-flow">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <p className="text-[15px] font-bold text-text">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  error,
  title = 'This could not be loaded',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center px-6 py-10 text-center', className)}
    >
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-danger-bg text-danger">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <p className="text-[15px] font-bold text-text">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{errorMessage(error)}</p>
      {onRetry && (
        <Button
          variant="secondary"
          className="mt-4"
          icon={<RotateCw className="size-4" aria-hidden="true" />}
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('animate-pulse rounded-control bg-foam-2', className)} />
  );
}

/** Announces loading to screen readers while the shapes show on screen. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn('space-y-3 p-4', className)}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn('grid gap-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-24 rounded-card" />
      ))}
    </div>
  );
}
