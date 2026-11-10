<?php

namespace App\Http\Requests\Api\V1;

use App\Http\Requests\Api\RegisterCustomerRequest;
use App\Support\AccountRules;

/**
 * Validates POST /customers: counter registration creates the profile and its account in one
 * step, so the email is required here.
 */
class StoreCustomerRequest extends BaseCustomerRequest
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        if ($this->has('data.attributes.email')) {
            $data = (array) $this->input('data');
            $data['attributes']['email'] = AccountRules::normalizeEmail($this->input('data.attributes.email'));
            $this->merge(['data' => $data]);
        }
    }

    public function rules(): array
    {
        return array_merge($this->profileRules(false), [
            'data.attributes.email' => ['bail', 'required', 'string', 'max:255', RegisterCustomerRequest::emailRule()],
        ]);
    }

    public function bodyParameters(): array
    {
        return array_merge(parent::bodyParameters(), [
            'data.attributes.email' => ['description' => 'The sign-in email of the new account.', 'example' => 'juan.delacruz@example.com'],
        ]);
    }
}
