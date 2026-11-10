<?php

namespace App\Policies\V1;

use App\Models\Service;
use App\Models\User;
use App\Permissions\V1\Abilities;

/** Staff read the price list to take orders; only the owner changes it. */
class ServicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::OrdersManage);
    }

    public function view(User $user, Service $service): bool
    {
        return $user->tokenCan(Abilities::OrdersManage);
    }

    public function store(User $user): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    public function replace(User $user, Service $service): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    public function update(User $user, Service $service): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }
}
