export type { OrderDetailDto } from '@/types/api';

export interface RecentScan {
  id: number;
  order_number: string;
  customer_name: string;
  at: string;
}

export type CameraState =
  'idle' | 'starting' | 'on' | 'denied' | 'no-camera' | 'insecure' | 'error';
