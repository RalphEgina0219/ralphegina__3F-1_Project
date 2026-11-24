import {
  BarChart3,
  BrainCircuit,
  Boxes,
  CreditCard,
  LayoutGrid,
  QrCode,
  Settings,
  Users,
  WashingMachine,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Ability } from '@/lib/permissions';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  ability: Ability;
  end?: boolean;
  /** Shows the count of low-stock items. */
  stockBadge?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, ability: 'dashboard.view', end: true },
  { to: '/customers', label: 'Customers', icon: Users, ability: 'customers.manage' },
  { to: '/orders', label: 'Laundry Orders', icon: WashingMachine, ability: 'orders.manage' },
  { to: '/scan', label: 'QR Tracking', icon: QrCode, ability: 'baskets.scan' },
  { to: '/payments', label: 'Billing & Payments', icon: CreditCard, ability: 'payments.view' },
  {
    to: '/inventory',
    label: 'Inventory',
    icon: Boxes,
    ability: 'inventory.view',
    stockBadge: true,
  },
  { to: '/reports', label: 'Reports', icon: BarChart3, ability: 'reports.view' },
  // The machine-learning demand forecast: no peso fields, so staff see it too.
  { to: '/forecast', label: 'ML Forecast', icon: BrainCircuit, ability: 'dashboard.view' },
  { to: '/settings', label: 'Settings & Users', icon: Settings, ability: 'settings.manage' },
];

/** A bottom-tab link on phones, shared by the staff shell and the customer portal. */
export const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold',
    isActive ? 'text-flow-text' : 'text-muted',
  );
