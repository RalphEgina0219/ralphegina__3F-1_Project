import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { clearPrivateDeviceData } from '@/lib/session';
import { clearToken, setToken } from '@/lib/tokens';
import type { AuthUser } from '@/types/api';
import { useAuthStore } from './store';
import type { LoginInput } from '@/schemas/auth';

/** The Laravel API answers with a JWT (course L8); the mock API keeps its own session. */
interface LoginAnswer {
  user: AuthUser;
  access_token?: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post<LoginAnswer>('/auth/login', input);
      if (data.access_token) setToken('staff', data.access_token);
      return data.user;
    },
    onSuccess: (user) => useAuthStore.getState().setUser(user),
  });
}

/** PUT /auth/password: also the only write allowed while a reset password is pending. */
export function useChangeStaffPassword() {
  return useMutation({
    mutationFn: async (input: {
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => {
      const { data } = await api.put<{ user: AuthUser }>('/auth/password', input);
      return data.user;
    },
    onSuccess: (user) => useAuthStore.getState().setUser(user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    // The API blacklists the token, so it cannot be used again even if a copy survives.
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clearToken('staff');
      useAuthStore.getState().signOut();
      // A shared shop phone: the next person sees nothing of this one's data.
      queryClient.clear();
      clearPrivateDeviceData();
    },
  });
}
