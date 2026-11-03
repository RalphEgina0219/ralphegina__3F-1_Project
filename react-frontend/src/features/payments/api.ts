import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateOrderData } from '@/features/orders/api';
import { api, cleanParams } from '@/lib/api';
import type {
  BalancesMeta,
  NewPaymentInput,
  OrderDetailDto,
  OrderDto,
  Paginated,
  PaymentDto,
  PaymentFilters,
  PaymentsMeta,
} from '@/types/api';

export function usePayments(filters: PaymentFilters, enabled = true) {
  return useQuery({
    queryKey: ['payments', filters],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<PaymentDto, PaymentsMeta>>('/payments', {
        params: cleanParams(filters),
      });
      return data;
    },
  });
}

export function useBalances(params: { search?: string; page?: number }) {
  return useQuery({
    queryKey: ['balances', params],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<OrderDto, BalancesMeta>>('/balances', {
        params: cleanParams(params),
      });
      return data;
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, ...input }: NewPaymentInput & { orderId: number }) => {
      const { data } = await api.post<OrderDetailDto>(`/orders/${orderId}/payments`, input);
      return data;
    },
    onSuccess: (order) => {
      queryClient.setQueryData(['orders', 'detail', order.id], order);
      invalidateOrderData(queryClient);
    },
  });
}

export function useVoidPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const { data } = await api.post<PaymentDto>(`/payments/${id}/void`, { reason });
      return data;
    },
    onSuccess: () => invalidateOrderData(queryClient),
  });
}
