import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { api, cleanParams } from '@/lib/api';
import { BOARD_STATUSES } from '@/lib/status';
import type {
  NewOrderInput,
  OrderDetailDto,
  OrderDto,
  OrderFilters,
  OrdersMeta,
  Paginated,
} from '@/types/api';
import type { StatusCode } from '@/types/entities';

/** Everything an order change can affect. */
export function invalidateOrderData(queryClient: QueryClient) {
  for (const key of [
    'orders',
    'dashboard',
    'notifications',
    'customers',
    'balances',
    'payments',
    'reports',
    'baskets',
    'scan',
    // The order deducts soap from stock.
    'inventory',
    'wash-types',
  ]) {
    void queryClient.invalidateQueries({ queryKey: [key] });
  }
}

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ['orders', 'list', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<OrderDto, OrdersMeta>>('/orders', {
        params: cleanParams(filters),
      });
      return data;
    },
  });
}

export function useBoardOrders() {
  return useQuery({
    queryKey: ['orders', 'board'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<OrderDto, OrdersMeta>>('/orders', {
        params: { status: BOARD_STATUSES.join(','), per_page: 500 },
      });
      return data.data;
    },
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: async () => {
      const { data } = await api.get<OrderDetailDto>(`/orders/${id}`);
      return data;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewOrderInput) => {
      const { data } = await api.post<OrderDetailDto>('/orders', input);
      return data;
    },
    onSuccess: () => invalidateOrderData(queryClient),
  });
}

export function useUpdateOrder(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { notes?: string | null; promised_at?: string }) => {
      const { data } = await api.put<OrderDetailDto>(`/orders/${id}`, input);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['orders', 'detail', id], data);
      invalidateOrderData(queryClient);
    },
  });
}

export function useChangeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      to_status,
      note,
      basket_id,
    }: {
      id: number;
      to_status: StatusCode;
      note?: string;
      /** Sent from the scanner, so the server can refuse a stale screen with 409. */
      basket_id?: number;
    }) => {
      const { data } = await api.post<OrderDetailDto>(`/orders/${id}/status`, {
        to_status,
        note,
        basket_id,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['orders', 'detail', data.id], data);
      invalidateOrderData(queryClient);
    },
  });
}
