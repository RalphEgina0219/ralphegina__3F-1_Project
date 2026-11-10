<?php

namespace App\Models;

use App\Models\Concerns\HasQueryFilter;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An in-app notice. Staff notices (ready for pickup, low stock) have no customer; customer notices
 * are about one customer's own order.
 */
#[Fillable(['recipient_type', 'customer_id', 'order_id', 'type', 'channel', 'message', 'status', 'sent_at', 'read_at'])]
#[WithoutTimestamps]
class Notification extends Model
{
    use HasQueryFilter;

    public const STAFF = 'staff';

    public const CUSTOMER = 'customer';

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
