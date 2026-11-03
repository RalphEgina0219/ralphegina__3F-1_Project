import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, cleanParams } from '@/lib/api';
import type {
  Barangay,
  CustomerDto,
  CustomerInput,
  CustomersMeta,
  OrderDto,
  Paginated,
} from '@/types/api';

export function useCustomers(params: { search?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['customers', 'list', params],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<CustomerDto, CustomersMeta>>('/customers', {
        params: cleanParams(params),
      });
      return data;
    },
  });
}

export function useCustomer(id: number | undefined) {
  return useQuery({
    queryKey: ['customers', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<CustomerDto>(`/customers/${id}`);
      return data;
    },
  });
}

export function useCustomerOrders(id: number | undefined) {
  return useQuery({
    queryKey: ['customers', 'orders', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Paginated<OrderDto>>(`/customers/${id}/orders`);
      return data.data;
    },
  });
}

export function useBarangays() {
  return useQuery({
    queryKey: ['barangays'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await api.get<{ data: Barangay[] }>('/barangays');
      return data.data;
    },
  });
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CustomerInput & { id?: number }) => {
      const { data } = id
        ? await api.put<CustomerDto>(`/customers/${id}`, input)
        : await api.post<CustomerDto>('/customers', input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
