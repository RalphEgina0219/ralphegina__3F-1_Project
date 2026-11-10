<?php

namespace App\Http\Requests\Api\V1;

/** Validates PUT /users/{user}: name, username and role are required (L23). */
class ReplaceUserRequest extends BaseUserRequest
{
    public function rules(): array
    {
        return $this->userRules(false, false);
    }
}
