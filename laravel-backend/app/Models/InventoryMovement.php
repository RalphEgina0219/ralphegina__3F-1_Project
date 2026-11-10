<?php

namespace App\Models;

use App\Models\Concerns\HasQueryFilter;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Stock in, stock out or an adjustment. Movements are never edited or deleted. */
#[Fillable(['item_id', 'user_id', 'type', 'quantity', 'remarks', 'moved_at'])]
#[WithoutTimestamps]
class InventoryMovement extends Model
{
    use HasQueryFilter;

    public const TYPES = ['in', 'out', 'adjust'];

    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'moved_at' => 'datetime',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
