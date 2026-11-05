import axios from 'axios';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_URL, cleanParams } from '@/lib/api';
import type {
  Barangay,
  CustomerNotificationDto,
  CustomerRegisterInput,
  CustomerSelfDto,
  NotificationsMeta,
  Paginated,
  PortalOrderDetailDto,
  PortalOrderDto,
  PortalOrdersMeta,
} from '@/types/api';
import { useCustomerAuth } from './store';

const USING_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/** Sanctum needs the CSRF cookie before the first state-changing request. */
async function ensureCsrfCookie() {
  if (USING_MOCKS) return;
  const origin = API_URL.startsWith('http') ? new URL(API_URL).origin : '';
  await axios.get(`${origin}/sanctum/csrf-cookie`, { withCredentials: true });
}

/**
 * "Real-time" for Phase 1: re-fetch every 15 seconds, on window focus and on reconnect.
 * Laravel Reverb broadcasting can replace this later without changing the screens.
 */
export const LIVE = {
  refetchInterval: 15_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  staleTime: 0,
} as const;

const setCustomer = (customer: CustomerSelfDto | null) =>
  useCustomerAuth.getState().setCustomer(customer);

export function useCustomerLogin() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      await ensureCsrfCookie();
      const { data } = await api.post<{ customer: CustomerSelfDto }>('/customer/auth/login', input);
      return data.customer;
    },
    onSuccess: setCustomer,
  });
}

export function useCustomerRegister() {
  return useMutation({
    mutationFn: async (input: CustomerRegisterInput) => {
      await ensureCsrfCookie();
      const { data } = await api.post<{ customer: CustomerSelfDto }>(
        '/customer/auth/register',
        input,
      );
      return data.customer;
    },
    onSuccess: setCustomer,
  });
}

export function useCustomerLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/customer/auth/logout'),
    onSettled: () => {
      setCustomer(null);
      queryClient.removeQueries({ queryKey: ['portal'] });
    },
  });
}

export function useChangeMyPassword() {
  return useMutation({
    mutationFn: async (input: {
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => {
      const { data } = await api.put<{ customer: CustomerSelfDto }>(
        '/customer/account/password',
        input,
      );
      return data.customer;
    },
    onSuccess: setCustomer,
  });
}

export function useUpdateMyAccount() {
  return useMutation({
    mutationFn: async (input: {
      contact_number: string;
      barangay_id: number;
      street_address: string | null;
    }) => {
      const { data } = await api.put<{ customer: CustomerSelfDto }>('/customer/account', input);
      return data.customer;
    },
    onSuccess: setCustomer,
  });
}

export type OrderScope = 'active' | 'completed';

export function useMyOrders(params: { status?: OrderScope; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['portal', 'orders', params],
    placeholderData: keepPreviousData,
    ...LIVE,
    queryFn: async () => {
      const { data } = await api.get<Paginated<PortalOrderDto, PortalOrdersMeta>>(
        '/customer/orders',
        { params: cleanParams(params) },
      );
      return data;
    },
  });
}

export function useMyOrder(orderNumber: string) {
  return useQuery({
    queryKey: ['portal', 'order', orderNumber],
    ...LIVE,
    queryFn: async () => {
      const { data } = await api.get<PortalOrderDetailDto>(
        `/customer/orders/${encodeURIComponent(orderNumber)}`,
      );
      return data;
    },
  });
}

export function useMyNotifications() {
  return useQuery({
    queryKey: ['portal', 'notifications'],
    ...LIVE,
    queryFn: async () => {
      const { data } =
        await api.get<Paginated<CustomerNotificationDto, NotificationsMeta>>(
          '/customer/notifications',
        );
      return data;
    },
  });
}

export function useMarkMyNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/customer/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal', 'notifications'] }),
  });
}

/** The barangay list for registration and the account page, readable without a session. */
export function usePortalBarangays() {
  return useQuery({
    queryKey: ['portal', 'barangays'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await api.get<{ data: Barangay[] }>('/customer/barangays');
      return data.data;
    },
  });
}
