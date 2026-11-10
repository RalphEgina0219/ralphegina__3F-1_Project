<?php

namespace App\Http\Resources\V1;

use App\Models\OrderItem;
use Illuminate\Http\Request;

/**
 * One order line. The unit price and subtotal were frozen when the order was made.
 *
 * @mixin OrderItem
 */
class OrderItemResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return [
            'type' => 'orderItem',
            'id' => $this->id,
            'attributes' => [
                'weightKg' => $this->weight_kg === null ? null : (float) $this->weight_kg,
                'quantity' => $this->quantity === null ? null : (int) $this->quantity,
                'unitPriceCents' => (int) $this->unit_price_cents,
                'subtotalCents' => (int) $this->subtotal_cents,
                'serviceName' => $this->whenLoaded('service', fn () => $this->service->name, 'Service'),
                'pricingType' => $this->whenLoaded('service', fn () => $this->service->pricing_type, 'flat'),
            ],
            'relationships' => [
                'order' => $this->ref('order', $this->order_id),
                'service' => $this->ref('service', $this->service_id, 'services.show'),
            ],
        ];
    }
}
