import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, cleanParams } from '@/lib/api';
import type {
  BasketDto,
  BasketHistoryDto,
  BasketsMeta,
  Paginated,
  ScanResultDto,
} from '@/types/api';
import type { BasketStatus } from '@/types/entities';

export interface BasketFilters {
  status?: BasketStatus | '';
  search?: string;
  page?: number;
  per_page?: number;
}

export function useBaskets(filters: BasketFilters) {
  return useQuery({
    queryKey: ['baskets', 'list', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<BasketDto, BasketsMeta>>('/baskets', {
        params: cleanParams(filters),
      });
      return data;
    },
  });
}

/** Baskets free to take a new order. */
export function useAvailableBaskets() {
  return useQuery({
    queryKey: ['baskets', 'available'],
    queryFn: async () => {
      const { data } = await api.get<{ data: BasketDto[] }>('/baskets/available');
      return data.data;
    },
  });
}

export function useBasketHistory(id: number | null, page = 1) {
  return useQuery({
    queryKey: ['baskets', 'history', id, page],
    enabled: id !== null,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<BasketHistoryDto>>(`/baskets/${id}/history`, {
        params: { page },
      });
      return data;
    },
  });
}

/** Resolves a basket label token, a basket number or an order number. */
export async function fetchScan(code: string) {
  const { data } = await api.get<ScanResultDto>(`/scan/${encodeURIComponent(code)}`);
  return data;
}

function useInvalidateBaskets() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ['baskets'] });
}

export function useAddBaskets() {
  const invalidate = useInvalidateBaskets();
  return useMutation({
    mutationFn: async (input: { count: number; label?: string | null }) => {
      const { data } = await api.post<{ data: BasketDto[] }>('/baskets', input);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateBasket() {
  const invalidate = useInvalidateBaskets();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: number;
      label: string | null;
      notes: string | null;
    }) => {
      const { data } = await api.put<BasketDto>(`/baskets/${id}`, input);
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useRetireBasket() {
  const invalidate = useInvalidateBaskets();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const { data } = await api.post<BasketDto>(`/baskets/${id}/retire`, { reason });
      return data;
    },
    onSuccess: invalidate,
  });
}
