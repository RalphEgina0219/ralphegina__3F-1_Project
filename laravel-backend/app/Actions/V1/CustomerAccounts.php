<?php

namespace App\Actions\V1;

use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Models\User;
use App\Support\AccountRules;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;

/**
 * Counter registration and temporary passwords. A temporary password is returned once, in the
 * response; only its hash is stored, it is never logged, and the customer must change it on first
 * sign-in (must_change_password).
 */
final class CustomerAccounts
{
    /**
     * The profile and its account in one transaction.
     *
     * @param  array<string, mixed>  $profile
     * @return array{customer: Customer, temporary_password: string}
     */
    public function register(User $staff, array $profile, string $email): array
    {
        return DB::transaction(function () use ($staff, $profile, $email) {
            $customer = Customer::query()->create($profile);
            $password = $this->openAccount($customer, $email);

            Audit::record($staff->id, 'customer.created', 'customer', $customer->id, ['full_name' => $customer->full_name]);
            Audit::record($staff->id, 'customer.account_created', 'customer', $customer->id, ['full_name' => $customer->full_name]);

            return ['customer' => $customer, 'temporary_password' => $password];
        });
    }

    /**
     * "Create account" for a legacy profile.
     *
     * @return array{customer: Customer, temporary_password: string}
     */
    public function createFor(User $staff, Customer $customer, string $email): array
    {
        return DB::transaction(function () use ($staff, $customer, $email) {
            // Re-checked under a lock: two clicks cannot create two accounts (the unique index agrees).
            $locked = Customer::query()->lockForUpdate()->findOrFail($customer->id);
            if (CustomerAccount::query()->where('customer_id', $locked->id)->exists()) {
                abort(409, 'This customer already has an account.');
            }

            $password = $this->openAccount($locked, $email);
            Audit::record($staff->id, 'customer.account_created', 'customer', $locked->id, ['full_name' => $locked->full_name]);

            return ['customer' => $locked, 'temporary_password' => $password];
        });
    }

    /**
     * A new temporary password; the customer must change it at the next sign-in.
     *
     * @return array{customer: Customer, temporary_password: string}
     */
    public function resetPassword(User $staff, Customer $customer): array
    {
        return DB::transaction(function () use ($staff, $customer) {
            $account = CustomerAccount::query()->where('customer_id', $customer->id)->lockForUpdate()->first();
            if (! $account) {
                abort(409, 'This customer has no account yet. Create one first.');
            }

            $password = AccountRules::generateTemporaryPassword();
            $account->forceFill(['password' => $password, 'must_change_password' => true])->save();
            Audit::record($staff->id, 'customer.password_reset', 'customer', $customer->id, ['full_name' => $customer->full_name]);

            return ['customer' => $customer, 'temporary_password' => $password];
        });
    }

    /** Disable or enable sign-in. Orders and history are untouched either way. */
    public function setActive(User $staff, Customer $customer, bool $active): Customer
    {
        return DB::transaction(function () use ($staff, $customer, $active) {
            $account = CustomerAccount::query()->where('customer_id', $customer->id)->lockForUpdate()->first();
            if (! $account) {
                abort(404, 'Account not found.');
            }

            $account->forceFill(['is_active' => $active])->save();
            Audit::record($staff->id, 'customer.account_updated', 'customer', $customer->id, [
                'full_name' => $customer->full_name,
                'is_active' => $active,
            ]);

            return $customer;
        });
    }

    private function openAccount(Customer $customer, string $email): string
    {
        $password = AccountRules::generateTemporaryPassword();

        CustomerAccount::query()->create([
            'customer_id' => $customer->id,
            'email' => $email,
            'password' => $password,
            'is_active' => true,
            'must_change_password' => true,
        ]);

        return $password;
    }
}
