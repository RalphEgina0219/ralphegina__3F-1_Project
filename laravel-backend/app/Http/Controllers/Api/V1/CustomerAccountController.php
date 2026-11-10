<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\V1\CustomerAccounts;
use App\Http\Requests\Api\V1\StoreCustomerAccountRequest;
use App\Http\Requests\Api\V1\UpdateCustomerAccountRequest;
use App\Http\Resources\V1\CustomerResource;
use App\Models\Customer;

/**
 * @group Customers
 *
 * A customer's sign-in: create it for a legacy profile, issue a temporary password, switch it on or off.
 */
class CustomerAccountController extends APIController
{
    /**
     * Create an account for a legacy profile
     *
     * Answers 409 when the customer already has one. The temporary password is shown once.
     */
    public function store(StoreCustomerAccountRequest $request, Customer $customer, CustomerAccounts $accounts)
    {
        if (! $this->isAble('manageAccount', $customer)) {
            return $this->notAuthorized('You are not authorized to create that resource.');
        }

        $result = $accounts->createFor($request->user(), $customer, $request->input('data.attributes.email'));

        return $this->success('Account created', $this->answer($result), 201);
    }

    /**
     * Reset the customer's password
     *
     * Issues a new temporary password (shown once) and asks the customer to change it.
     */
    public function resetPassword(Customer $customer, CustomerAccounts $accounts)
    {
        if (! $this->isAble('manageAccount', $customer)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        return $this->ok('Temporary password issued', $this->answer($accounts->resetPassword(request()->user(), $customer)));
    }

    /**
     * Enable or disable sign-in
     *
     * Owner only.
     */
    public function update(UpdateCustomerAccountRequest $request, Customer $customer, CustomerAccounts $accounts)
    {
        if (! $this->isAble('setAccountActive', $customer)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        $accounts->setActive($request->user(), $customer, $request->boolean('data.attributes.isActive'));

        return new CustomerResource(Customer::query()->withTotals()->with(['barangay', 'account'])->findOrFail($customer->id));
    }

    /** @param  array{customer: Customer, temporary_password: string}  $result */
    private function answer(array $result): array
    {
        return [
            'customer' => new CustomerResource(
                Customer::query()->withTotals()->with(['barangay', 'account'])->findOrFail($result['customer']->id)
            ),
            'temporaryPassword' => $result['temporary_password'],
        ];
    }
}
