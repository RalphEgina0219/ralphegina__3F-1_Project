<?php

namespace App\Http\Resources\V1;

use App\Models\Service;
use Illuminate\Http\Request;

/** @mixin Service */
class ServiceResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return [
            'type' => 'service',
            'id' => $this->id,
            'attributes' => [
                'name' => $this->name,
                'description' => $this->description,
                'pricingType' => $this->pricing_type,
                'rateCents' => (int) $this->rate_cents,
                'minimumQty' => $this->minimum_qty === null ? null : (float) $this->minimum_qty,
                'isActive' => (bool) $this->is_active,
                'createdAt' => $this->iso($this->created_at),
                'updatedAt' => $this->iso($this->updated_at),
            ],
            'links' => [
                'self' => route('services.show', ['service' => $this->id]),
            ],
        ];
    }
}
