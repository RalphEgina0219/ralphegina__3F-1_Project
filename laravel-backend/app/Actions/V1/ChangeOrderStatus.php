<?php

namespace App\Actions\V1;

use App\Models\Basket;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderBasket;
use App\Models\OrderStatus;
use App\Models\OrderStatusHistory;
use App\Models\User;
use App\Support\Audit;
use App\Support\Notifier;
use App\Support\StatusRules;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Moves an order to another stage, in one transaction with the order row locked:
 * forward one step at a time; an admin may go back one step with a reason; Completed needs a zero
 * balance and hands the baskets back; a completed order is read-only. Every change writes history,
 * the customer's notification and the audit log.
 */
final class ChangeOrderStatus
{
    /**
     * @param  bool  $canRevert  Whether the user holds orders.revert (decided by the policy).
     */
    public function __invoke(Order $order, string $to, ?string $note, ?int $basketId, User $staff, bool $canRevert): Order
    {
        if (! in_array($to, StatusRules::ORDER, true)) {
            throw ValidationException::withMessages(['data.attributes.toStatus' => 'Choose a valid status.']);
        }

        return DB::transaction(function () use ($order, $to, $note, $basketId, $staff, $canRevert) {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);
            $from = $locked->statusCode();
            $note = $note !== null && trim($note) !== '' ? trim($note) : null;

            // From the scanner: the basket in hand must still hold this order, or the screen is stale.
            if ($basketId !== null) {
                $active = OrderBasket::query()->where('basket_id', $basketId)->whereNull('released_at')->first();
                if (! $active || $active->order_id !== $locked->id) {
                    abort(409, $from === 'released'
                        ? 'This transaction is completed.'
                        : 'This basket has no active laundry session.');
                }
            }

            $check = StatusRules::checkTransition($from, $to, $canRevert ? 'admin' : 'staff', $locked->forgetMoney()->balanceCents(), $note);
            if (! $check['ok']) {
                if ($check['code'] === 'revert_reason_required') {
                    throw ValidationException::withMessages(['data.attributes.note' => $check['message']]);
                }
                abort(StatusRules::HTTP_STATUS[$check['code']], $check['message']);
            }

            $now = CarbonImmutable::now();
            $locked->forceFill([
                'current_status_id' => OrderStatus::idFor($to),
                'released_at' => $to === 'released' ? $now : null,
            ])->save();

            // Completion hands the baskets back in the same transaction. The order stays forever.
            if ($to === 'released') {
                $this->releaseBaskets($locked, $now);
            }

            OrderStatusHistory::query()->create([
                'order_id' => $locked->id,
                'from_status_id' => OrderStatus::idFor($from),
                'to_status_id' => OrderStatus::idFor($to),
                'changed_by' => $staff->id,
                'note' => $note,
                'changed_at' => $now,
            ]);

            if ($to === 'ready_for_pickup' && $check['direction'] === 'forward') {
                $name = Customer::query()->whereKey($locked->customer_id)->value('full_name') ?? 'customer';
                Notifier::staff('ready_for_pickup', "{$locked->order_number} is ready for pickup ({$name}).", $locked->id);
            }
            Notifier::customer($locked, $to);
            Audit::record($staff->id, 'order.status_changed', 'order', $locked->id, [
                'order_number' => $locked->order_number,
                'from' => $from,
                'to' => $to,
                'note' => $note,
            ]);

            return $locked;
        });
    }

    /** Closes the order's open assignments and frees its baskets for the next customer. */
    private function releaseBaskets(Order $order, CarbonImmutable $at): void
    {
        $rows = OrderBasket::query()->where('order_id', $order->id)->whereNull('released_at')->lockForUpdate()->get();

        foreach ($rows as $row) {
            $row->forceFill(['released_at' => $at])->save();
            Basket::query()->whereKey($row->basket_id)->where('status', 'in_use')->update(['status' => 'available', 'updated_at' => $at]);
        }
    }
}
