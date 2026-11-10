<?php

namespace App\Http\Requests\Api\V1;

/** Validates PATCH /users/{user}: only the fields sent. */
class UpdateUserRequest extends BaseUserRequest
{
    public function rules(): array
    {
        return $this->userRules(true, false);
    }
}
