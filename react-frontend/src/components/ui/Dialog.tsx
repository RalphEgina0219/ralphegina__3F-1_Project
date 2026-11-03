import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Radix only returns focus to its own Trigger component. These dialogs are controlled from
 * ordinary buttons, so remember what had focus on open and go back to it on close.
 */
function useRestoreFocus() {
  const previous = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: () => {
      previous.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      previous.current?.focus();
    },
  };
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Sticky action row at the bottom of the dialog. */
  footer?: ReactNode;
  className?: string;
}

/** A centered dialog from md up and a bottom sheet on phones. Radix traps and restores focus. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const restoreFocus = useRestoreFocus();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-scrim data-[state=open]:animate-fade-in" />
        <RadixDialog.Content
          {...restoreFocus}
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed z-50 flex max-h-[92dvh] flex-col bg-surface focus:outline-none',
            'inset-x-0 bottom-0 rounded-t-sheet data-[state=open]:animate-sheet-up',
            'md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[85dvh] md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card md:data-[state=open]:animate-fade-in',
            className,
          )}
        >
          <div
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong md:hidden"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3 md:pt-5">
            <div className="min-w-0">
              <RadixDialog.Title className="text-[17px] font-bold text-text">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-0.5 text-[13px] text-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              aria-label="Close"
              className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-foam"
            >
              <X className="size-5" aria-hidden="true" />
            </RadixDialog.Close>
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>}
          {footer && (
            <div className="pb-safe shrink-0 border-t border-line">
              <div className="flex flex-col-reverse gap-2 px-5 py-3 sm:flex-row sm:justify-end">
                {footer}
              </div>
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Controlled side drawer. Traps focus, closes on Esc. */
export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const restoreFocus = useRestoreFocus();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-scrim data-[state=open]:animate-fade-in" />
        <RadixDialog.Content
          {...restoreFocus}
          aria-describedby={undefined}
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-70 max-w-[85vw] focus:outline-none data-[state=open]:animate-drawer-in',
            className,
          )}
        >
          <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
