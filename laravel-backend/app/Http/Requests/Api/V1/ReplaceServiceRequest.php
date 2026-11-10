<?php

namespace App\Http\Requests\Api\V1;

/** Validates PUT /services/{service}: every field is required. */
class ReplaceServiceRequest extends BaseServiceRequest
{
    public function rules(): array
    {
        return $this->serviceRules(false);
    }
}
