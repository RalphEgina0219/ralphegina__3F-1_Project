export type { OrderDetailDto, ScanResultDto } from '@/types/api';

export interface RecentScan {
  /** A basket number or an order number: never a label token, so nothing secret is stored. */
  code: string;
  kind: 'basket' | 'order';
  /** "Maria Santos · LF-261105-0004", "Available" or "Retired". */
  detail: string;
  at: string;
}

export type CameraState =
  'idle' | 'starting' | 'on' | 'denied' | 'no-camera' | 'insecure' | 'error';
