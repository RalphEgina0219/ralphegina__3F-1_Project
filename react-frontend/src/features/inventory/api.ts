import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, cleanParams } from '@/lib/api';
import type {
  InventoryItemDto,
  InventoryItemInput,
  InventoryMovementDto,
  InventoryMovementInput,
  Paginated,
  UnitDto,
} from '@/types/api';

const STOCK_KEYS = [['inventory'], ['dashboard'], ['notifications'], ['reports']] as const;

export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory', 'items'],
    queryFn: async () => {
      const { data } = await api.get<{ data: InventoryItemDto[] }>('/inventory/items');
      return data.data;
    },
  });
}

export function useInventoryUnits() {
  return useQuery({
    queryKey: ['inventory', 'units'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await api.get<{ data: UnitDto[] }>('/inventory/units');
      return data.data;
    },
  });
}

export function useInventoryMovements(params: { item_id?: number; page?: number } = {}) {
  return useQuery({
    queryKey: ['inventory', 'movements', params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<InventoryMovementDto>>('/inventory/movements', {
        params: cleanParams(params),
      });
      return data;
    },
  });
}

function useStockMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      STOCK_KEYS.forEach(
        (queryKey) => void queryClient.invalidateQueries({ queryKey: [...queryKey] }),
      );
    },
  });
}

export function useRecordMovement() {
  return useStockMutation(async (input: InventoryMovementInput) => {
    const { data } = await api.post<InventoryMovementDto>('/inventory/movements', input);
    return data;
  });
}

export function useSaveInventoryItem() {
  return useStockMutation(async ({ id, ...input }: InventoryItemInput & { id?: number }) => {
    const { data } = id
      ? await api.put<InventoryItemDto>(`/inventory/items/${id}`, input)
      : await api.post<InventoryItemDto>('/inventory/items', input);
    return data;
  });
}
