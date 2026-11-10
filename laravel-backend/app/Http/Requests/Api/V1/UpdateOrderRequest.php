<?php

namespace App\Http\Requests\Api\V1;

/** Validates PATCH /orders/{order}: only the fields sent. */
class UpdateOrderRequest extends BaseOrderRequest
{
    public function rules(): array
    {
        return $this->orderRules(true);
    }
}
