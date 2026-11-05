import { describe, expect, it } from 'vitest';
import { can } from './permissions';

const admin = { role: 'admin', permissions: [] } as const;
const staff = { role: 'staff', permissions: [] } as const;

describe('can', () => {
  it('denies a missing user', () => {
    expect(can(null, 'dashboard.view')).toBe(false);
    expect(can(undefined, 'orders.manage')).toBe(false);
  });

  it('allows an admin everything', () => {
    expect(can(admin, 'settings.manage')).toBe(true);
    expect(can(admin, 'reports.view')).toBe(true);
    expect(can(admin, 'payments.void')).toBe(true);
    expect(can(admin, 'baskets.manage')).toBe(true);
    expect(can(admin, 'baskets.scan')).toBe(true);
  });

  it('gives staff the operational base only', () => {
    expect(can(staff, 'orders.manage')).toBe(true);
    expect(can(staff, 'baskets.scan')).toBe(true);
    expect(can(staff, 'baskets.manage')).toBe(false);
    expect(can(staff, 'inventory.view')).toBe(true);
    expect(can(staff, 'reports.view')).toBe(false);
    expect(can(staff, 'settings.manage')).toBe(false);
    expect(can(staff, 'sales.view')).toBe(false);
    expect(can(staff, 'orders.revert')).toBe(false);
    expect(can(staff, 'inventory.manage')).toBe(false);
  });

  it('unlocks staff abilities from their toggles', () => {
    expect(can(staff, 'payments.record')).toBe(false);
    expect(can({ role: 'staff', permissions: ['payments.record'] }, 'payments.record')).toBe(true);
    expect(can({ role: 'staff', permissions: ['payments.record'] }, 'payments.view')).toBe(true);
    expect(can({ role: 'staff', permissions: ['payments.record'] }, 'payments.void')).toBe(false);
    expect(
      can({ role: 'staff', permissions: ['inventory.stock_out'] }, 'inventory.stock_out'),
    ).toBe(true);
  });
});
