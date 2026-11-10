<?php

namespace App\Http\Requests\Api\V1;

/** Validates POST /users: every field, including the first password. */
class StoreUserRequest extends BaseUserRequest
{
    public function rules(): array
    {
        return $this->userRules(false, true);
    }
}
