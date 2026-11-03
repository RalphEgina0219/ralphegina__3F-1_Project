import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardSummary } from '@/types/api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await api.get<DashboardSummary>('/dashboard/summary');
      return data;
    },
  });
}
