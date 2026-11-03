import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Primary actions pinned to the bottom of the screen below `lg`, above the iOS home indicator. */
export function StickyActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface lg:hidden print:hidden',
        className,
      )}
    >
      <div className="space-y-2 px-4 py-3">{children}</div>
    </div>
  );
}
