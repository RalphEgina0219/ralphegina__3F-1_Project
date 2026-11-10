<?php

namespace App\Policies\V1;

use App\Models\Basket;
use App\Models\User;
use App\Permissions\V1\Abilities;

/** Everyone at the counter scans baskets; only the owner adds, edits or retires them. */
class BasketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::BasketsScan);
    }

    public function view(User $user, Basket $basket): bool
    {
        return $user->tokenCan(Abilities::BasketsScan);
    }

    public function scan(User $user): bool
    {
        return $user->tokenCan(Abilities::BasketsScan);
    }

    public function store(User $user): bool
    {
        return $user->tokenCan(Abilities::BasketsManage);
    }

    public function replace(User $user, Basket $basket): bool
    {
        return $user->tokenCan(Abilities::BasketsManage);
    }

    public function update(User $user, Basket $basket): bool
    {
        return $user->tokenCan(Abilities::BasketsManage);
    }

    public function retire(User $user, Basket $basket): bool
    {
        return $user->tokenCan(Abilities::BasketsManage);
    }
}
