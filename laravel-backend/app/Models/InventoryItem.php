<?php

namespace App\Models;

use App\Support\InventoryRules;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

/** A supply item. Its stock on hand is computed from its movements, never stored. */
#[Fillable(['name', 'unit_id', 'reorder_level', 'is_active'])]
class InventoryItem extends Model
{
    /** The signed sum of the movements, as a correlated subquery. */
    public const ON_HAND_SQL = "(SELECT COALESCE(SUM(CASE im.type WHEN 'out' THEN -ABS(im.quantity) WHEN 'in' THEN ABS(im.quantity) ELSE im.quantity END), 0) FROM inventory_movements im WHERE im.item_id = inventory_items.id)";

    protected function casts(): array
    {
        return [
            'reorder_level' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class, 'item_id');
    }

    public function scopeWithOnHand(Builder $query): Builder
    {
        if ($query->getQuery()->columns === null) {
            $query->select('inventory_items.*');
        }

        return $query->addSelect(DB::raw(self::ON_HAND_SQL.' as on_hand'))->with('unit');
    }

    public function onHand(): float
    {
        if (array_key_exists('on_hand', $this->attributes)) {
            return InventoryRules::round((float) $this->attributes['on_hand']);
        }

        return InventoryRules::round((float) DB::table('inventory_movements')
            ->where('item_id', $this->id)
            ->selectRaw("COALESCE(SUM(CASE type WHEN 'out' THEN -ABS(quantity) WHEN 'in' THEN ABS(quantity) ELSE quantity END), 0) AS total")
            ->value('total'));
    }

    public function stockStatus(): string
    {
        return InventoryRules::stockStatus($this->onHand(), (float) $this->reorder_level);
    }
}
