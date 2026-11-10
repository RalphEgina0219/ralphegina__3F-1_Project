<?php

namespace App\Http\Requests\Api\V1;

/** Validates PATCH /inventory/items/{item}: only the fields sent. */
class UpdateInventoryItemRequest extends BaseInventoryItemRequest
{
    public function rules(): array
    {
        return $this->itemRules(true);
    }
}
