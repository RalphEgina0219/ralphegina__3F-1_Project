import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, cleanParams } from '@/lib/api';
import type { ReportKind, ReportMap } from '@/types/api';

export function useReport<K extends ReportKind>(kind: K, range: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['reports', kind, range],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<ReportMap[K]>(`/reports/${kind}`, {
        params: cleanParams(range),
      });
      return data;
    },
  });
}
