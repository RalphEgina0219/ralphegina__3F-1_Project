import * as Tooltip from '@radix-ui/react-tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { BrandingProvider } from '@/features/branding/BrandingProvider';
import { ThemeProvider } from '@/features/theme/ThemeProvider';
import { bootstrapAuth, useAuthStore } from '@/features/auth/store';
import { useCustomerAuth } from '@/features/portal/store';
import { OfflineBanner } from '@/features/pwa/components/OfflineBanner';
import {
  api,
  errorStatus,
  setCustomerUnauthorizedHandler,
  setPasswordPendingHandler,
  setUnauthorizedHandler,
} from '@/lib/api';
import type { CustomerSelfDto } from '@/types/api';
import { clearPrivateDeviceData } from '@/lib/session';
import { router } from './router';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      // A 4xx will not change on retry; only network and server trouble is worth a second try.
      retry: (failureCount, error) => {
        const status = errorStatus(error);
        return failureCount < 1 && (status === undefined || status >= 500);
      },
    },
    // Money and statuses: a save made offline fails at once and says so. It is never queued to
    // replay later, when the screen it came from may no longer be true.
    mutations: { networkMode: 'always' },
  },
});

setUnauthorizedHandler(() => {
  useAuthStore.getState().setUser(null);
  queryClient.clear();
  clearPrivateDeviceData();
  const { pathname, search } = window.location;
  void router.navigate(`/login?next=${encodeURIComponent(pathname + search)}`, { replace: true });
});

// The customer session is separate: losing it only signs the customer out of the portal.
setCustomerUnauthorizedHandler(() => {
  useCustomerAuth.getState().setCustomer(null);
  queryClient.removeQueries({ queryKey: ['portal'] });
  const { pathname, search } = window.location;
  void router.navigate(`/my/login?next=${encodeURIComponent(pathname + search)}`, {
    replace: true,
  });
});

// Reset by the owner or the shop mid-session: re-read the account, and the route guards open the
// change-password page.
setPasswordPendingHandler((kind) => {
  if (kind === 'staff') {
    void bootstrapAuth();
    return;
  }
  void api
    .get<{ customer: CustomerSelfDto }>('/customer/auth/me')
    .then(({ data }) => useCustomerAuth.getState().setCustomer(data.customer))
    .catch(() => undefined);
});

export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrandingProvider>
          {(lookKey) => (
            <Tooltip.Provider delayDuration={200}>
              <OfflineBanner />
              {/* A new look (theme, colors, labels) remounts the screens so everything reads it fresh. */}
              <RouterProvider key={lookKey} router={router} future={{ v7_startTransition: true }} />
              <Toaster position="top-center" richColors closeButton duration={3500} />
            </Tooltip.Provider>
          )}
        </BrandingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
