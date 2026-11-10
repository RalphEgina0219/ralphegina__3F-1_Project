<?php

namespace App\Http\Requests\Api\V1;

/** Validates PATCH /customers/{customer}: only the fields sent are checked (L18). */
class UpdateCustomerRequest extends BaseCustomerRequest
{
    public function rules(): array
    {
        return $this->profileRules(true, $this->route('customer')?->id);
    }
}
