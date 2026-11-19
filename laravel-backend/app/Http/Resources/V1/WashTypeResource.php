<?php

namespace App\Http\Resources\V1;

use App\Models\WashType;
use App\Support\WashRules;
use Illuminate\Http\Request;

/**
 * A wash type. Its supplies (soap and the amount per kilo) are staff-only: a customer sees the
 * wash type name and charge on their order, never soap quantities.
 *
 * @mixin WashType
 */
class WashTypeResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return [
            'type' => 'washType',
            'id' => $this->id,
            'attributes' => [
                'name' => $this->name,
                'description' => $this->description,
                'surchargePerKgCents' => (int) $this->surcharge_per_kg_cents,
                'sortOrder' => (int) $this->sort_order,
                'isActive' => (bool) $this->is_active,
                $this->mergeWhen($this->resource->relationLoaded('supplies'), fn () => [
                    'supplies' => $this->supplies->map(function ($supply) {
                        $unit = $supply->item?->unit?->code ?? '';
                        $usage = (float) $supply->usage_per_kg_small_unit;

                        return [
                            'id' => $supply->id,
                            'inventoryItemId' => (int) $supply->inventory_item_id,
                            'itemName' => $supply->item?->name ?? '',
                            'unitCode' => $unit,
                            'isItemActive' => (bool) ($supply->item?->is_active ?? false),
                            'usagePerKgSmallUnit' => $usage,
                            'usageLabel' => WashRules::formatUsage($unit, $usage),
                            'onHand' => $supply->item ? $supply->item->onHand() : 0,
                        ];
                    })->values(),
                ]),
            ],
            'links' => [
                'self' => route('wash-types.show', ['washType' => $this->id]),
            ],
        ];
    }
}
