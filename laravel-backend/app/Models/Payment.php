<?php

namespace App\Models;

use App\Models\Concerns\HasQueryFilter;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A payment. Never deleted: a mistake is voided with a reason, which re-opens the balance. */
#[Fillable(['order_id', 'payment_method_id', 'amount_cents', 'reference_number', 'receipt_number', 'received_by', 'paid_at', 'voided_at', 'voided_by', 'void_reason'])]
#[WithoutTimestamps]
class Payment extends Model
{
    use HasQueryFilter;

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'paid_at' => 'datetime',
            'voided_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function method(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }
}
