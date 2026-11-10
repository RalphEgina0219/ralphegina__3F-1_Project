<?php

namespace App\Policies\V1;

use App\Models\Customer;
use App\Models\User;
use App\Permissions\V1\Abilities;

/**
 * Authorization rules for customers and their accounts. Each method returns true (allowed) or
 * false (denied), reading the abilities stored in the user's JWT (course L20).
 */
class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::CustomersManage);
    }

    public function view(User $user, Customer $customer): bool
    {
        return $user->tokenCan(Abilities::CustomersManage);
    }

    /** Counter registration: the profile and its account. */
    public function store(User $user): bool
    {
        return $user->tokenCan(Abilities::CustomersManage);
    }

    public function replace(User $user, Customer $customer): bool
    {
        return $user->tokenCan(Abilities::CustomersManage);
    }

    public function update(User $user, Customer $customer): bool
    {
        return $user->tokenCan(Abilities::CustomersManage);
    }

    /** "Create account" for a legacy profile, and temporary passwords. */
    public function manageAccount(User $user, Customer $customer): bool
    {
        return $user->tokenCan(Abilities::CustomersManage);
    }

    /** Disabling or enabling a customer's sign-in is the owner's decision. */
    public function setAccountActive(User $user, Customer $customer): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }
}
