import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, API_URL } from '@/lib/api';
import { clearPrivateDeviceData } from '@/lib/session';
import type { AuthUser } from '@/types/api';
import { useAuthStore } from './store';
import type { LoginInput } from '@/schemas/auth';

const USING_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/** Sanctum needs the CSRF cookie before the first state-changing request. */
async function ensureCsrfCookie() {
  if (USING_MOCKS) return;
  const origin = API_URL.startsWith('http') ? new URL(API_URL).origin : '';
  await axios.get(`${origin}/sanctum/csrf-cookie`, { withCredentials: true });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      await ensureCsrfCookie();
      const { data } = await api.post<{ user: AuthUser }>('/auth/login', input);
      return data.user;
    },
    onSuccess: (user) => useAuthStore.getState().setUser(user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      useAuthStore.getState().signOut();
      // A shared shop phone: the next person sees nothing of this one's data.
      queryClient.clear();
      clearPrivateDeviceData();
    },
  });
}
