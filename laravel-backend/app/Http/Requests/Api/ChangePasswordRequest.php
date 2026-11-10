<?php

namespace App\Http\Requests\Api;

use App\Support\AccountRules;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;

/**
 * Validates PUT /auth/password and PUT /customer/account/password: the current password, then
 * a new one that meets the rules (8+ characters, a letter and a digit), confirmed and different.
 */
class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $account = $this->user();

        return [
            'current_password' => [
                'required',
                'string',
                function (string $attribute, mixed $value, Closure $fail) use ($account) {
                    if (! $account || ! Hash::check((string) $value, $account->password)) {
                        $fail('The current password is not correct.');
                    }
                },
            ],
            'password' => [
                'required',
                'string',
                function (string $attribute, mixed $value, Closure $fail) {
                    if ($problem = AccountRules::passwordProblem((string) $value)) {
                        $fail($problem);
                    } elseif ($value === $this->input('current_password')) {
                        $fail('Choose a password different from the current one.');
                    }
                },
            ],
            'password_confirmation' => ['required', 'same:password'],
        ];
    }

    public function messages(): array
    {
        return [
            'password_confirmation.same' => 'The passwords do not match.',
            'password_confirmation.required' => 'The passwords do not match.',
        ];
    }

    /** Descriptions and examples for Scribe (course L26). */
    public function bodyParameters(): array
    {
        return [
            'current_password' => ['description' => 'The current password, or the temporary one the owner or shop gave.', 'example' => 'k7m2p9qx4t'],
            'password' => ['description' => 'At least 8 characters, with a letter and a number, different from the current one.', 'example' => 'laundry2026'],
            'password_confirmation' => ['description' => 'The new password again.', 'example' => 'laundry2026'],
        ];
    }

    /** The account the request belongs to, on whichever guard is signed in. */
    public function user($guard = null)
    {
        return parent::user($guard) ?? auth('customer')->user();
    }
}
