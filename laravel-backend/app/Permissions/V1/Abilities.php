<?php

namespace App\Permissions\V1;

use App\Models\CustomerAccount;
use App\Models\User;

/**
 * Every ability name in one place, plus the rule that decides who receives which (course L20).
 *
 * The names are the codes the React frontend uses in lib/permissions.ts, so both sides share one
 * list. They are written into the JWT at login (the "abilities" claim) and read back by tokenCan().
 */
final class Abilities
{
    // Base abilities: every active staff account has these.
    public const DashboardView = 'dashboard.view';

    public const CustomersManage = 'customers.manage';

    public const OrdersManage = 'orders.manage';

    public const BasketsScan = 'baskets.scan';

    public const InventoryView = 'inventory.view';

    // Abilities the owner can switch on for all staff (through the permissions table).
    public const PaymentsView = 'payments.view';

    public const PaymentsRecord = 'payments.record';

    public const PaymentsVoid = 'payments.void';

    public const InventoryStockOut = 'inventory.stock_out';

    // Owner (admin) only.
    public const OrdersRevert = 'orders.revert';

    public const BasketsManage = 'baskets.manage';

    public const InventoryManage = 'inventory.manage';

    public const SalesView = 'sales.view';

    public const ReportsView = 'reports.view';

    public const SettingsManage = 'settings.manage';

    // The only ability a customer token carries.
    public const Customer = 'customer';

    /** Abilities every active staff account has. */
    public const STAFF_BASE = [
        self::DashboardView,
        self::CustomersManage,
        self::OrdersManage,
        self::BasketsScan,
        self::InventoryView,
    ];

    /** Permission code (permissions.code) => the abilities it switches on for staff. */
    public const STAFF_TOGGLES = [
        'payments.record' => [self::PaymentsView, self::PaymentsRecord],
        'inventory.stock_out' => [self::InventoryStockOut],
        'payments.void' => [self::PaymentsView, self::PaymentsVoid],
    ];

    /** The labels shown in Settings > Users & roles. */
    public const PERMISSION_LABELS = [
        'payments.record' => 'Record payments',
        'inventory.stock_out' => 'Record stock-out of supplies',
        'payments.void' => 'Void or edit a saved payment',
    ];

    /** Every staff ability, in a stable order. Admins hold all of them. */
    public const ALL_STAFF = [
        self::DashboardView,
        self::CustomersManage,
        self::OrdersManage,
        self::OrdersRevert,
        self::BasketsScan,
        self::BasketsManage,
        self::PaymentsView,
        self::PaymentsRecord,
        self::PaymentsVoid,
        self::InventoryView,
        self::InventoryStockOut,
        self::InventoryManage,
        self::SalesView,
        self::ReportsView,
        self::SettingsManage,
    ];

    /**
     * The abilities a user receives right now. Deny by default (L24): a disabled account, or a
     * role nobody listed, gets nothing.
     *
     * @return list<string>
     */
    public static function getAbilities(User|CustomerAccount $account): array
    {
        if ($account instanceof CustomerAccount) {
            return $account->is_active ? [self::Customer] : [];
        }

        if (! $account->is_active) {
            return [];
        }

        $role = $account->roleName();

        if ($role === 'admin') {
            return self::ALL_STAFF;
        }

        if ($role !== 'staff') {
            return [];
        }

        return self::forStaffPermissions($account->permissionCodes());
    }

    /**
     * A port of can() for staff: the base list plus whatever the switched-on permissions add.
     *
     * @param  list<string>  $permissionCodes
     * @return list<string>
     */
    public static function forStaffPermissions(array $permissionCodes): array
    {
        $abilities = self::STAFF_BASE;

        foreach ($permissionCodes as $code) {
            foreach (self::STAFF_TOGGLES[$code] ?? [] as $ability) {
                $abilities[] = $ability;
            }
        }

        // Keep the order of ALL_STAFF so tokens are easy to read on jwt.io.
        return array_values(array_intersect(self::ALL_STAFF, array_unique($abilities)));
    }
}
