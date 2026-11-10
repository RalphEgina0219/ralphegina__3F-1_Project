<?php

namespace App\Actions\V1;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Support\Audit;
use App\Support\Billing;
use App\Support\PaymentRules;
use App\Support\Sequences;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Recording and voiding payments. The amount can never exceed the balance; GCash needs its
 * reference number; every payment gets the next OR number; a void needs a reason and re-opens
 * the balance. Payments are never deleted.
 */
final class Payments
{
    /**
     * Writes one payment inside the caller's transaction.
     *
     * @param  array{amount_cents: int, method: string, reference_number: ?string}  $values
     */
    public function create(Order $order, array $values, User $staff): Payment
    {
        $payment = Payment::query()->create([
            'order_id' => $order->id,
            'payment_method_id' => PaymentMethod::idFor($values['method']),
            'amount_cents' => $values['amount_cents'],
            'reference_number' => $values['reference_number'],
            'receipt_number' => Sequences::nextReceiptNumber(),
            'received_by' => $staff->id,
            'paid_at' => now(),
        ]);

        Audit::record($staff->id, 'payment.recorded', 'payment', $payment->id, [
            'order_number' => $order->order_number,
            'amount_cents' => $values['amount_cents'],
            'method' => $values['method'],
            'receipt_number' => $payment->receipt_number,
        ]);

        return $payment;
    }

    /**
     * POST /orders/{order}/payments.
     *
     * @param  array<string, mixed>  $input  amountCents, paymentMethod, referenceNumber
     */
    public function record(Order $order, array $input, User $staff): Order
    {
        return DB::transaction(function () use ($order, $input, $staff) {
            // Lock the order: two counters cannot both take the last peso of a balance.
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);
            $balance = $locked->forgetMoney()->balanceCents();

            if ($locked->isCompleted()) {
                abort(409, 'This transaction is completed.');
            }
            if ($balance <= 0) {
                abort(422, 'This order is already fully paid.');
            }

            $check = PaymentRules::check($input, $balance);
            if ($check['errors'] !== []) {
                throw ValidationException::withMessages(collect($check['errors'])
                    ->mapWithKeys(fn ($message, $field) => ["data.attributes.{$field}" => $message])
                    ->all());
            }

            $this->create($locked, $check['values'], $staff);
            $locked->touch();

            return $locked;
        });
    }

    /** POST /payments/{payment}/void */
    public function void(Payment $payment, string $reason, User $staff): Payment
    {
        return DB::transaction(function () use ($payment, $reason, $staff) {
            $locked = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            $order = Order::query()->lockForUpdate()->findOrFail($locked->order_id);

            if ($locked->voided_at !== null) {
                abort(422, 'This payment is already voided.');
            }
            if ($order->isCompleted()) {
                abort(409, 'This transaction is completed. Its payments can no longer be voided.');
            }

            $locked->forceFill([
                'voided_at' => now(),
                'voided_by' => $staff->id,
                'void_reason' => $reason,
            ])->save();
            $order->touch();

            Audit::record($staff->id, 'payment.voided', 'payment', $locked->id, [
                'order_number' => $order->order_number,
                'receipt_number' => $locked->receipt_number,
                'reason' => $reason,
            ]);

            return $locked;
        });
    }

    /** The balance an order has right now (used by tests and the status rules). */
    public static function balanceOf(Order $order): int
    {
        $fresh = Order::query()->withMoney()->findOrFail($order->id);

        return Billing::balanceCents($fresh->totalCents(), $fresh->paidCents());
    }
}
