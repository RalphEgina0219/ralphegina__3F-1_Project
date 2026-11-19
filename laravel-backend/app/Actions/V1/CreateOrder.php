<?php

namespace App\Actions\V1;

use App\Models\Basket;
use App\Models\Order;
use App\Models\OrderBasket;
use App\Models\OrderItem;
use App\Models\OrderStatus;
use App\Models\OrderStatusHistory;
use App\Models\User;
use App\Models\WashType;
use App\Support\Audit;
use App\Support\Notifier;
use App\Support\Sequences;
use App\Support\WashRules;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Takes in a new order, all in one database transaction:
 * the baskets locked with lockForUpdate() and checked again, the order number from its locked
 * daily sequence, the order, its priced items, the basket assignments, the first status-history
 * row, the optional payment, the customer's notification and the audit log.
 */
final class CreateOrder
{
    public function __construct(private readonly Payments $payments, private readonly SoapUsage $soap) {}

    /**
     * @param  array{customer_id: int, basket_ids: list<int>, lines: list<array<string, mixed>>, wash_type_id: int, wash_surcharge_per_kg_cents: int, promised_at: string, notes: ?string, payment: ?array}  $input
     */
    public function __invoke(array $input, User $staff): Order
    {
        try {
            // attempts: 3 retries the whole transaction on a deadlock or lock-wait timeout, so two
            // counters that collide on the same rows never see a database error.
            return DB::transaction(fn () => $this->write($input, $staff), attempts: 3);
        } catch (QueryException $exception) {
            // UNIQUE(basket_id, active_flag): another counter took a basket at the same moment.
            if (($exception->errorInfo[1] ?? null) === 1062 && str_contains($exception->getMessage(), 'order_baskets_basket_active_unique')) {
                abort(409, self::BASKET_TAKEN);
            }

            throw $exception;
        }
    }

    /** The answer when the unique index, not the lock, stopped a second order on one basket. */
    public const BASKET_TAKEN = 'One of the baskets was just taken by another order. Choose again.';

    private function write(array $input, User $staff): Order
    {
        $now = CarbonImmutable::now();

        // First the day's sequence (one order at a time), then the baskets: always in this order.
        Sequences::lockOrderDay($now);

        // Lock the chosen baskets, then check them again: the request was validated before the lock.
        $baskets = Basket::query()->whereIn('id', $input['basket_ids'])->orderBy('id')->lockForUpdate()->get();
        foreach ($input['basket_ids'] as $basketId) {
            $basket = $baskets->firstWhere('id', $basketId);
            $active = $basket ? OrderBasket::query()->with('order:id,order_number')->where('basket_id', $basket->id)->whereNull('released_at')->lockForUpdate()->first() : null;

            $problem = match (true) {
                ! $basket => 'One of the baskets does not exist.',
                $basket->status === 'retired' => "{$basket->basket_number} is retired and cannot be used.",
                default => null,
            };
            if ($problem) {
                throw ValidationException::withMessages(['data.relationships.baskets.data' => $problem]);
            }
            // The basket holds another order: a conflict of state. Thrown before the order number
            // is drawn, so a refused order never uses up a number.
            if ($active !== null) {
                abort(409, "{$basket->basket_number} is in use by ".($active->order?->order_number ?? 'another order').'.');
            }
        }

        // The wash type's soap, checked under the item locks before an order number is drawn.
        $washType = WashType::query()->findOrFail($input['wash_type_id']);
        $perKgTenths = WashRules::perKgTenths(array_map(fn ($line) => [
            'pricing_type' => ($line['weight_kg'] ?? null) === null ? 'other' : 'per_kg',
            'weight_kg' => $line['weight_kg'] ?? null,
        ], $input['lines']));
        $soapPlan = $this->soap->plan($washType, $perKgTenths);
        $this->soap->guard($soapPlan);

        $receivedId = OrderStatus::idFor('received');
        $order = Order::query()->create([
            'order_number' => Sequences::nextOrderNumber($now),
            'customer_id' => $input['customer_id'],
            'current_status_id' => $receivedId,
            'received_by' => $staff->id,
            'wash_type_id' => $washType->id,
            'wash_surcharge_per_kg_cents' => $input['wash_surcharge_per_kg_cents'],
            'received_at' => $now,
            'promised_at' => CarbonImmutable::parse($input['promised_at']),
            'notes' => $input['notes'],
        ]);

        foreach ($input['lines'] as $line) {
            OrderItem::query()->create(['order_id' => $order->id] + $line);
        }

        $this->soap->deduct($order, $washType, $perKgTenths, $soapPlan, $staff);

        OrderStatusHistory::query()->create([
            'order_id' => $order->id,
            'from_status_id' => null,
            'to_status_id' => $receivedId,
            'changed_by' => $staff->id,
            'note' => null,
            'changed_at' => $now,
        ]);

        foreach ($baskets as $basket) {
            OrderBasket::query()->create([
                'order_id' => $order->id,
                'basket_id' => $basket->id,
                'assigned_at' => $now,
                'assigned_by' => $staff->id,
            ]);
            $basket->forceFill(['status' => 'in_use'])->save();
        }

        if ($input['payment'] !== null) {
            $this->payments->create($order, $input['payment'], $staff);
        }

        Notifier::customer($order, 'received');
        Audit::record($staff->id, 'order.created', 'order', $order->id, [
            'order_number' => $order->order_number,
            'basket_ids' => $baskets->pluck('id')->all(),
            'wash_type' => $washType->name,
        ]);

        return $order;
    }
}
