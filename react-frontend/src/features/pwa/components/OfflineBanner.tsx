import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { WifiOff } from 'lucide-react';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/cn';

/** The oldest data on screen: every active query that has loaded at least once. */
function useOldestShownData(): number {
  const cache = useQueryClient().getQueryCache();
  return useSyncExternalStore(
    (notify) => cache.subscribe(notify),
    () => {
      let oldest = 0;
      for (const query of cache.findAll({ type: 'active' })) {
        const at = query.state.dataUpdatedAt;
        if (at > 0 && (oldest === 0 || at < oldest)) oldest = at;
      }
      return oldest;
    },
  );
}

function OfflineNotice() {
  const shownSince = useOldestShownData();
  return (
    // Phones: a strip above the top bar. From md up, a pill floating at the bottom instead: a strip
    // would cover the fixed staff sidebar's logo (lg and up) and push every page down.
    <div
      role="status"
      className={cn(
        'pt-safe relative z-40 bg-ink-deep text-on-ink print:hidden',
        'md:fixed md:bottom-4 md:left-1/2 md:z-50 md:w-max md:max-w-[calc(100vw-2rem)] md:-translate-x-1/2 md:rounded-full md:pt-0 md:shadow-lg',
        // Beside the fixed sidebar (lg and up), the corner keeps it clear of the account card.
        'lg:right-4 lg:left-auto lg:translate-x-0',
      )}
      data-testid="offline-banner"
    >
      <p className="mx-auto flex max-w-375 flex-wrap items-center gap-x-2 gap-y-0.5 px-4 py-2 text-[13px] leading-snug md:px-5">
        <WifiOff className="size-4 shrink-0 text-aqua" aria-hidden="true" />
        <span className="font-semibold">
          You&apos;re offline. Changes can&apos;t be saved until you reconnect.
        </span>
        {shownSince > 0 && (
          <span className="text-on-ink-muted">Last updated {format(shownSince, 'h:mm a')}</span>
        )}
      </p>
    </div>
  );
}

/**
 * The slim offline notice on every screen. Data already loaded stays visible. When the
 * connection returns, everything on screen refetches and a toast says so.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const wasOnline = useRef(online);

  useEffect(() => {
    if (online && !wasOnline.current) {
      toast.success('Back online', { id: 'connection' });
      // Queries in flight keep going; the rest of the screen refetches now.
      void queryClient.invalidateQueries({ refetchType: 'active' }, { cancelRefetch: false });
    }
    wasOnline.current = online;
  }, [online, queryClient]);

  return online ? null : <OfflineNotice />;
}
