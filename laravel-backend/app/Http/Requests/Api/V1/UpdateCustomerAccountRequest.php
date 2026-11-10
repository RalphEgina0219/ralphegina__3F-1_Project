<?php

namespace App\Http\Requests\Api\V1;

/** Validates PATCH /customers/{customer}/account: switch the customer's sign-in on or off. */
class UpdateCustomerAccountRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return ['data.attributes.isActive' => 'is_active'];
    }

    public function rules(): array
    {
        return ['data.attributes.isActive' => ['required', 'boolean']];
    }

    public function messages(): array
    {
        return [
            'data.attributes.isActive.required' => 'Choose on or off.',
            'data.attributes.isActive.boolean' => 'Choose on or off.',
        ];
    }

    public function bodyParameters(): array
    {
        return ['data.attributes.isActive' => ['example' => false]];
    }
}
