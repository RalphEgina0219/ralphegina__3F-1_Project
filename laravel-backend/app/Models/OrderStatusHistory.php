<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Every status change: from, to, who and when, with an optional note. */
#[Table('order_status_history')]
#[Fillable(['order_id', 'from_status_id', 'to_status_id', 'changed_by', 'note', 'changed_at'])]
#[WithoutTimestamps]
class OrderStatusHistory extends Model
{
    protected function casts(): array
    {
        return ['changed_at' => 'datetime'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
