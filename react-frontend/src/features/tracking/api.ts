import { useMutation, useQuery } from '@tanstack/react-query';
import { api, errorStatus } from '@/lib/api';
import type { PublicTrackingDto } from '@/types/api';

const REFRESH_MS = 60_000;

export function useTracking(token: string) {
  return useQuery({
    queryKey: ['tracking', token],
    refetchInterval: (query) => (errorStatus(query.state.error) === 404 ? false : REFRESH_MS),
    queryFn: async () => {
      const { data } = await api.get<PublicTrackingDto>(
        `/public/track/${encodeURIComponent(token)}`,
      );
      return data;
    },
  });
}

export function useTrackingLookup() {
  return useMutation({
    mutationFn: async (input: { order_number: string; phone_last4: string }) => {
      const { data } = await api.post<{ token: string }>('/public/track/lookup', input);
      return data.token;
    },
  });
}
