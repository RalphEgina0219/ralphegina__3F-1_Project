<?php

namespace App\Http\Resources\V1;

use App\Models\InventoryMovement;
use App\Support\InventoryRules;
use Illuminate\Http\Request;

/** @mixin InventoryMovement */
class InventoryMovementResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        $item = $this->relationLoaded('item') ? $this->item : null;

        return $this->withIncludes([
            'type' => 'inventoryMovement',
            'id' => $this->id,
            'attributes' => [
                'itemName' => $item?->name ?? '',
                'unitCode' => $item?->unit?->code ?? '',
                'type' => $this->type,
                'quantity' => (float) $this->quantity,
                'requiredQuantity' => $this->required_quantity === null ? null : (float) $this->required_quantity,
                'orderId' => $this->order_id === null ? null : (int) $this->order_id,
                'orderNumber' => $this->relationLoaded('order') ? $this->order?->order_number : null,
                'signedQuantity' => InventoryRules::signedQuantity($this->type, (float) $this->quantity),
                'remarks' => $this->remarks,
                'movedAt' => $this->iso($this->moved_at),
            ],
            'relationships' => [
                'item' => $this->ref('inventoryItem', $this->item_id, 'inventory.items.show', ['item' => $this->item_id]),
            ],
        ], [
            'user' => $this->loadedOne('user', UserResource::class),
        ]);
    }
}
