<?php

namespace App\Http\Requests\Api\V1;

/** Validates PUT /inventory/items/{item}: every field is required. */
class ReplaceInventoryItemRequest extends BaseInventoryItemRequest
{
    public function rules(): array
    {
        return $this->itemRules(false);
    }
}
