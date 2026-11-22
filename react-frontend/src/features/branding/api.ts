import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BrandingAdminDto, BrandingInput } from '@/types/api';

export type BrandingFile = 'logo' | 'logo-dark' | 'icon';

/** A save changes what every screen shows, so the public branding is refreshed with it. */
function refreshed(queryClient: QueryClient, data: BrandingAdminDto) {
  queryClient.setQueryData(['branding', 'admin'], data);
  void queryClient.invalidateQueries({ queryKey: ['branding'] });
  void queryClient.invalidateQueries({ queryKey: ['activity'] });
}

/** The owner's view: the public branding plus the private fields and the setup checklist. */
export function useBrandingAdmin() {
  return useQuery({
    queryKey: ['branding', 'admin'],
    queryFn: async () => {
      const { data } = await api.get<BrandingAdminDto>('/settings/branding');
      return data;
    },
  });
}

export function useSaveBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BrandingInput) => {
      const { data } = await api.put<BrandingAdminDto>('/settings/branding', input);
      return data;
    },
    onSuccess: (data) => refreshed(queryClient, data),
  });
}

/** Logo, dark-mode logo or app icon: a multipart upload; the server re-encodes it. */
export function useUploadBrandingFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, file }: { kind: BrandingFile; file: File }) => {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post<BrandingAdminDto>(`/settings/branding/${kind}`, body);
      return data;
    },
    onSuccess: (data) => refreshed(queryClient, data),
  });
}

export function useRemoveBrandingFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kind: BrandingFile) => {
      const { data } = await api.delete<BrandingAdminDto>(`/settings/branding/${kind}`);
      return data;
    },
    onSuccess: (data) => refreshed(queryClient, data),
  });
}

export function useResetBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<BrandingAdminDto>('/settings/branding/reset');
      return data;
    },
    onSuccess: (data) => refreshed(queryClient, data),
  });
}

export function useTickSetupItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; done: boolean }) => {
      const { data } = await api.put<BrandingAdminDto>('/settings/setup-checklist', input);
      return data;
    },
    onSuccess: (data) => refreshed(queryClient, data),
  });
}
