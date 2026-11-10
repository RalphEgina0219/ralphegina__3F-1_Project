<?php

namespace App\Http\Requests\Api\V1;

/** Validates PATCH /services/{service}: only the fields sent, e.g. { "isActive": false }. */
class UpdateServiceRequest extends BaseServiceRequest
{
    public function rules(): array
    {
        return $this->serviceRules(true);
    }
}
