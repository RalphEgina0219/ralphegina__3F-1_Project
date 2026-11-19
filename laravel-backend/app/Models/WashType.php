<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * How a customer's laundry is washed (Regular washing, Tough stains …). Not a service: each
 * order has its services and exactly one wash type. The optional surcharge is per kilo of the
 * order's per-kg laundry; the supplies say which soaps are used and how much per kilo.
 */
#[Fillable(['name', 'description', 'surcharge_per_kg_cents', 'sort_order', 'is_active'])]
class WashType extends Model
{
    protected function casts(): array
    {
        return [
            'surcharge_per_kg_cents' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function supplies(): HasMany
    {
        return $this->hasMany(WashTypeSupply::class)->orderBy('id');
    }

    /** The wash type an order gets when none is chosen: the first active one. */
    public static function defaultId(): ?int
    {
        $id = static::query()->where('is_active', true)->orderBy('sort_order')->orderBy('id')->value('id');

        return $id === null ? null : (int) $id;
    }
}
