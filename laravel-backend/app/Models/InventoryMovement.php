<?php

namespace App\Models;

use App\Models\Concerns\HasQueryFilter;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Stock in, stock out or an adjustment. Movements are never edited or deleted. */
#[Fillable(['item_id', 'user_id', 'order_id', 'type', 'quantity', 'required_quantity', 'remarks', 'moved_at'])]
#[WithoutTimestamps]
class InventoryMovement extends Model
{
    use HasQueryFilter;

    /** What staff can record by hand. */
    public const TYPES = ['in', 'out', 'adjust'];

    /** Soap deducted when an order is taken in: written by the system, linked to its order. */
    public const USAGE = 'usage';

    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'required_quantity' => 'float',
            'moved_at' => 'datetime',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
