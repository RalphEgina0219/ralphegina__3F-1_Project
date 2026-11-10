<?php

namespace App\Http\Resources\V1;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * Transforms a staff User into the JSON our API returns. Never includes the password hash.
 *
 * @mixin User
 */
class UserResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return [
            'type' => 'user',
            'id' => $this->id,
            'attributes' => [
                'name' => $this->name,
                'username' => $this->username,
                'role' => $this->roleName(),
                // Account details appear only on the auth and user-management endpoints (L10)
                $this->mergeWhen($request->routeIs(['auth.*', 'users.*']), fn () => [
                    'permissions' => $this->permissionCodes(),
                    'isActive' => $this->is_active,
                    'mustChangePassword' => $this->must_change_password,
                    'lastLoginAt' => $this->iso($this->last_login_at),
                    'createdAt' => $this->iso($this->created_at),
                    'updatedAt' => $this->iso($this->updated_at),
                ]),
            ],
            'links' => [
                'self' => route('users.show', ['user' => $this->id]),
            ],
        ];
    }
}
