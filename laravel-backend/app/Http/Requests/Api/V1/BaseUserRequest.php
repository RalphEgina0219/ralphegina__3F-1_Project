<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Role;
use Illuminate\Validation\Rule;

/**
 * Shared by the staff user requests (course L23). The base request hashes any password it maps
 * before it is saved, and turns the role name into role_id.
 */
abstract class BaseUserRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return [
            'data.attributes.name' => 'name',
            'data.attributes.username' => 'username',
            'data.attributes.role' => 'role_id',
            'data.attributes.password' => 'password',
            'data.attributes.isActive' => 'is_active',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('data.attributes.username'))) {
            $data = (array) $this->input('data');
            $data['attributes']['username'] = mb_strtolower(trim($this->input('data.attributes.username')));
            $this->merge(['data' => $data]);
        }
    }

    public function mappedAttributes(array $otherAttributes = []): array
    {
        $attributes = parent::mappedAttributes($otherAttributes);

        if (array_key_exists('role_id', $attributes)) {
            $attributes['role_id'] = Role::idFor((string) $attributes['role_id']);
        }
        if (array_key_exists('name', $attributes)) {
            $attributes['name'] = trim((string) $attributes['name']);
        }
        // Never store a plain password: hash it first (L23).
        if (array_key_exists('password', $attributes)) {
            $attributes['password'] = bcrypt($attributes['password']);
        }
        // Users are never disabled through an edit: only POST /users/{user}/disable does that.
        if (array_key_exists('is_active', $attributes) && $attributes['is_active'] !== true) {
            unset($attributes['is_active']);
        }

        return $attributes;
    }

    protected function userRules(bool $partial, bool $withPassword): array
    {
        $presence = $this->presence($partial);

        return array_filter([
            'data' => 'required|array',
            'data.attributes' => 'required|array',
            'data.attributes.name' => [$presence, 'string', 'min:2', 'max:255'],
            'data.attributes.username' => [
                $presence, 'bail', 'string', 'regex:/^[a-z0-9._-]{3,}$/', 'max:50',
                Rule::unique('users', 'username')->ignore($this->route('user')),
            ],
            'data.attributes.role' => [$presence, Rule::in(['admin', 'staff']), function (string $attribute, mixed $value, \Closure $fail) {
                $target = $this->route('user');
                if ($target && $target->id === $this->user()?->id && $value !== 'admin') {
                    $fail('You cannot remove your own administrator role.');
                }
            }],
            'data.attributes.password' => $withPassword ? ['required', 'string', 'min:8'] : ['sometimes', 'string', 'min:8'],
            'data.attributes.isActive' => ['sometimes', 'boolean'],
        ]);
    }

    public function messages(): array
    {
        return [
            'data.attributes.name.required' => 'Enter the full name.',
            'data.attributes.name.min' => 'Enter the full name.',
            'data.attributes.username.required' => 'Use at least 3 letters, numbers, dots or dashes.',
            'data.attributes.username.regex' => 'Use at least 3 letters, numbers, dots or dashes.',
            'data.attributes.username.unique' => 'This username is taken.',
            'data.attributes.role.required' => 'Choose a role.',
            'data.attributes.role.in' => 'Choose a role.',
            'data.attributes.password.required' => 'Use at least 8 characters.',
            'data.attributes.password.min' => 'Use at least 8 characters.',
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.name' => ['example' => 'Rico Santos'],
            'data.attributes.username' => ['description' => 'Lower-case letters, digits, dots, dashes.', 'example' => 'rico.s'],
            'data.attributes.role' => ['description' => 'admin or staff.', 'example' => 'staff'],
            'data.attributes.password' => ['description' => 'At least 8 characters.', 'example' => 'password123'],
            'data.attributes.isActive' => ['description' => 'true re-enables a disabled account.', 'example' => true],
        ];
    }
}
