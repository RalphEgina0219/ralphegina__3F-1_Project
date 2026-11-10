<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\V1\Payments;
use App\Http\Requests\Api\V1\StorePaymentRequest;
use App\Http\Resources\V1\OrderResource;
use App\Models\Order;
use App\Models\Payment;

/**
 * @group Payments
 */
class OrderPaymentController extends APIController
{
    /**
     * Record a payment on an order
     *
     * The amount cannot exceed the balance; GCash needs its reference number. Answers with the
     * whole order, so the page shows the new balance at once.
     */
    public function store(StorePaymentRequest $request, Order $order, Payments $payments)
    {
        if (! $this->isAble('store', Payment::class)) {
            return $this->notAuthorized('You do not have permission to record payments.');
        }

        $updated = $payments->record($order, $request->payment(), $request->user());

        return (new OrderResource($updated->loadDetail()))->response()->setStatusCode(201);
    }
}
