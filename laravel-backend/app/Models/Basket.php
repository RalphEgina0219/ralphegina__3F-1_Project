<?php

namespace App\Models;

use App\Models\Concerns\HasQueryFilter;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * A reusable physical basket with a permanent QR label. Never deleted: a lost one is retired.
 * Its number and token are never writable through the API.
 */
#[Fillable(['basket_number', 'qr_token', 'label', 'status', 'notes', 'created_by'])]
class Basket extends Model
{
    use HasQueryFilter;

    public const STATUSES = ['available', 'in_use', 'retired'];

    public function assignments(): HasMany
    {
        return $this->hasMany(OrderBasket::class);
    }

    /** The open assignment (released_at IS NULL), if the basket holds an order. */
    public function activeAssignment(): HasOne
    {
        return $this->hasOne(OrderBasket::class)->whereNull('released_at');
    }

    /** Adds times_used and last_used_at, and loads the current order, for lists. */
    public function scopeWithUsage(Builder $query): Builder
    {
        return $query
            ->withCount('assignments as times_used')
            ->withMax('assignments as last_used_at', 'assigned_at')
            ->with('activeAssignment.order:id,order_number');
    }
}
