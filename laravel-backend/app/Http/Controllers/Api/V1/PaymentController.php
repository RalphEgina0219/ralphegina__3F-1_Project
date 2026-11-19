<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\V1\Payments;
use App\Http\Filters\V1\PaymentFilter;
use App\Http\Requests\Api\V1\VoidPaymentRequest;
use App\Http\Resources\V1\PaymentResource;
use App\Models\Payment;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\DB;

/**
 * @group Payments
 *
 * The payment log and voiding. Sales are the payments collected, voided ones excluded.
 */
class PaymentController extends APIController
{
    /**
     * List payments
     *
     * Newest first. `meta` sums the payments that match the filters, voided ones excluded:
     * collectedCents, cashCents, gcashCents, mayaCents and count. For the same range it equals the sales
     * figure on the dashboard and in the reports.
     *
     * @queryParam paidAt string A Manila day, or from,to. Example: 2026-11-01,2026-11-08
     * @queryParam method string cash, gcash or maya. Example: maya
     * @queryParam search string Receipt number, order number or customer name. Example: OR-0002
     * @queryParam voided boolean Only voided (true) or valid (false) payments. Example: false
     * @queryParam sort string paidAt, amountCents or receiptNumber; - for descending. Example: -paidAt
     * @queryParam page integer The page number. Example: 1
     */
    public function index(PaymentFilter $filters)
    {
        if (! $this->isAble('viewAny', Payment::class)) {
            return $this->notAuthorized('You are not authorized to view payments.');
        }

        $methods = PaymentMethod::query()->pluck('id', 'code');
        $sums = Payment::query()->filter($filters->except('sort'))->reorder()->whereNull('voided_at')
            ->select('payment_method_id', DB::raw('SUM(amount_cents) AS total'), DB::raw('COUNT(*) AS rows_count'))
            ->groupBy('payment_method_id')
            ->get()
            ->keyBy('payment_method_id');
        $sum = fn (string $code) => (int) ($sums[$methods[$code] ?? 0]->total ?? 0);

        $payments = Payment::query()
            ->with(['method', 'order.customer', 'receivedBy.role', 'voidedBy.role'])
            ->filter($filters)
            ->orderByDesc('payments.id')
            ->paginate($this->perPage());

        return PaymentResource::collection($payments)->additional(['meta' => [
            'collectedCents' => (int) $sums->sum('total'),
            'cashCents' => $sum('cash'),
            'gcashCents' => $sum('gcash'),
            'mayaCents' => $sum('maya'),
            'count' => (int) $sums->sum('rows_count'),
        ]]);
    }

    /** Show a payment */
    public function show(Payment $payment)
    {
        if (! $this->isAble('view', $payment)) {
            return $this->notAuthorized('You are not authorized to view that resource.');
        }

        return new PaymentResource($payment->load(['method', 'order.customer', 'receivedBy.role', 'voidedBy.role']));
    }

    /**
     * Void a payment
     *
     * Needs a reason. The payment stays on record and no longer counts; the balance re-opens.
     * Answers 409 on a completed order.
     */
    public function void(VoidPaymentRequest $request, Payment $payment, Payments $payments)
    {
        if (! $this->isAble('void', $payment)) {
            return $this->notAuthorized('You are not authorized to void payments.');
        }

        $voided = $payments->void($payment, $request->input('data.attributes.reason'), $request->user());

        return new PaymentResource($voided->load(['method', 'order.customer', 'receivedBy.role', 'voidedBy.role']));
    }
}
