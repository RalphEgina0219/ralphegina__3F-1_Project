import type { BadgeTone } from '@/components/ui/Badge';
import type { BasketStatus } from '@/types/entities';

export type { BasketDto, BasketHistoryDto, ScanResultDto } from '@/types/api';

export const BASKET_STATUS_META: Record<BasketStatus, { label: string; tone: BadgeTone }> = {
  available: { label: 'Available', tone: 'ok' },
  in_use: { label: 'In use', tone: 'flow' },
  retired: { label: 'Retired', tone: 'neutral' },
};
