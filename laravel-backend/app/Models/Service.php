<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** A priced service: per_kg, per_piece or flat (charged once per order). */
#[Fillable(['name', 'description', 'pricing_type', 'rate_cents', 'minimum_qty', 'is_active'])]
class Service extends Model
{
    public const PRICING_TYPES = ['per_kg', 'per_piece', 'flat'];

    protected function casts(): array
    {
        return [
            'rate_cents' => 'integer',
            'minimum_qty' => 'float',
            'is_active' => 'boolean',
        ];
    }
}
