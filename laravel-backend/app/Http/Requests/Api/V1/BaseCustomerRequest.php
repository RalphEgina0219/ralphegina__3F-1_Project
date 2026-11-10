<?php

namespace App\Http\Requests\Api\V1;

use App\Support\AccountRules;
use Illuminate\Validation\Rule;

/**
 * Shared by the customer profile requests (store, replace, update).
 */
abstract class BaseCustomerRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return [
            'data.attributes.fullName' => 'full_name',
            'data.attributes.contactNumber' => 'contact_number',
            'data.attributes.streetAddress' => 'street_address',
            'data.attributes.notes' => 'notes',
            'data.relationships.barangay.data.id' => 'barangay_id',
        ];
    }

    /** Normalize first, so the rules and the unique index see the stored form. */
    protected function prepareForValidation(): void
    {
        $attributes = (array) $this->input('data.attributes', []);

        if (array_key_exists('fullName', $attributes)) {
            $attributes['fullName'] = AccountRules::cleanName($attributes['fullName']);
        }
        if (array_key_exists('contactNumber', $attributes)) {
            $attributes['contactNumber'] = AccountRules::normalizePhone($attributes['contactNumber']);
        }
        foreach (['streetAddress', 'notes'] as $field) {
            if (array_key_exists($field, $attributes)) {
                $attributes[$field] = is_string($attributes[$field]) && trim($attributes[$field]) !== '' ? trim($attributes[$field]) : null;
            }
        }
        if ($this->has('data')) {
            $this->merge(['data' => array_merge((array) $this->input('data'), ['attributes' => $attributes])]);
        }
    }

    /** @return array<string, mixed> */
    protected function profileRules(bool $partial, ?int $ignoreId = null): array
    {
        $presence = $this->presence($partial);

        return [
            'data' => 'required|array',
            'data.attributes' => $partial ? 'sometimes|array' : 'required|array',
            'data.attributes.fullName' => [$presence, 'string', 'min:2', 'max:255'],
            'data.attributes.contactNumber' => [
                $presence, 'bail', 'string', 'regex:/^09\d{9}$/',
                Rule::unique('customers', 'contact_number')->ignore($ignoreId),
            ],
            'data.attributes.streetAddress' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.attributes.notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'data.relationships.barangay.data.id' => [$presence, 'integer', 'exists:barangays,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'data.attributes.fullName.required' => 'Enter the full name.',
            'data.attributes.fullName.min' => 'Enter the full name.',
            'data.attributes.contactNumber.required' => 'Use the format 09XX XXX XXXX.',
            'data.attributes.contactNumber.regex' => 'Use the format 09XX XXX XXXX.',
            'data.attributes.contactNumber.unique' => 'A customer with this contact number already exists.',
            'data.relationships.barangay.data.id.required' => 'Choose a barangay.',
            'data.relationships.barangay.data.id.exists' => 'Choose a barangay.',
            'data.relationships.barangay.data.id.integer' => 'Choose a barangay.',
            'data.attributes.email.required' => 'Enter an email address.',
            'data.attributes.email.email' => 'Enter a valid email address.',
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.fullName' => ['description' => 'Full name.', 'example' => 'Juan Dela Cruz'],
            'data.attributes.contactNumber' => ['description' => 'PH mobile number, stored as 09XXXXXXXXX.', 'example' => '0917 555 0101'],
            'data.attributes.streetAddress' => ['description' => 'Street or purok.', 'example' => 'Purok 3'],
            'data.attributes.notes' => ['description' => 'Notes for the counter.', 'example' => 'Prefers unscented conditioner'],
            'data.relationships.barangay.data.id' => ['description' => 'The barangay id.', 'example' => 28],
        ];
    }
}
