<?php

namespace App\Http\Requests\Api\V1;

/** Validates POST /inventory/items. */
class StoreInventoryItemRequest extends BaseInventoryItemRequest
{
    public function rules(): array
    {
        return $this->itemRules(false);
    }
}
