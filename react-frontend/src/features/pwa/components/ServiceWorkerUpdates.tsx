import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { hasUnsavedChanges } from '@/lib/unsaved';

const HOUR = 60 * 60 * 1000;

/**
 * Registers the Workbox worker (real-API builds only: main.tsx never mounts this with mocks on)
 * and offers new versions. Nothing reloads by itself: the person chooses Reload or Later, and
 * Reload asks first when a form on screen has unsaved changes.
 */
export default function ServiceWorkerUpdates() {
  const [confirming, setConfirming] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (registration.installing || !navigator.onLine) return;
        registration.update().catch(() => {
          // Offline or the server is down: the next check tries again.
        });
      };
      window.setInterval(check, HOUR);
      window.addEventListener('focus', check);
    },
  });

  const apply = useCallback(() => void updateServiceWorker(true), [updateServiceWorker]);
  const shown = useRef<string | number | null>(null);

  const offer = useCallback(() => {
    // A fresh toast each time: reusing the id of one that is still animating out drops the new one.
    if (shown.current !== null) toast.dismiss(shown.current);
    shown.current = toast('A new version of LaundryFlow is available', {
      duration: Infinity,
      closeButton: false,
      action: {
        label: 'Reload',
        onClick: () => (hasUnsavedChanges() ? setConfirming(true) : apply()),
      },
      cancel: { label: 'Later', onClick: () => setNeedRefresh(false) },
    });
  }, [apply, setNeedRefresh]);

  useEffect(() => {
    if (needRefresh) offer();
  }, [needRefresh, offer]);

  return (
    <ConfirmDialog
      open={confirming}
      onOpenChange={(open) => {
        setConfirming(open);
        // Kept the work: offer the update again for later.
        if (!open) offer();
      }}
      title="Reload with unsaved changes?"
      description="A form on this screen has changes that are not saved yet. Reloading now loses them. Save first, or reload anyway."
      confirmLabel="Reload anyway"
      variant="danger"
      onConfirm={apply}
    />
  );
}
