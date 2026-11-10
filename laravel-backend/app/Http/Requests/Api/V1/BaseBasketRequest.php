<?php

namespace App\Http\Requests\Api\V1;

/**
 * Shared by PUT and PATCH /baskets/{basket}. Only the label and notes can change: the number and
 * the QR token are permanent, so they are not in the map and anything sent for them is ignored.
 */
abstract class BaseBasketRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return [
            'data.attributes.label' => 'label',
            'data.attributes.notes' => 'notes',
        ];
    }

    protected function basketRules(bool $partial): array
    {
        $presence = $partial ? 'sometimes' : 'present';

        return [
            'data' => 'required|array',
            'data.attributes' => 'required|array',
            'data.attributes.label' => [$presence, 'nullable', 'string', 'max:100'],
            'data.attributes.notes' => [$presence, 'nullable', 'string', 'max:255'],
        ];
    }

    /** Empty strings are stored as null. */
    public function basketAttributes(): array
    {
        $attributes = $this->mappedAttributes();
        foreach (['label' => 'data.attributes.label', 'notes' => 'data.attributes.notes'] as $column => $path) {
            if (array_key_exists($column, $attributes)) {
                $attributes[$column] = $this->nullableText($path);
            }
        }

        return $attributes;
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.label' => ['example' => 'Green, large'],
            'data.attributes.notes' => ['example' => 'Handle taped'],
        ];
    }
}
