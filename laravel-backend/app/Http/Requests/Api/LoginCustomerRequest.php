<?php

namespace App\Http\Requests\Api;

use App\Support\AccountRules;
use Illuminate\Foundation\Http\FormRequest;

/** Validates POST /api/v1/customer/auth/login. Customers sign in with their email. */
class LoginCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => AccountRules::normalizeEmail($this->input('email'))]);
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Enter your email.',
            'password.required' => 'Enter your password.',
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'email' => ['example' => 'maria.santos@example.com'],
            'password' => ['example' => 'password123'],
        ];
    }
}
