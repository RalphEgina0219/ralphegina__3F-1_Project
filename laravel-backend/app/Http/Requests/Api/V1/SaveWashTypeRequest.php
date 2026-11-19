<?php

namespace App\Http\Requests\Api\V1;

use App\Models\InventoryItem;
use App\Models\WashType;
use Illuminate\Validation\Validator;

/**
 * POST /wash-types (name required) and PUT/PATCH /wash-types/{washType} (fields sent).
 *
 * Body: { "data": { "attributes": { "name": "Tough stains", "description": "…",
 *   "surchargePerKgCents": 500, "sortOrder": 5, "isActive": true,
 *   "supplies": [{ "inventoryItemId": 6, "usagePerKgSmallUnit": 0.25 }] } } }
 *
 * `supplies`, when sent, replaces the whole list. Usage is per kilo in the item's small unit
 * (g for kg items, mL for L items, pieces for pcs items).
 */
class SaveWashTypeRequest extends BaseApiRequest
{
    /** Units a soap item may have. */
    public const SOAP_UNITS = ['L', 'kg', 'pcs'];

    protected function attributeMap(): array
    {
        return [
            'data.attributes.name' => 'name',
            'data.attributes.description' => 'description',
            'data.attributes.surchargePerKgCents' => 'surcharge_per_kg_cents',
            'data.attributes.sortOrder' => 'sort_order',
            'data.attributes.isActive' => 'is_active',
        ];
    }

    public function rules(): array
    {
        $presence = $this->presence(! $this->isMethod('POST'));

        return [
            'data' => 'required|array',
            'data.attributes' => 'required|array',
            'data.attributes.name' => [$presence, 'string', 'max:100'],
            'data.attributes.description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.attributes.surchargePerKgCents' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'data.attributes.sortOrder' => ['sometimes', 'integer', 'min:0', 'max:65535'],
            'data.attributes.isActive' => ['sometimes', 'boolean'],
            'data.attributes.supplies' => ['sometimes', 'nullable', 'array', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'data.attributes.name.required' => 'Enter the wash type name.',
            'data.attributes.surchargePerKgCents.integer' => 'Enter an amount of 0 or more, with at most 2 decimals.',
            'data.attributes.surchargePerKgCents.min' => 'Enter an amount of 0 or more, with at most 2 decimals.',
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $current = $this->route('washType');
            $name = $this->has('data.attributes.name') ? trim((string) $this->input('data.attributes.name')) : null;
            if ($name !== null) {
                if ($name === '') {
                    $validator->errors()->add('data.attributes.name', 'Enter the wash type name.');
                } elseif (WashType::query()->where('name', $name)->when($current instanceof WashType, fn ($q) => $q->where('id', '!=', $current->id))->exists()) {
                    $validator->errors()->add('data.attributes.name', 'Another wash type already has that name.');
                }
            }

            if ($this->has('data.attributes.isActive') && ! $this->boolean('data.attributes.isActive') && $current instanceof WashType && $current->is_active
                && ! WashType::query()->where('is_active', true)->where('id', '!=', $current->id)->exists()) {
                $validator->errors()->add('data.attributes.isActive', 'At least one wash type must stay active.');
            }

            foreach ($this->supplyErrors() as $key => $message) {
                $validator->errors()->add($key, $message);
            }
        }];
    }

    /** @return array<string, string> */
    private function supplyErrors(): array
    {
        $supplies = $this->input('data.attributes.supplies');
        if (! is_array($supplies)) {
            return [];
        }

        $errors = [];
        $seen = [];
        $ids = array_filter(array_map(fn ($s) => is_array($s) ? ($s['inventoryItemId'] ?? null) : null, $supplies), 'is_numeric');
        $items = InventoryItem::query()->with('unit')->whereIn('id', $ids)->get()->keyBy('id');

        foreach (array_values($supplies) as $index => $supply) {
            $prefix = "data.attributes.supplies.{$index}";
            $item = is_array($supply) && is_numeric($supply['inventoryItemId'] ?? null) ? $items->get((int) $supply['inventoryItemId']) : null;

            if (! $item || ! $item->is_active || ! in_array($item->unit?->code, self::SOAP_UNITS, true)) {
                $errors["{$prefix}.inventoryItemId"] = 'Choose an active item that is counted in L, kg or pcs.';

                continue;
            }
            if (isset($seen[$item->id])) {
                $errors["{$prefix}.inventoryItemId"] = "{$item->name} is already used by this wash type.";

                continue;
            }
            $seen[$item->id] = true;

            $usage = $supply['usagePerKgSmallUnit'] ?? null;
            if (! is_numeric($usage) || (float) $usage <= 0 || (float) $usage > 1000000) {
                $errors["{$prefix}.usagePerKgSmallUnit"] = 'Enter an amount above zero.';
            } elseif (abs((float) $usage * 1000 - round((float) $usage * 1000)) > 1e-6) {
                $errors["{$prefix}.usagePerKgSmallUnit"] = 'Use at most 3 decimals.';
            }
        }

        return $errors;
    }

    /** @return array<string, mixed> The wash type columns that were sent. */
    public function washTypeAttributes(): array
    {
        $attributes = $this->mappedAttributes();
        if (isset($attributes['name'])) {
            $attributes['name'] = trim($attributes['name']);
        }
        if (array_key_exists('description', $attributes)) {
            $attributes['description'] = $this->nullableText('data.attributes.description');
        }

        return $attributes;
    }

    /**
     * @return list<array{inventory_item_id: int, usage: float}>|null null when `supplies` was not sent
     */
    public function supplyRows(): ?array
    {
        if (! $this->has('data.attributes.supplies')) {
            return null;
        }

        return array_values(array_map(fn ($s) => [
            'inventory_item_id' => (int) $s['inventoryItemId'],
            'usage' => (float) $s['usagePerKgSmallUnit'],
        ], (array) $this->input('data.attributes.supplies', [])));
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.name' => ['description' => 'Unique name.', 'example' => 'Tough stains'],
            'data.attributes.description' => ['description' => 'Short note for staff.', 'example' => 'Heavy-duty treatment for stubborn stains.'],
            'data.attributes.surchargePerKgCents' => ['description' => 'Extra charge per kilo of per-kg laundry, in centavos (0 = none).', 'example' => 500],
            'data.attributes.sortOrder' => ['description' => 'Position in the list.', 'example' => 5],
            'data.attributes.isActive' => ['description' => 'Inactive wash types stay on old orders but cannot be chosen.', 'example' => true],
            'data.attributes.supplies' => ['description' => 'Replaces the soaps used: inventoryItemId and usagePerKgSmallUnit (g, mL or pieces per kilo).', 'example' => [['inventoryItemId' => 6, 'usagePerKgSmallUnit' => 0.25]]],
        ];
    }
}
