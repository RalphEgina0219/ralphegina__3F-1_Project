<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\V1\CustomerAccounts;
use App\Http\Filters\V1\CustomerFilter;
use App\Http\Requests\Api\V1\ReplaceCustomerRequest;
use App\Http\Requests\Api\V1\StoreCustomerRequest;
use App\Http\Requests\Api\V1\UpdateCustomerRequest;
use App\Http\Resources\V1\CustomerResource;
use App\Models\Customer;
use App\Models\Order;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;

/**
 * @group Customers
 *
 * Customer profiles and counter registration.
 */
class CustomerController extends APIController
{
    /**
     * List customers
     *
     * Most recent visit first, 15 per page. `meta.withBalance` counts customers who still owe.
     *
     * @queryParam search string Name, email or phone digits. Example: santos
     * @queryParam fullName string Name, * as a wildcard. Example: *santos*
     * @queryParam barangay string Barangay ids, comma separated. Example: 28
     * @queryParam hasAccount boolean Only with (true) or without (false) an account. Example: true
     * @queryParam sort string fullName, createdAt or lastVisitAt; prefix - for descending. Example: -lastVisitAt
     * @queryParam page integer The page number. Example: 1
     * @queryParam perPage integer Rows per page (1–500). Example: 15
     */
    public function index(CustomerFilter $filters)
    {
        if (! $this->isAble('viewAny', Customer::class)) {
            return $this->notAuthorized('You are not authorized to view customers.');
        }

        $withBalance = DB::table('orders')->whereRaw(Order::BALANCE_SQL.' > 0')->distinct()->count('customer_id');

        return CustomerResource::collection(
            Customer::query()->withTotals()->with(['barangay', 'account'])->filter($filters)->paginate($this->perPage())
        )->additional(['meta' => ['withBalance' => $withBalance]]);
    }

    /**
     * Register a customer at the counter
     *
     * Creates the profile and its account in one step. The temporary password is in the response
     * once: read it out to the customer. They must change it at the first sign-in.
     */
    public function store(StoreCustomerRequest $request, CustomerAccounts $accounts)
    {
        if (! $this->isAble('store', Customer::class)) {
            return $this->notAuthorized('You are not authorized to create that resource.');
        }

        $result = $accounts->register($request->user(), $request->mappedAttributes(), $request->input('data.attributes.email'));

        return $this->success('Customer registered', [
            'customer' => new CustomerResource($this->load($result['customer'])),
            'temporaryPassword' => $result['temporary_password'],
        ], 201);
    }

    /** Show a customer */
    public function show(Customer $customer)
    {
        if (! $this->isAble('view', $customer)) {
            return $this->notAuthorized('You are not authorized to view that resource.');
        }

        return new CustomerResource($this->load($customer));
    }

    /** Replace a customer's profile (every field) */
    public function replace(ReplaceCustomerRequest $request, Customer $customer)
    {
        if (! $this->isAble('replace', $customer)) {
            return $this->notAuthorized('You are not authorized to replace that resource.');
        }

        return new CustomerResource($this->load($this->save($request->user()->id, $customer, $request->mappedAttributes())));
    }

    /** Update a customer's profile (fields sent) */
    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        if (! $this->isAble('update', $customer)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        return new CustomerResource($this->load($this->save($request->user()->id, $customer, $request->mappedAttributes())));
    }

    private function save(int $userId, Customer $customer, array $attributes): Customer
    {
        return DB::transaction(function () use ($userId, $customer, $attributes) {
            $before = ['full_name' => $customer->full_name, 'contact_number' => $customer->contact_number];
            $customer->update($attributes);
            Audit::record($userId, 'customer.updated', 'customer', $customer->id, ['full_name' => $customer->full_name], $before);

            return $customer;
        });
    }

    private function load(Customer $customer): Customer
    {
        return Customer::query()->withTotals()->with(['barangay', 'account'])->findOrFail($customer->id);
    }
}
