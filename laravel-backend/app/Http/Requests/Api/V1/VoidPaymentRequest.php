<?php

namespace App\Http\Requests\Api\V1;

/** Validates POST /payments/{payment}/void: a reason is required. */
class VoidPaymentRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return ['data.attributes.reason' => 'void_reason'];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('data.attributes.reason'))) {
            $data = (array) $this->input('data');
            $data['attributes']['reason'] = trim($this->input('data.attributes.reason'));
            $this->merge(['data' => $data]);
        }
    }

    public function rules(): array
    {
        return ['data.attributes.reason' => ['required', 'string', 'max:255']];
    }

    public function messages(): array
    {
        return ['data.attributes.reason.required' => 'A reason is required.'];
    }

    public function bodyParameters(): array
    {
        return ['data.attributes.reason' => ['example' => 'Wrong amount keyed in at the counter']];
    }
}
