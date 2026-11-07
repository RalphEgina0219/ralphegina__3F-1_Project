import * as Tooltip from '@radix-ui/react-tooltip';
import type { MouseEvent, ReactElement } from 'react';
import { toast } from 'sonner';

export const OFFLINE_ACTION_MESSAGE = "You're offline. This can't be saved until you reconnect.";

/**
 * A blocked action stays focusable (aria-disabled, not disabled) so its tooltip can explain why.
 * A tap on a phone, which has no hover, gets the same words as a toast.
 */
export function blockOfflineClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  toast.info(OFFLINE_ACTION_MESSAGE, { id: 'offline-action' });
}

/** Wraps an action that needs the server with the offline explanation, only while `blocked`. */
export function OfflineHint({ blocked, children }: { blocked: boolean; children: ReactElement }) {
  if (!blocked) return children;
  return (
    // Its own provider, so a button also explains itself outside the app's providers (tests, toasts).
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            className="z-50 max-w-64 rounded-control bg-ink px-3 py-2 text-[13px] font-medium text-on-ink shadow-md"
          >
            {OFFLINE_ACTION_MESSAGE}
            <Tooltip.Arrow className="fill-ink" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
