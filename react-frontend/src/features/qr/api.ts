import { useMutation } from '@tanstack/react-query';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { ScannedCode } from '@/lib/tracking';
import type { OrderDetailDto } from '@/types/api';
import type { RecentScan } from './types';

export function useLookupOrder() {
  return useMutation({
    mutationFn: async (code: NonNullable<ScannedCode>) => {
      const { data } = await api.get<OrderDetailDto>('/orders/lookup', { params: code });
      return data;
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
          scans: [scan, ...state.scans.filter((s) => s.id !== scan.id)].slice(0, 6),
        })),
    }),
    { name: 'laundryflow.recent-scans' },
  ),
);
