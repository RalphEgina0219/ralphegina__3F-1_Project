<?php

namespace App\Models;

use App\Models\Concerns\HasQueryFilter;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

/** A customer profile. Without an account it is a legacy profile and cannot receive new orders. */
#[Fillable(['full_name', 'contact_number', 'barangay_id', 'street_address', 'notes'])]
class Customer extends Model
{
    use HasQueryFilter;

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function account(): HasOne
    {
        return $this->hasOne(CustomerAccount::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class)->where('recipient_type', Notification::CUSTOMER);
    }

    /**
     * Adds what the customer screens show: orders_count, last_visit_at, total_spent_cents (paid,
     * voided payments excluded) and balance_cents (what is still owed over all orders).
     */
    public function scopeWithTotals(Builder $query): Builder
    {
        if ($query->getQuery()->columns === null) {
            $query->select('customers.*');
        }

        return $query
            ->withCount('orders')
            ->withMax('orders as last_visit_at', 'received_at')
            ->addSelect([
                'total_spent_cents' => DB::query()
                    ->selectRaw('COALESCE(SUM(p.amount_cents), 0)')
                    ->from('payments as p')
                    ->join('orders as po', 'po.id', '=', 'p.order_id')
                    ->whereColumn('po.customer_id', 'customers.id')
                    ->whereNull('p.voided_at'),
                'balance_cents' => DB::query()
                    ->selectRaw('COALESCE(SUM('.Order::BALANCE_SQL.'), 0)')
                    ->from('orders')
                    ->whereColumn('orders.customer_id', 'customers.id'),
            ]);
    }
}
