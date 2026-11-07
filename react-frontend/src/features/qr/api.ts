import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchScan } from '@/features/baskets/api';
import { onPrivateDataCleared } from '@/lib/session';
import type { RecentScan } from './types';

/** Resolves a scanned or typed code and primes the order cache, so later moves show at once. */
export function useScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fetchScan,
    onSuccess: (result) => {
      const order = result.type === 'basket' ? result.active_order : result.order;
      if (order) queryClient.setQueryData(['orders', 'detail', order.id], order);
    },
  });
}

interface RecentScansState {
  scans: RecentScan[];
  add: (scan: RecentScan) => void;
}

/** Per-device convenience, so it lives in the browser rather than on the server. */
export const useRecentScans = create<RecentScansState>()(
  persist(
    (set) => ({
      scans: [],
      add: (scan) =>
        set((state) => ({
          scans: [scan, ...state.scans.filter((s) => s.code !== scan.code)].slice(0, 6),
        })),
    }),
    // v2: entries now hold basket numbers as well as order numbers.
    { name: 'laundryflow.recent-scans.v2' },
  ),
);

// Recent scans name customers: they go when anyone signs out.
onPrivateDataCleared(() => useRecentScans.setState({ scans: [] }));
