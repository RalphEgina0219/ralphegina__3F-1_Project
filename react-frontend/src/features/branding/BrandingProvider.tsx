import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useTheme } from '@/features/theme/ThemeProvider';
import { api } from '@/lib/api';
import type { BrandingDto } from '@/types/api';
import { applyBranding, cacheBranding, DEFAULT_BRANDING, readCachedBranding } from './branding';

const BrandingContext = createContext<BrandingDto>(DEFAULT_BRANDING);

export const useBranding = () => useContext(BrandingContext);

/** Every payment method the shop has on, under the name it gave them. */
export function useActivePaymentMethods() {
  const branding = useBranding();
  return branding.payment_methods.filter((m) => m.is_active);
}

/**
 * Fetches the shop's public branding and applies it. The last answer is cached on the device and
 * applied before the first render (see bootBranding), so there is no flash of the default look;
 * the background refresh then corrects anything that changed.
 */
export function BrandingProvider({ children }: { children: (key: string) => ReactNode }) {
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const cached = useMemo(() => readCachedBranding(), []);
  const query = useQuery({
    queryKey: ['branding'],
    staleTime: 60_000,
    initialData: cached ?? undefined,
    initialDataUpdatedAt: 0,
    retry: 1,
    queryFn: async () => {
      const { data } = await api.get<BrandingDto>('/branding');
      cacheBranding(data);
      return data;
    },
  });
  const branding = query.data ?? DEFAULT_BRANDING;

  useEffect(() => applyBranding(branding, theme), [branding, theme]);

  // A change made on another device shows up when this one regains focus.
  useEffect(() => {
    const refresh = () => void queryClient.invalidateQueries({ queryKey: ['branding'] });
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [queryClient]);

  return (
    <BrandingContext.Provider value={branding}>
      {/* The app remounts when the look changes, so every label, colour and chart is read fresh. */}
      {children(`${branding.version}-${theme}`)}
    </BrandingContext.Provider>
  );
}

/** Before the first render: the cached branding, so the page opens in the shop's own colours. */
export function bootBranding(mode: 'light' | 'dark') {
  applyBranding(readCachedBranding() ?? DEFAULT_BRANDING, mode);
}
