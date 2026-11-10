<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Service;
use Illuminate\Validation\Rule;

/**
 * Shared by the service requests. A minimum applies to per_kg services only.
 */
abstract class BaseServiceRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return [
            'data.attributes.name' => 'name',
            'data.attributes.description' => 'description',
            'data.attributes.pricingType' => 'pricing_type',
            'data.attributes.rateCents' => 'rate_cents',
            'data.attributes.minimumQty' => 'minimum_qty',
            'data.attributes.isActive' => 'is_active',
        ];
    }

    protected function serviceRules(bool $partial): array
    {
        $presence = $this->presence($partial);

        return [
            'data' => 'required|array',
            'data.attributes' => 'required|array',
            'data.attributes.name' => [$presence, 'string', 'min:2', 'max:100'],
            'data.attributes.description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.attributes.pricingType' => [$presence, Rule::in(Service::PRICING_TYPES)],
            'data.attributes.rateCents' => [$presence, 'integer', 'min:1'],
            'data.attributes.minimumQty' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'data.attributes.isActive' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'data.attributes.name.required' => 'Enter the service name.',
            'data.attributes.name.min' => 'Enter the service name.',
            'data.attributes.pricingType.required' => 'Choose a pricing type.',
            'data.attributes.pricingType.in' => 'Choose a pricing type.',
            'data.attributes.rateCents.required' => 'Enter a rate above zero.',
            'data.attributes.rateCents.integer' => 'Enter a rate above zero.',
            'data.attributes.rateCents.min' => 'Enter a rate above zero.',
            'data.attributes.minimumQty.min' => 'The minimum cannot be negative.',
            'data.attributes.minimumQty.numeric' => 'The minimum cannot be negative.',
        ];
    }

    /**
     * The columns to write, normalized against the current row (PATCH sends only some fields):
     * an empty description is null, and the minimum is kept for per_kg only.
     */
    public function serviceAttributes(?Service $current = null): array
    {
        $attributes = $this->mappedAttributes();
        $pricingType = $attributes['pricing_type'] ?? $current?->pricing_type;

        if (array_key_exists('description', $attributes)) {
            $attributes['description'] = $this->nullableText('data.attributes.description');
        }
        if (array_key_exists('name', $attributes)) {
            $attributes['name'] = trim((string) $attributes['name']);
        }
        if (array_key_exists('minimum_qty', $attributes) || array_key_exists('pricing_type', $attributes) || ! $current) {
            $minimum = $attributes['minimum_qty'] ?? $current?->minimum_qty;
            $attributes['minimum_qty'] = $pricingType === 'per_kg' ? (float) ($minimum ?? 0) : null;
        }
        if (! $current && ! array_key_exists('is_active', $attributes)) {
            $attributes['is_active'] = true;
        }

        return $attributes;
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.name' => ['example' => 'Wash-Dry-Fold'],
            'data.attributes.description' => ['example' => 'Regular, 24-hour turnaround'],
            'data.attributes.pricingType' => ['description' => 'per_kg, per_piece or flat.', 'example' => 'per_kg'],
            'data.attributes.rateCents' => ['description' => 'Centavos per kg, per piece or per order.', 'example' => 3500],
            'data.attributes.minimumQty' => ['description' => 'Minimum billable kilograms (per_kg only).', 'example' => 3],
            'data.attributes.isActive' => ['example' => true],
        ];
    }
}
