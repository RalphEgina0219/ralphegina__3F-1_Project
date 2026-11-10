<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Filters\V1\OrderFilter;
use App\Http\Resources\V1\OrderResource;
use App\Models\Customer;
use App\Models\Order;

/**
 * @group Customers
 */
class CustomerOrdersController extends APIController
{
    protected int $perPage = 50;

    /**
     * List a customer's orders
     *
     * The orders of one customer (a nested resource, course L13), newest first. Every order filter
     * works here too.
     *
     * @queryParam include string As on GET /orders. Example: customer,baskets,items,receivedBy
     */
    public function index(Customer $customer, OrderFilter $filters)
    {
        if (! $this->isAble('view', $customer)) {
            return $this->notAuthorized('You are not authorized to view that resource.');
        }

        $includes = array_values(array_filter(Order::DETAIL_INCLUDES, fn ($n) => $this->include($n)));

        return OrderResource::collection(
            Order::query()->where('customer_id', $customer->id)->withMoney()
                ->with(Order::eagerLoadsFor($includes))
                ->filter($filters)
                ->orderByDesc('orders.id')
                ->paginate($this->perPage())
        );
    }
}
