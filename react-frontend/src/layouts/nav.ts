import {
  BarChart3,
  Boxes,
  CreditCard,
  LayoutGrid,
  QrCode,
  Settings,
  Users,
  WashingMachine,
  type LucideIcon,
} from 'lucide-react';
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
  { to: '/scan', label: 'QR Tracking', icon: QrCode, ability: 'qr.scan' },
  { to: '/payments', label: 'Billing & Payments', icon: CreditCard, ability: 'payments.view' },
  {
    to: '/inventory',
    label: 'Inventory',
    icon: Boxes,
    ability: 'inventory.view',
    stockBadge: true,
  },
  { to: '/reports', label: 'Reports', icon: BarChart3, ability: 'reports.view' },
  { to: '/settings', label: 'Settings & Users', icon: Settings, ability: 'settings.manage' },
];
