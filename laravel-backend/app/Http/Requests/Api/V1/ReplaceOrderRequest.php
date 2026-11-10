<?php

namespace App\Http\Requests\Api\V1;

/** Validates PUT /orders/{order}: notes and promisedAt are both required. */
class ReplaceOrderRequest extends BaseOrderRequest
{
    public function rules(): array
    {
        return $this->orderRules(false);
    }
}
