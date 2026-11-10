<?php

namespace App\Http\Requests\Api\V1;

/**
 * Shared by PUT and PATCH /orders/{order}: only the notes and the estimated completion can change.
 * Items, prices, the customer and the baskets are fixed once the order is taken.
 */
abstract class BaseOrderRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return [
            'data.attributes.notes' => 'notes',
            'data.attributes.promisedAt' => 'promised_at',
        ];
    }

    protected function orderRules(bool $partial): array
    {
        $presence = $this->presence($partial);

        return [
            'data' => 'required|array',
            'data.attributes' => 'required|array',
            'data.attributes.notes' => [$partial ? 'sometimes' : 'present', 'nullable', 'string', 'max:2000'],
            'data.attributes.promisedAt' => [$presence, 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'data.attributes.promisedAt.required' => 'Choose a valid date and time.',
            'data.attributes.promisedAt.date' => 'Choose a valid date and time.',
        ];
    }

    /** The columns to write, with empty notes stored as null. */
    public function orderAttributes(): array
    {
        $attributes = $this->mappedAttributes();
        if (array_key_exists('notes', $attributes)) {
            $attributes['notes'] = $this->nullableText('data.attributes.notes');
        }

        return $attributes;
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.notes' => ['example' => 'Call before pickup.'],
            'data.attributes.promisedAt' => ['example' => '2026-11-09T09:00:00.000Z'],
        ];
    }
}
