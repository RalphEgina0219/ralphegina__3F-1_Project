<?php

namespace App\Http\Requests\Api\V1;

use App\Support\StatusRules;
use Illuminate\Validation\Rule;

/**
 * Validates POST /orders/{order}/status:
 * { "data": { "attributes": { "toStatus": "washing", "note": null }, "relationships": { "basket": { "data": { "id": 7 } } } } }
 * The basket is optional: the scanner sends it so a stale screen is refused with 409.
 */
class ChangeStatusRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return [
            'data.attributes.toStatus' => 'to_status',
            'data.attributes.note' => 'note',
            'data.relationships.basket.data.id' => 'basket_id',
        ];
    }

    public function rules(): array
    {
        return [
            'data.attributes.toStatus' => ['required', 'string', Rule::in(StatusRules::ORDER)],
            'data.attributes.note' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.relationships.basket.data.id' => ['sometimes', 'nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'data.attributes.toStatus.required' => 'Choose a valid status.',
            'data.attributes.toStatus.in' => 'Choose a valid status.',
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.toStatus' => ['description' => 'received, washing, drying, folding, ready_for_pickup or released (Completed).', 'example' => 'washing'],
            'data.attributes.note' => ['description' => 'Required when an admin moves an order back.', 'example' => null],
            'data.relationships.basket.data.id' => ['description' => 'The scanned basket, if any.', 'example' => 7],
        ];
    }
}
