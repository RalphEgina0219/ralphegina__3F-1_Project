import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Notification, NotificationsMeta, Paginated } from '@/types/api';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Notification, NotificationsMeta>>('/notifications');
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
