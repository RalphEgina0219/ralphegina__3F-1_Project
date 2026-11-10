<?php

namespace App\Policies\V1;

use App\Models\User;
use App\Permissions\V1\Abilities;

/**
 * Stock movements. Stock-in and adjustments are the owner's (inventory.manage); staff may record
 * stock-out when the owner switched on inventory.stock_out.
 */
class InventoryMovementPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::InventoryView);
    }

    /** Recording any movement at all. */
    public function store(User $user): bool
    {
        return $user->tokenCan(Abilities::InventoryManage) || $user->tokenCan(Abilities::InventoryStockOut);
    }

    /** Recording this type of movement: in and adjust need inventory.manage. */
    public function storeType(User $user, string $type): bool
    {
        if ($user->tokenCan(Abilities::InventoryManage)) {
            return true;
        }

        return $type === 'out' && $user->tokenCan(Abilities::InventoryStockOut);
    }
}
