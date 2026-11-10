<?php

namespace App\Http\Requests\Api\V1;

/** Validates PUT /baskets/{basket}: label and notes, both sent (null clears them). */
class ReplaceBasketRequest extends BaseBasketRequest
{
    public function rules(): array
    {
        return $this->basketRules(false);
    }
}
