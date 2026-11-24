import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type {
  AdminDashboardSeries,
  ReportKind,
  ReportResponse,
  StaffDashboardSeries,
} from '@/lib/analytics/build';
import type { ForecastResponse } from '@/lib/analytics/forecast';
import type { DateRange } from '@/lib/analytics/time';
import type { AnalyticsEnvelope } from '@/lib/analytics/types';
import { api, cleanParams } from '@/lib/api';

export type DashboardAnalytics =
  AnalyticsEnvelope<AdminDashboardSeries> | AnalyticsEnvelope<StaffDashboardSeries>;

/** GET /analytics/dashboard. Admins get money; staff get a response with none in it. */
export function useDashboardAnalytics(range: DateRange, compare: boolean) {
  return useQuery({
    queryKey: ['analytics', 'dashboard', range, compare],
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await api.get<DashboardAnalytics>('/analytics/dashboard', {
        params: { ...range, compare: compare ? 'previous' : 'none' },
      });
      return data;
    },
  });
}

/** GET /analytics/forecast: the next 7 days, from the regression trained on the last 8 weeks. */
export function useForecast() {
  return useQuery({
    queryKey: ['analytics', 'forecast'],
    // The model only learns from finished days: once every few minutes is plenty.
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await api.get<ForecastResponse>('/analytics/forecast');
      return data;
    },
  });
}

export function useAnalyticsReport<K extends ReportKind>(
  kind: K,
  range: DateRange,
  compare: boolean,
  filters: Record<string, string | undefined>,
) {
  return useQuery({
    queryKey: ['analytics', 'report', kind, range, compare, filters],
    // Keep the old figures on screen while a new range or filter loads, but never another
    // report's: its series have a different shape.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === kind ? previous : undefined,
    queryFn: async () => {
      const { data } = await api.get<ReportResponse<K>>(`/reports/${kind}`, {
        params: cleanParams({ ...range, compare: compare ? 'previous' : 'none', ...filters }),
      });
      return data;
    },
  });
}
