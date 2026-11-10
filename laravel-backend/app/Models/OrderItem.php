<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One line of an order. The unit price and subtotal are frozen when the order is made. */
#[Fillable(['order_id', 'service_id', 'weight_kg', 'quantity', 'unit_price_cents', 'subtotal_cents'])]
#[WithoutTimestamps]
class OrderItem extends Model
{
    protected function casts(): array
    {
        return [
            'weight_kg' => 'float',
            'quantity' => 'integer',
            'unit_price_cents' => 'integer',
            'subtotal_cents' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
