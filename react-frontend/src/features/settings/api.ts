import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, cleanParams } from '@/lib/api';
import type {
  ActivityLogDto,
  Paginated,
  RolePermissionsDto,
  Service,
  ServiceInput,
  ShopSettings,
  UserDto,
  UserInput,
  WashTypeDto,
  WashTypeInput,
  WashTypesMeta,
} from '@/types/api';
import type { PermissionCode } from '@/types/entities';

export function useServices(params: { active?: boolean } = {}) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: Service[] }>('/services', {
        params: params.active === undefined ? {} : { active: params.active ? 1 : 0 },
      });
      return data.data;
    },
  });
}

export function useSaveService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<ServiceInput> & { id?: number }) => {
      const { data } = id
        ? await api.put<Service>(`/services/${id}`, input)
        : await api.post<Service>('/services', input);
      return data;
    },
    // The Active switch flips at once and rolls back if the save fails.
    onMutate: async ({ id, is_active }) => {
      if (!id || is_active === undefined) return undefined;
      const key = ['services', {}];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Service[]>(key);
      queryClient.setQueryData<Service[]>(key, (rows) =>
        rows?.map((row) => (row.id === id ? { ...row, is_active } : row)),
      );
      return { key, previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services'] });
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

/** Wash types with their soaps and stock. Staff read them to take orders; only the owner edits. */
export function useWashTypes(params: { active?: boolean } = {}) {
  return useQuery({
    queryKey: ['wash-types', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: WashTypeDto[]; meta: WashTypesMeta }>('/wash-types', {
        params: params.active === undefined ? {} : { active: params.active ? 1 : 0 },
      });
      return data;
    },
  });
}

export function useSaveWashType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: WashTypeInput & { id?: number }) => {
      const { data } = id
        ? await api.put<WashTypeDto>(`/wash-types/${id}`, input)
        : await api.post<WashTypeDto>('/wash-types', input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wash-types'] });
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

/** "Block new orders when soap stock is insufficient". */
export function useSaveStockRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (block_orders_on_low_soap: boolean) => {
      const { data } = await api.put<{ block_orders_on_low_soap: boolean }>(
        '/settings/stock-rule',
        {
          block_orders_on_low_soap,
        },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wash-types'] });
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserDto[] }>('/users');
      return data.data;
    },
  });
}

function useUserMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useSaveUser() {
  return useUserMutation(
    async ({ id, ...input }: Partial<UserInput> & { id?: number; is_active?: boolean }) => {
      const { data } = id
        ? await api.put<UserDto>(`/users/${id}`, input)
        : await api.post<UserDto>('/users', input);
      return data;
    },
  );
}

export function useDisableUser() {
  return useUserMutation(async (id: number) => {
    const { data } = await api.post<UserDto>(`/users/${id}/disable`);
    return data;
  });
}

export function useResetPassword() {
  return useUserMutation(async (id: number) => {
    const { data } = await api.post<{ temporary_password: string }>(`/users/${id}/reset-password`);
    return data.temporary_password;
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data } = await api.get<RolePermissionsDto>('/roles/permissions');
      return data;
    },
  });
}

export function useUpdateStaffPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (permissions: PermissionCode[]) => {
      const { data } = await api.put<RolePermissionsDto>('/roles/staff/permissions', {
        permissions,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['role-permissions'], data);
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useShopSettings() {
  return useQuery({
    queryKey: ['shop-settings'],
    queryFn: async () => {
      const { data } = await api.get<ShopSettings>('/settings/shop');
      return data;
    },
  });
}

export function useUpdateShopSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ShopSettings) => {
      const { data } = await api.put<ShopSettings>('/settings/shop', input);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['shop-settings'], data);
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export interface ActivityFilters {
  user_id?: string;
  entity?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
}

export function useActivityLogs(filters: ActivityFilters) {
  return useQuery({
    queryKey: ['activity', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<ActivityLogDto>>('/activity-logs', {
        params: cleanParams(filters),
      });
      return data;
    },
  });
}
