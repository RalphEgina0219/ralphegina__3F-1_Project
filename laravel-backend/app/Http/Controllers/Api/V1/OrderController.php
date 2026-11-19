<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\V1\CreateOrder;
use App\Http\Filters\V1\OrderFilter;
use App\Http\Requests\Api\V1\BaseOrderRequest;
use App\Http\Requests\Api\V1\ReplaceOrderRequest;
use App\Http\Requests\Api\V1\StoreOrderRequest;
use App\Http\Requests\Api\V1\UpdateOrderRequest;
use App\Http\Resources\V1\OrderResource;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\Payment;
use App\Support\Audit;
use App\Support\Iso;
use App\Support\StatusRules;
use Illuminate\Support\Facades\DB;

/**
 * @group Orders
 *
 * Laundry transactions: take them in, list and find them, and edit their notes and promised time.
 */
class OrderController extends APIController
{
    protected int $perPage = 8;

    /**
     * List orders
     *
     * Newest first. `meta.statusCounts` counts each status over every other filter, so the status
     * chips show what each would return. Use ?include=customer,baskets,items,receivedBy for the
     * list rows.
     *
     * @queryParam search string Order number, basket number, customer name or 3+ phone digits. Example: santos
     * @queryParam status string Status codes, comma separated. Example: received,washing
     * @queryParam paymentStatus string unpaid, partial or paid. Example: unpaid
     * @queryParam receivedAt string A Manila day, or from,to. Example: 2026-11-01,2026-11-08
     * @queryParam customer integer One customer's orders. Example: 1
     * @queryParam waitingMin number At least this many days in the current status. Example: 3
     * @queryParam waitingMax number Under this many days in the current status. Example: 1
     * @queryParam due string Active orders due on a Manila day, or "overdue". Example: overdue
     * @queryParam sort string orderNumber, receivedAt, promisedAt or updatedAt; - for descending. Example: -receivedAt
     * @queryParam include string customer, baskets, items, receivedBy, payments, statusHistory, basketHistory, shop. Example: customer,baskets,items,receivedBy
     * @queryParam page integer The page number. Example: 1
     * @queryParam perPage integer Rows per page (1–500, default 8). Example: 8
     */
    public function index(OrderFilter $filters)
    {
        if (! $this->isAble('viewAny', Order::class)) {
            return $this->notAuthorized('You are not authorized to view orders.');
        }

        // Status counts ignore the status filter itself (the chips show what each would return).
        $counts = Order::query()->filter($filters->except('status', 'sort'))
            ->reorder()
            ->select('current_status_id', DB::raw('COUNT(*) AS total'))
            ->groupBy('current_status_id')
            ->pluck('total', 'current_status_id');
        $statusCounts = [];
        foreach (StatusRules::ORDER as $code) {
            $statusCounts[$code] = (int) ($counts[OrderStatus::idFor($code)] ?? 0);
        }
        $statusCounts['all'] = array_sum($statusCounts);

        $orders = Order::query()->withMoney()
            ->with(Order::eagerLoadsFor($this->requestedIncludes()))
            ->filter($filters)
            ->orderByDesc('orders.id')
            ->paginate($this->perPage());

        // Both shop-wide totals in one pass over the orders table.
        $totals = Order::query()->toBase()
            ->selectRaw('COALESCE(SUM(received_at >= ? AND received_at < ?), 0) AS month_total', [now()->startOfMonth(), now()->startOfMonth()->addMonth()])
            ->selectRaw('COALESCE(SUM(current_status_id <> ?), 0) AS active_total', [OrderStatus::idFor('released')])
            ->first();

        return OrderResource::collection($orders)->additional(['meta' => [
            'statusCounts' => $statusCounts,
            'monthTotal' => (int) $totals->month_total,
            'activeTotal' => (int) $totals->active_total,
        ]]);
    }

    /**
     * Take in an order
     *
     * One transaction: locked baskets, the day's order number, items with frozen prices, the wash
     * type with its frozen surcharge and the soap it deducts from stock (409 when the shop blocks
     * orders on a soap shortage), the first history row, the optional payment, the customer's notice and the audit log.
     */
    public function store(StoreOrderRequest $request, CreateOrder $createOrder)
    {
        if (! $this->isAble('store', Order::class)) {
            return $this->notAuthorized('You are not authorized to create that resource.');
        }
        if ($request->hasPayment() && ! $this->isAble('store', Payment::class)) {
            return $this->notAuthorized('You do not have permission to record payments.');
        }

        $order = $createOrder([
            'customer_id' => $request->relationshipId('customer'),
            'basket_ids' => $request->relationshipIds('baskets'),
            'lines' => $request->lines(),
            'wash_type_id' => $request->washTypeId(),
            'wash_surcharge_per_kg_cents' => $request->washSurchargePerKgCents(),
            'promised_at' => $request->input('data.attributes.promisedAt'),
            'notes' => $request->nullableText('data.attributes.notes'),
            'payment' => $request->payment(),
        ], $request->user());

        return (new OrderResource($order->loadDetail()))->response()->setStatusCode(201);
    }

    /**
     * Show an order
     *
     * Everything the order page needs: lines, baskets, payments, status history and basket history.
     */
    public function show(Order $order)
    {
        if (! $this->isAble('view', $order)) {
            return $this->notAuthorized('You are not authorized to view that resource.');
        }

        $names = $this->requestedIncludes() ?: Order::DETAIL_INCLUDES;
        $order = Order::query()->withMoney()->with(Order::eagerLoadsFor($names))->findOrFail($order->id);

        return new OrderResource($order);
    }

    /** Replace the notes and promised time (both required) */
    public function replace(ReplaceOrderRequest $request, Order $order)
    {
        if (! $this->isAble('replace', $order)) {
            return $this->notAuthorized('You are not authorized to replace that resource.');
        }

        return new OrderResource($this->save($request, $order));
    }

    /** Update the notes or the promised time */
    public function update(UpdateOrderRequest $request, Order $order)
    {
        if (! $this->isAble('update', $order)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        return new OrderResource($this->save($request, $order));
    }

    private function save(BaseOrderRequest $request, Order $order): Order
    {
        return DB::transaction(function () use ($request, $order) {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($locked->isCompleted()) {
                abort(409, 'This transaction is completed.');
            }

            $before = ['notes' => $locked->notes, 'promised_at' => Iso::format($locked->promised_at)];
            $locked->update($request->orderAttributes());
            Audit::record($request->user()->id, 'order.updated', 'order', $locked->id, [
                'order_number' => $locked->order_number,
                'notes' => $locked->notes,
                'promised_at' => Iso::format($locked->promised_at),
            ], $before);

            return $locked;
        })->loadDetail();
    }

    /** @return list<string> */
    private function requestedIncludes(): array
    {
        return array_values(array_filter(Order::DETAIL_INCLUDES, fn ($name) => $this->include($name)));
    }
}
