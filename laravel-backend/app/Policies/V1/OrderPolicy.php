<?php

namespace App\Policies\V1;

use App\Models\Order;
use App\Models\User;
use App\Permissions\V1\Abilities;

/**
 * Orders. Moving an order back a stage needs orders.revert (the owner). Whether a completed order
 * may change is a rule of the order's state, answered with 409 by the actions, not a permission.
 */
class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::OrdersManage);
    }

    public function view(User $user, Order $order): bool
    {
        return $user->tokenCan(Abilities::OrdersManage);
    }

    public function store(User $user): bool
    {
        return $user->tokenCan(Abilities::OrdersManage);
    }

    public function replace(User $user, Order $order): bool
    {
        return $user->tokenCan(Abilities::OrdersManage);
    }

    public function update(User $user, Order $order): bool
    {
        return $user->tokenCan(Abilities::OrdersManage);
    }

    public function changeStatus(User $user, Order $order): bool
    {
        return $user->tokenCan(Abilities::OrdersManage);
    }

    public function revert(User $user, Order $order): bool
    {
        return $user->tokenCan(Abilities::OrdersRevert);
    }
}
