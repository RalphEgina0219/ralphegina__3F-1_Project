<?php

namespace App\Http\Requests\Api\V1;

/** Validates POST /services. */
class StoreServiceRequest extends BaseServiceRequest
{
    public function rules(): array
    {
        return $this->serviceRules(false);
    }
}
