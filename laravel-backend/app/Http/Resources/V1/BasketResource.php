<?php

namespace App\Http\Resources\V1;

use App\Models\Basket;
use Illuminate\Http\Request;

/**
 * A basket. Inside an order it only needs its number; the usage figures appear when the list
 * query added them (withUsage()).
 *
 * @mixin Basket
 */
class BasketResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        $active = $this->relationLoaded('activeAssignment') ? $this->activeAssignment : null;

        return [
            'type' => 'basket',
            'id' => $this->id,
            'attributes' => [
                'basketNumber' => $this->basket_number,
                $this->mergeWhen($this->qr_token !== null, fn () => [
                    'qrToken' => $this->qr_token,
                    'label' => $this->label,
                    'status' => $this->status,
                    'notes' => $this->notes,
                    'createdBy' => $this->created_by,
                    'createdAt' => $this->iso($this->created_at),
                    'updatedAt' => $this->iso($this->updated_at),
                ]),
                'currentOrder' => $this->when($this->relationLoaded('activeAssignment'), fn () => $active?->order ? [
                    'id' => $active->order->id,
                    'orderNumber' => $active->order->order_number,
                ] : null),
                'timesUsed' => $this->whenHas('times_used', fn () => (int) $this->times_used),
                'lastUsedAt' => $this->whenHas('last_used_at', fn () => $this->iso($this->last_used_at)),
            ],
            'links' => [
                'self' => route('baskets.show', ['basket' => $this->id]),
            ],
        ];
    }
}
