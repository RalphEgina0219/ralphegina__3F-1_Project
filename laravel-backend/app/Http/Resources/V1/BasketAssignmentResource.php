<?php

namespace App\Http\Resources\V1;

use App\Models\OrderBasket;
use Illuminate\Http\Request;

/**
 * One row of order_baskets: which basket held which order, when, and when it was handed back.
 * On a basket's history it names the order and customer; on an order it names the basket.
 *
 * @mixin OrderBasket
 */
class BasketAssignmentResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        $order = $this->relationLoaded('order') ? $this->order : null;

        return $this->withIncludes([
            'type' => 'basketAssignment',
            'id' => $this->id,
            'attributes' => [
                'orderNumber' => $this->when($order !== null, fn () => $order->order_number),
                'customerName' => $this->when($order?->relationLoaded('customer') ?? false, fn () => $order->customer?->full_name ?? ''),
                'assignedAt' => $this->iso($this->assigned_at),
                'releasedAt' => $this->iso($this->released_at),
            ],
            'relationships' => [
                'order' => $this->ref('order', $this->order_id, 'orders.show', ['order' => $this->order_id]),
                'basket' => $this->ref('basket', $this->basket_id, 'baskets.show', ['basket' => $this->basket_id]),
            ],
        ], [
            'basket' => $this->loadedOne('basket', BasketResource::class),
            'assignedBy' => $this->loadedOne('assignedBy', UserResource::class),
        ]);
    }
}
