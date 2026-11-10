<?php

namespace App\Http\Resources\V1;

use App\Models\InventoryItem;
use App\Support\InventoryRules;
use Illuminate\Http\Request;

/**
 * A supply item with its computed stock: on hand, Low / Critical status and the bar fill.
 *
 * @mixin InventoryItem
 */
class InventoryItemResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        $onHand = $this->onHand();
        $reorder = (float) $this->reorder_level;

        return [
            'type' => 'inventoryItem',
            'id' => $this->id,
            'attributes' => [
                'name' => $this->name,
                'unitCode' => $this->unit?->code ?? '',
                'unitLabel' => $this->unit?->label ?? '',
                'reorderLevel' => $reorder,
                'isActive' => (bool) $this->is_active,
                'onHand' => $onHand,
                'stockStatus' => InventoryRules::stockStatus($onHand, $reorder),
                'levelPercent' => InventoryRules::levelPercent($onHand, $reorder),
            ],
            'relationships' => [
                'unit' => $this->ref('unit', $this->unit_id),
            ],
            'links' => [
                'self' => route('inventory.items.show', ['item' => $this->id]),
            ],
        ];
    }
}
