<?php

namespace App\Http\Requests\Api\V1;

use App\Http\Requests\Api\RegisterCustomerRequest;
use App\Support\AccountRules;

/** Validates POST /customers/{customer}/account: "Create account" for a legacy profile. */
class StoreCustomerAccountRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return ['data.attributes.email' => 'email'];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('data.attributes.email')) {
            $data = (array) $this->input('data');
            $data['attributes']['email'] = AccountRules::normalizeEmail($this->input('data.attributes.email'));
            $this->merge(['data' => $data]);
        }
    }

    public function rules(): array
    {
        return [
            'data.attributes.email' => ['bail', 'required', 'string', 'max:255', RegisterCustomerRequest::emailRule()],
        ];
    }

    public function messages(): array
    {
        return ['data.attributes.email.required' => 'Enter an email address.'];
    }

    public function bodyParameters(): array
    {
        return ['data.attributes.email' => ['example' => 'janine.alcantara@example.com']];
    }
}
