import * as Popover from '@radix-ui/react-popover';
import { Bell, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { formatRelativeDay } from '@/lib/dates';

export interface NotificationItem {
  id: number;
  message: string;
  sent_at: string;
  read_at: string | null;
  icon: LucideIcon;
  /** Icon color class. */
  tone: string;
}

interface NotificationPopoverProps {
  variant: 'sidebar' | 'topbar';
  items: readonly NotificationItem[] | undefined;
  unread: number;
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
  onSelect: (item: NotificationItem) => void;
  emptyDescription: string;
}

/** The bell and its list. Staff and customers each feed it their own notifications. */
export function NotificationPopover({
  variant,
  items,
  unread,
  isPending,
  error,
  onRetry,
  onSelect,
  emptyDescription,
}: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);
  const label = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={label}
        className={cn(
          'relative flex items-center rounded-control',
          variant === 'topbar'
            ? 'size-11 justify-center hover:bg-ink-3'
            : 'min-h-11 w-full gap-3 px-3 text-sm font-medium text-on-ink-muted hover:bg-ink-3 hover:text-on-ink',
        )}
      >
        <span className="relative">
          <Bell className={variant === 'topbar' ? 'size-6' : 'size-4.5'} aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-warn-bar ring-2 ring-ink" />
          )}
        </span>
        {variant === 'sidebar' && (
          <>
            <span className="flex-1 text-left">Notifications</span>
            {unread > 0 && (
              <span
                className="rounded-full bg-warn-bar px-1.5 text-xs font-bold text-ink"
                aria-hidden="true"
              >
                {unread}
              </span>
            )}
          </>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          side={variant === 'sidebar' ? 'right' : 'bottom'}
          sideOffset={8}
          collisionPadding={8}
          className="z-50 flex max-h-[70dvh] w-[min(360px,calc(100vw-16px))] flex-col rounded-card border border-line bg-surface shadow-lg data-[state=open]:animate-pop-in"
        >
          <p className="border-b border-line px-4 py-3 text-[15px] font-bold">Notifications</p>
          <div className="min-h-0 overflow-y-auto">
            {isPending && <SkeletonRows rows={3} />}
            {Boolean(error) && <ErrorState error={error} onRetry={onRetry} />}
            {items?.length === 0 && (
              <EmptyState icon={Bell} title="Nothing new" description={emptyDescription} />
            )}
            <ul className="divide-y divide-line">
              {items?.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        'flex min-h-11 w-full gap-3 px-4 py-3 text-left hover:bg-foam',
                        !item.read_at && 'bg-flow-soft',
                      )}
                      onClick={() => {
                        setOpen(false);
                        onSelect(item);
                      }}
                    >
                      <Icon
                        className={cn('mt-0.5 size-4.5 shrink-0', item.tone)}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className={cn('block text-sm', !item.read_at && 'font-semibold')}>
                          {item.message}
                        </span>
                        <span className="block text-xs text-muted">
                          {formatRelativeDay(item.sent_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
