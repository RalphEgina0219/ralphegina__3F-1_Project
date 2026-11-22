import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/** Order numbers, receipt numbers and references. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono font-medium', className)}>{children}</span>;
}

export function OrderLink({
  id,
  number,
  className,
}: {
  id: number;
  number: string;
  className?: string;
}) {
  return (
    <Link
      to={`/orders/${id}`}
      className={cn(
        'inline-flex min-h-11 items-center font-mono font-medium whitespace-nowrap text-flow-text underline underline-offset-2 hover:text-flow-hover',
        className,
      )}
    >
      {number}
    </Link>
  );
}
