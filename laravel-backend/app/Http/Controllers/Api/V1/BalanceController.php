<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Filters\V1\OrderFilter;
use App\Http\Resources\V1\OrderResource;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

/**
 * @group Payments
 */
class BalanceController extends APIController
{
    /**
     * List unpaid balances
     *
     * Orders that still owe, Ready for pickup first, then oldest first. `meta` has the total
     * outstanding, the number of orders and how many are ready.
     *
     * @queryParam search string Order number or customer name. Example: santos
     * @queryParam include string As on GET /orders. Example: customer,baskets,items,receivedBy
     * @queryParam page integer The page number. Example: 1
     */
    public function index(OrderFilter $filters)
    {
        if (! $this->isAble('viewAny', Payment::class)) {
            return $this->notAuthorized('You are not authorized to view balances.');
        }

        $owing = fn () => Order::query()->whereRaw(Order::BALANCE_SQL.' > 0');
        $ready = OrderStatus::idFor('ready_for_pickup');

        $summary = DB::query()->fromSub(
            Order::query()->whereRaw(Order::BALANCE_SQL.' > 0')->select('current_status_id', DB::raw(Order::BALANCE_SQL.' AS balance')),
            'owing',
        )->selectRaw('COALESCE(SUM(balance), 0) AS outstanding, COUNT(*) AS orders_count, SUM(current_status_id = ?) AS ready_count', [$ready])->first();

        $orders = $owing()->withMoney()
            ->with(Order::eagerLoadsFor(array_values(array_filter(Order::DETAIL_INCLUDES, fn ($n) => $this->include($n)))))
            ->filter($filters->except('sort'))
            ->reorder()
            ->orderByRaw('current_status_id = ? DESC', [$ready])
            ->orderBy('received_at')
            ->orderBy('id')
            ->paginate($this->perPage());

        return OrderResource::collection($orders)->additional(['meta' => [
            'outstandingCents' => (int) $summary->outstanding,
            'ordersCount' => (int) $summary->orders_count,
            'readyCount' => (int) $summary->ready_count,
        ]]);
    }
}
