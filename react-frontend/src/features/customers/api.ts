import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, cleanParams } from '@/lib/api';
import type {
  Barangay,
  CustomerDto,
  CustomerInput,
  CustomersMeta,
  OrderDto,
  Paginated,
  TemporaryPasswordResponse,
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

function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['customers'] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
  };
}

/**
 * Creating registers the customer at the counter: profile and account in one step, answered with
 * a temporary password that is shown once. Editing changes the profile only.
 */
export function useSaveCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: CustomerInput & { id?: number }): Promise<{
      customer: CustomerDto;
      temporary_password: string | null;
    }> => {
      if (id) {
        const { data } = await api.put<CustomerDto>(`/customers/${id}`, input);
        return { customer: data, temporary_password: null };
      }
      const { data } = await api.post<TemporaryPasswordResponse>('/customers', input);
      return data;
    },
    onSuccess: invalidate,
  });
}

/** "Create account" for a legacy profile. */
export function useCreateCustomerAccount() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: async ({ id, email }: { id: number; email: string }) => {
      const { data } = await api.post<TemporaryPasswordResponse>(`/customers/${id}/account`, {
        email,
      });
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useResetCustomerPassword() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<TemporaryPasswordResponse>(`/customers/${id}/reset-password`);
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useSetCustomerAccountActive() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { data } = await api.put<CustomerDto>(`/customers/${id}/account`, { is_active });
      return data;
    },
    onSuccess: invalidate,
  });
}
