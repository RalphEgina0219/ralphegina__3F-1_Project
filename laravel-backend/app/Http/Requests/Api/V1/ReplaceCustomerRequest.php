<?php

namespace App\Http\Requests\Api\V1;

/** Validates PUT /customers/{customer}: every profile field is required (L17). */
class ReplaceCustomerRequest extends BaseCustomerRequest
{
    public function rules(): array
    {
        return $this->profileRules(false, $this->route('customer')?->id);
    }
}
