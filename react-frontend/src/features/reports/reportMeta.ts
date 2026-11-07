import {
  Banknote,
  Boxes,
  ReceiptText,
  Tags,
  UserCog,
  Users,
  WashingMachine,
  type LucideIcon,
} from 'lucide-react';
import type { ReportKind } from '@/lib/analytics/build';

export type ReportFilterKey = 'service' | 'method' | 'status' | 'staff' | 'barangay' | 'item';

export interface ReportMeta {
  kind: ReportKind;
  name: string;
  description: string;
  icon: LucideIcon;
  filters: ReportFilterKey[];
  /** Title of the detailed table. */
  tableTitle: string;
}

export const REPORTS: readonly ReportMeta[] = [
  {
    kind: 'sales',
    name: 'Sales',
    description: 'Sales by day, by service and by payment method.',
    icon: Banknote,
    filters: ['service', 'method'],
    tableTitle: 'Daily sales',
  },
  {
    kind: 'orders',
    name: 'Orders',
    description: 'Volume, status, turnaround and Express share.',
    icon: WashingMachine,
    filters: ['status', 'service', 'staff'],
    tableTitle: 'Orders received',
  },
  {
    kind: 'payments',
    name: 'Payments & balances',
    description: 'Collected vs outstanding, unpaid aging, payment log.',
    icon: ReceiptText,
    filters: ['method', 'staff'],
    tableTitle: 'Payment log',
  },
  {
    kind: 'services',
    name: 'Services',
    description: 'Orders, kilos, revenue and price per service.',
    icon: Tags,
    filters: ['service'],
    tableTitle: 'Services',
  },
  {
    kind: 'customers',
    name: 'Customers',
    description: 'New vs returning, top customers, barangays.',
    icon: Users,
    filters: ['barangay'],
    tableTitle: 'Customers served',
  },
  {
    kind: 'inventory',
    name: 'Inventory',
    description: 'Stock vs reorder level, usage, movement log.',
    icon: Boxes,
    filters: ['item'],
    tableTitle: 'Stock movements',
  },
  {
    kind: 'staff',
    name: 'Staff activity',
    description: 'Status updates and orders taken per person.',
    icon: UserCog,
    filters: ['staff'],
    tableTitle: 'Staff activity',
  },
];

export const FILTER_LABELS: Record<ReportFilterKey, string> = {
  service: 'Service',
  method: 'Payment method',
  status: 'Status',
  staff: 'Staff',
  barangay: 'Barangay',
  item: 'Item',
};

export function reportMeta(kind: string | null): ReportMeta {
  return REPORTS.find((r) => r.kind === kind) ?? (REPORTS[0] as ReportMeta);
}
