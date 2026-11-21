<?php

namespace App\Http\Resources\V1;

use App\Models\Payment;
use Illuminate\Http\Request;

/**
 * A payment for the staff screens. A voided payment stays listed, with who voided it and why.
 *
 * @mixin Payment
 */
class PaymentResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        $order = $this->relationLoaded('order') ? $this->order : null;

        return $this->withIncludes([
            'type' => 'payment',
            'id' => $this->id,
            'attributes' => [
                'orderNumber' => $this->when($order !== null, fn () => $order->order_number),
                'customerName' => $this->when($order?->relationLoaded('customer') ?? false, fn () => $order->customer?->full_name ?? ''),
                'method' => $this->whenLoaded('method', fn () => $this->method->code),
                'methodLabel' => $this->whenLoaded('method', fn () => $this->method->shownLabel()),
                'amountCents' => (int) $this->amount_cents,
                'referenceNumber' => $this->reference_number,
                'receiptNumber' => $this->receipt_number,
                'paidAt' => $this->iso($this->paid_at),
                'voidedAt' => $this->iso($this->voided_at),
                'voidReason' => $this->void_reason,
            ],
            'relationships' => [
                'order' => $this->ref('order', $this->order_id, 'orders.show', ['order' => $this->order_id]),
            ],
            'links' => [
                'self' => route('payments.show', ['payment' => $this->id]),
            ],
        ], [
            'receivedBy' => $this->loadedOne('receivedBy', UserResource::class),
            'voidedBy' => $this->loadedOne('voidedBy', UserResource::class),
        ]);
    }
}
