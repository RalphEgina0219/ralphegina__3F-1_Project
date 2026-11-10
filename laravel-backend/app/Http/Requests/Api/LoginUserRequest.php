<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the data sent to POST /api/v1/auth/login (course L8). Staff sign in with a username.
 */
class LoginUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.required' => 'Enter your username.',
            'password.required' => 'Enter your password.',
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'username' => ['description' => 'The staff username.', 'example' => 'liza.ramos'],
            'password' => ['description' => 'The password.', 'example' => 'password123'],
            'remember' => ['description' => 'Kept for the sign-in form; tokens are refreshed instead.', 'example' => false],
        ];
    }
}
