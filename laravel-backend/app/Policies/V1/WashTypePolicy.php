<?php

namespace App\Policies\V1;

use App\Models\User;
use App\Models\WashType;
use App\Permissions\V1\Abilities;

/** Staff read the wash types (they pick one for each order); only the owner changes them. */
class WashTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::OrdersManage);
    }

    public function view(User $user, WashType $washType): bool
    {
        return $user->tokenCan(Abilities::OrdersManage);
    }

    public function store(User $user): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    public function replace(User $user, WashType $washType): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    public function update(User $user, WashType $washType): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }
}
