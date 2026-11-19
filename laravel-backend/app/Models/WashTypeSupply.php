<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One soap a wash type uses. usage_per_kg_small_unit is per kilo of laundry in the item's small
 * unit: grams (kg items), millilitres (L items) or pieces (pcs items).
 */
#[Fillable(['wash_type_id', 'inventory_item_id', 'usage_per_kg_small_unit'])]
class WashTypeSupply extends Model
{
    protected function casts(): array
    {
        return ['usage_per_kg_small_unit' => 'float'];
    }

    public function washType(): BelongsTo
    {
        return $this->belongsTo(WashType::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }
}
