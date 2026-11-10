<?php

namespace App\Models;

use App\Models\Concerns\HasQueryFilter;
use App\Support\Billing;
use App\Support\Iso;
use App\Support\StatusRules;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

/**
 * A laundry transaction. No totals are stored: they come from items and payments.
 * Orders are never deleted; a completed order is read-only.
 */
#[Fillable(['order_number', 'customer_id', 'current_status_id', 'received_by', 'received_at', 'promised_at', 'released_at', 'notes'])]
class Order extends Model
{
    use HasQueryFilter;

    /** The order's total, as a correlated subquery on `orders`. */
    public const TOTAL_SQL = '(SELECT COALESCE(SUM(oi.subtotal_cents), 0) FROM order_items oi WHERE oi.order_id = orders.id)';

    /** Paid so far, voided payments excluded. */
    public const PAID_SQL = '(SELECT COALESCE(SUM(op.amount_cents), 0) FROM payments op WHERE op.order_id = orders.id AND op.voided_at IS NULL)';

    /** What is still owed, never negative. */
    public const BALANCE_SQL = 'GREATEST(0, '.self::TOTAL_SQL.' - '.self::PAID_SQL.')';

    /** When the order entered its current status: its latest history row. */
    public const STATUS_SINCE_SQL = '(SELECT MAX(sh.changed_at) FROM order_status_history sh WHERE sh.order_id = orders.id)';

    protected function casts(): array
    {
        return [
            'received_at' => 'datetime',
            'promised_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(OrderStatus::class, 'current_status_id');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->orderBy('id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    public function basketAssignments(): HasMany
    {
        return $this->hasMany(OrderBasket::class);
    }

    /** Every basket that holds or held this order's laundry, in basket-number order. */
    public function baskets(): BelongsToMany
    {
        return $this->belongsToMany(Basket::class, 'order_baskets')
            ->distinct()
            ->orderBy('baskets.basket_number');
    }

    /** What a list row shows (the frontend's OrderDto). */
    public const LIST_INCLUDES = ['customer', 'baskets', 'items', 'receivedBy'];

    /** What the order page shows (OrderDetailDto). */
    public const DETAIL_INCLUDES = ['customer', 'baskets', 'items', 'receivedBy', 'payments', 'statusHistory', 'basketHistory'];

    /**
     * The Eloquent relations behind each ?include= name, eager loaded in a fixed number of queries.
     *
     * @param  list<string>  $names
     * @return array<int|string, mixed>
     */
    public static function eagerLoadsFor(array $names): array
    {
        $map = [
            'customer' => ['customer' => fn ($q) => $q->withCount('orders')->with('barangay')],
            'baskets' => ['baskets'],
            'items' => ['items.service'],
            'receivedBy' => ['receivedBy.role'],
            'payments' => [
                'payments' => fn ($q) => $q->orderByDesc('paid_at')->orderByDesc('id'),
                'payments.method', 'payments.receivedBy.role', 'payments.voidedBy.role',
            ],
            'statusHistory' => [
                'statusHistory' => fn ($q) => $q->orderByDesc('changed_at')->orderByDesc('id'),
                'statusHistory.changedBy.role',
            ],
            'basketHistory' => [
                'basketAssignments' => fn ($q) => $q->orderBy('assigned_at')->orderBy('id'),
                'basketAssignments.basket', 'basketAssignments.assignedBy.role',
            ],
        ];

        $with = [];
        foreach ($names as $name) {
            foreach ($map[$name] ?? [] as $key => $value) {
                is_int($key) ? $with[] = $value : $with[$key] = $value;
            }
        }

        return $with;
    }

    /** Loads everything the order page shows, fresh from the database (after a write). */
    public function loadDetail(): static
    {
        $fresh = static::query()->withMoney()->with(static::eagerLoadsFor(self::DETAIL_INCLUDES))->findOrFail($this->id);
        $this->setRawAttributes($fresh->getAttributes(), true);
        $this->setRelations($fresh->getRelations());

        return $this;
    }

    /** Adds total_cents, paid_cents and status_since to each row, so a list costs one query. */
    public function scopeWithMoney(Builder $query): Builder
    {
        if ($query->getQuery()->columns === null) {
            $query->select('orders.*');
        }

        // Aliased in the SQL itself: addSelect(['alias' => DB::raw(...)]) ignores the key of a raw
        // expression, and without the alias every order fell back to its own SUM and MAX queries.
        return $query->addSelect([
            DB::raw(self::TOTAL_SQL.' as total_cents'),
            DB::raw(self::PAID_SQL.' as paid_cents'),
            DB::raw(self::STATUS_SINCE_SQL.' as status_since'),
        ]);
    }

    /** The current status code, for example ready_for_pickup. */
    public function statusCode(): string
    {
        return OrderStatus::codeFor((int) $this->current_status_id) ?? 'received';
    }

    public function isCompleted(): bool
    {
        return $this->statusCode() === 'released';
    }

    public function totalCents(): int
    {
        if (array_key_exists('total_cents', $this->attributes)) {
            return (int) $this->attributes['total_cents'];
        }

        return $this->relationLoaded('items')
            ? Billing::orderTotalCents($this->items->pluck('subtotal_cents'))
            : (int) $this->items()->sum('subtotal_cents');
    }

    public function paidCents(): int
    {
        if (array_key_exists('paid_cents', $this->attributes)) {
            return (int) $this->attributes['paid_cents'];
        }

        return $this->relationLoaded('payments')
            ? Billing::amountPaidCents($this->payments->map(fn (Payment $p) => $p->only('amount_cents', 'voided_at')))
            : (int) $this->payments()->whereNull('voided_at')->sum('amount_cents');
    }

    public function balanceCents(): int
    {
        return Billing::balanceCents($this->totalCents(), $this->paidCents());
    }

    public function paymentStatus(): string
    {
        return Billing::paymentStatus($this->totalCents(), $this->paidCents());
    }

    /** When it entered its current status (the latest history row, or when it was received). */
    public function statusSince(): string
    {
        $since = $this->attributes['status_since'] ?? null;
        if ($since === null) {
            $since = $this->relationLoaded('statusHistory')
                ? $this->statusHistory->max('changed_at')
                : $this->statusHistory()->max('changed_at');
        }

        return $since ? Iso::format($since) : Iso::format($this->received_at);
    }

    /** Past its estimated completion and still being worked on. */
    public function isOverdue(): bool
    {
        $code = $this->statusCode();
        if ($code === 'released' || $code === 'ready_for_pickup') {
            return false;
        }

        return $this->promised_at !== null && $this->promised_at->isPast();
    }

    public function statusLabel(): string
    {
        return StatusRules::label($this->statusCode());
    }

    /** Clears computed columns after a write, so the next read recomputes them. */
    public function forgetMoney(): static
    {
        unset($this->attributes['total_cents'], $this->attributes['paid_cents'], $this->attributes['status_since']);

        return $this;
    }
}
