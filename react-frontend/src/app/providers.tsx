import * as Tooltip from '@radix-ui/react-tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/features/auth/store';
import { errorStatus, setUnauthorizedHandler } from '@/lib/api';
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
  },
});

setUnauthorizedHandler(() => {
  useAuthStore.getState().setUser(null);
  queryClient.clear();
  const { pathname, search } = window.location;
  void router.navigate(`/login?next=${encodeURIComponent(pathname + search)}`, { replace: true });
});

export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider delayDuration={200}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
        <Toaster position="top-center" richColors closeButton duration={3500} />
      </Tooltip.Provider>
    </QueryClientProvider>
  );
}
