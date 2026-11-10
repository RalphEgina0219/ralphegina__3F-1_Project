<?php

namespace App\Http\Requests\Api\V1;

/** Validates PATCH /baskets/{basket}: only the fields sent. */
class UpdateBasketRequest extends BaseBasketRequest
{
    public function rules(): array
    {
        return $this->basketRules(true);
    }
}
