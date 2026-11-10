<?php

namespace App\Http\Requests\Api;

use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Support\AccountRules;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates POST /api/v1/customer/auth/register (course L8 RegisterUserRequest, for customers).
 * The rules mirror react-frontend/src/lib/accounts.ts and the portal's messages.
 */
class RegisterCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** Normalize first, so the rules and the unique checks see the stored form. */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'full_name' => AccountRules::cleanName($this->input('full_name')),
            'contact_number' => AccountRules::normalizePhone($this->input('contact_number')),
            'email' => AccountRules::normalizeEmail($this->input('email')),
            'street_address' => trim((string) $this->input('street_address')) ?: null,
        ]);
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'min:2', 'max:255'],
            'contact_number' => ['bail', 'required', 'regex:/^09\d{9}$/', self::phoneRule()],
            'email' => ['bail', 'required', 'email:rfc', 'max:255', self::emailRule()],
            'password' => ['required', 'string', function (string $attribute, mixed $value, Closure $fail) {
                if ($problem = AccountRules::passwordProblem((string) $value)) {
                    $fail($problem);
                }
            }],
            'password_confirmation' => ['required', 'same:password'],
            'barangay_id' => ['required', 'integer', 'exists:barangays,id'],
            'street_address' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'Enter your full name.',
            'full_name.min' => 'Enter your full name.',
            'contact_number.required' => 'Use a PH mobile number: 09XX XXX XXXX.',
            'contact_number.regex' => 'Use a PH mobile number: 09XX XXX XXXX.',
            'email.required' => 'Enter an email address.',
            'email.email' => 'Enter a valid email address.',
            'password_confirmation.required' => 'The passwords do not match.',
            'password_confirmation.same' => 'The passwords do not match.',
            'barangay_id.required' => 'Choose your barangay.',
            'barangay_id.exists' => 'Choose your barangay.',
        ];
    }

    /**
     * A phone on another account is taken; a phone on a legacy profile (no account) means the shop
     * already has this customer and must set up the account, so nothing is created.
     */
    public static function phoneRule(?int $ignoreCustomerId = null): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($ignoreCustomerId) {
            $owner = Customer::query()->where('contact_number', $value)->withExists('account')->first();
            if (! $owner || $owner->id === $ignoreCustomerId) {
                return;
            }
            $fail($owner->account_exists
                ? 'This number is already registered.'
                : 'This number is already on file. Please ask the shop to set up your account.');
        };
    }

    /** Unique among accounts, compared lower-case. */
    public static function emailRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            if (! AccountRules::isValidEmail((string) $value)) {
                $fail('Enter a valid email address.');
            } elseif (CustomerAccount::query()->where('email', $value)->exists()) {
                $fail('This email is already registered.');
            }
        };
    }

    public function bodyParameters(): array
    {
        return [
            'full_name' => ['example' => 'Juan Dela Cruz'],
            'contact_number' => ['description' => 'A PH mobile number.', 'example' => '0917 555 0101'],
            'email' => ['example' => 'juan.delacruz@example.com'],
            'password' => ['description' => 'At least 8 characters, with a letter and a number.', 'example' => 'laundry123'],
            'password_confirmation' => ['example' => 'laundry123'],
            'barangay_id' => ['example' => 28],
            'street_address' => ['example' => 'Purok 3'],
        ];
    }
}
