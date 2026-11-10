<?php

namespace App\Http\Requests\Api\V1;

/** Shared by the supply item requests. */
abstract class BaseInventoryItemRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return [
            'data.attributes.name' => 'name',
            'data.attributes.reorderLevel' => 'reorder_level',
            'data.attributes.isActive' => 'is_active',
            'data.relationships.unit.data.id' => 'unit_id',
        ];
    }

    protected function itemRules(bool $partial): array
    {
        $presence = $this->presence($partial);

        return [
            'data' => 'required|array',
            'data.attributes' => $partial ? 'sometimes|array' : 'required|array',
            'data.attributes.name' => [$presence, 'string', 'min:2', 'max:100'],
            'data.attributes.reorderLevel' => [$presence, 'numeric', 'min:0'],
            'data.attributes.isActive' => ['sometimes', 'boolean'],
            'data.relationships.unit.data.id' => [$presence, 'integer', 'exists:units,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'data.attributes.name.required' => 'Enter the item name.',
            'data.attributes.name.min' => 'Enter the item name.',
            'data.attributes.reorderLevel.required' => 'Enter a reorder level.',
            'data.attributes.reorderLevel.numeric' => 'Enter a reorder level.',
            'data.attributes.reorderLevel.min' => 'Enter a reorder level.',
            'data.relationships.unit.data.id.required' => 'Choose a unit.',
            'data.relationships.unit.data.id.exists' => 'Choose a unit.',
            'data.relationships.unit.data.id.integer' => 'Choose a unit.',
        ];
    }

    public function itemAttributes(): array
    {
        $attributes = $this->mappedAttributes();
        if (isset($attributes['name'])) {
            $attributes['name'] = trim((string) $attributes['name']);
        }

        return $attributes;
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.name' => ['example' => 'Detergent powder'],
            'data.attributes.reorderLevel' => ['description' => 'Low at or below this; Critical at or below half.', 'example' => 5],
            'data.attributes.isActive' => ['example' => true],
            'data.relationships.unit.data.id' => ['description' => 'kg 1, L 2, pcs 3, rolls 4.', 'example' => 1],
        ];
    }
}
