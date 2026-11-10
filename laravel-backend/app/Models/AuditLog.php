<?php

namespace App\Models;

use App\Models\Concerns\HasQueryFilter;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Who did what, with the values before and after. Append-only. */
#[Fillable(['user_id', 'action', 'auditable_type', 'auditable_id', 'old_values', 'new_values', 'created_at'])]
class AuditLog extends Model
{
    use HasQueryFilter;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
