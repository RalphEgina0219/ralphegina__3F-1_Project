<?php

namespace App\Policies\V1;

use App\Models\InventoryItem;
use App\Models\User;
use App\Permissions\V1\Abilities;

/** Everyone sees the supply levels; only the owner manages the item list. */
class InventoryItemPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::InventoryView);
    }

    public function view(User $user, InventoryItem $item): bool
    {
        return $user->tokenCan(Abilities::InventoryView);
    }

    public function store(User $user): bool
    {
        return $user->tokenCan(Abilities::InventoryManage);
    }

    public function replace(User $user, InventoryItem $item): bool
    {
        return $user->tokenCan(Abilities::InventoryManage);
    }

    public function update(User $user, InventoryItem $item): bool
    {
        return $user->tokenCan(Abilities::InventoryManage);
    }
}
