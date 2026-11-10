<?php

namespace App\Http\Requests\Api\V1;

use App\Models\InventoryMovement;
use Illuminate\Validation\Rule;

/**
 * Validates POST /inventory/movements:
 * { "data": { "attributes": { "type": "out", "quantity": 1.5, "remarks": "Used today" },
 *   "relationships": { "item": { "data": { "id": 1 } } } } }
 * Whether the stock allows it is checked by the action, with the item row locked.
 */
class StoreInventoryMovementRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return [
            'data.attributes.type' => 'type',
            'data.attributes.quantity' => 'quantity',
            'data.attributes.remarks' => 'remarks',
            'data.relationships.item.data.id' => 'item_id',
        ];
    }

    public function rules(): array
    {
        return [
            'data.relationships.item.data.id' => ['required', 'integer', Rule::exists('inventory_items', 'id')->where('is_active', true)],
            'data.attributes.type' => ['required', Rule::in(InventoryMovement::TYPES)],
            'data.attributes.quantity' => ['required', 'numeric'],
            'data.attributes.remarks' => [
                Rule::requiredIf(fn () => $this->input('data.attributes.type') === 'adjust'),
                'nullable', 'string', 'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'data.relationships.item.data.id.required' => 'Choose an item.',
            'data.relationships.item.data.id.integer' => 'Choose an item.',
            'data.relationships.item.data.id.exists' => 'Choose an item.',
            'data.attributes.type.required' => 'Choose a movement type.',
            'data.attributes.type.in' => 'Choose a movement type.',
            'data.attributes.quantity.required' => 'Enter a quantity.',
            'data.attributes.quantity.numeric' => 'Enter a quantity.',
            'data.attributes.remarks.required' => 'Say why the count is being adjusted.',
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.type' => ['description' => 'in, out or adjust (adjust may be negative).', 'example' => 'out'],
            'data.attributes.quantity' => ['example' => 1.5],
            'data.attributes.remarks' => ['description' => 'Required for an adjustment.', 'example' => 'Used today'],
            'data.relationships.item.data.id' => ['example' => 1],
        ];
    }
}
