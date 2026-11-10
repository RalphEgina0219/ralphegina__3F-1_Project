<?php

namespace App\Http\Filters\V1;

use App\Models\Order;
use App\Models\OrderStatus;

/**
 * The filters allowed on GET /orders (and the balances list).
 */
class OrderFilter extends QueryFilter
{
    protected array $sortable = [
        'orderNumber' => 'order_number',
        'receivedAt' => 'received_at',
        'promisedAt' => 'promised_at',
        'updatedAt' => 'updated_at',
    ];

    // Newest first, as on the orders screen.
    protected string $defaultSort = '-receivedAt';

    /** ?search=LF-261108  (order number, basket number, customer name, or 3+ phone digits) */
    public function search($value)
    {
        $like = $this->likeValue(mb_strtolower($value));
        $digits = preg_replace('/\D/', '', $value);

        return $this->builder->where(function ($query) use ($like, $digits) {
            $query->where('orders.order_number', 'like', $like)
                ->orWhereHas('baskets', fn ($q) => $q->where('baskets.basket_number', 'like', $like))
                ->orWhereHas('customer', function ($q) use ($like, $digits) {
                    $q->where('full_name', 'like', $like);
                    if (strlen($digits) >= 3) {
                        $q->orWhere('contact_number', 'like', "%{$digits}%");
                    }
                });
        });
    }

    /** ?status=received,washing  (status codes) */
    public function status($value)
    {
        $ids = array_map(fn ($code) => OrderStatus::idFor($code), $this->list($value));

        return $this->builder->whereIn('orders.current_status_id', $ids);
    }

    /** ?paymentStatus=unpaid|partial|paid  (derived from items and payments) */
    public function paymentStatus($value)
    {
        $paid = Order::PAID_SQL;
        $total = Order::TOTAL_SQL;

        return match ($value) {
            'unpaid' => $this->builder->whereRaw("{$paid} <= 0"),
            'partial' => $this->builder->whereRaw("{$paid} > 0 AND {$paid} < {$total}"),
            'paid' => $this->builder->whereRaw("{$paid} > 0 AND {$paid} >= {$total}"),
            default => $this->builder,
        };
    }

    /** ?receivedAt=2026-11-08  or  ?receivedAt=2026-11-01,2026-11-08  (Manila days, inclusive) */
    public function receivedAt($value)
    {
        $this->dateRange('orders.received_at', $value);

        return $this->builder;
    }

    /** ?promisedAt=2026-11-09 */
    public function promisedAt($value)
    {
        $this->dateRange('orders.promised_at', $value);

        return $this->builder;
    }

    /** ?customer=12  (one customer's orders) */
    public function customer($value)
    {
        return $this->builder->whereIn('orders.customer_id', $this->list($value));
    }

    /** ?orderNumber=*0007* */
    public function orderNumber($value)
    {
        return $this->builder->where('orders.order_number', 'like', $this->likeValue($value));
    }

    /** ?waitingMin=3  (at least this many days in the current status; dashboard drill-down) */
    public function waitingMin($value)
    {
        $seconds = (int) round((float) $value * 86400);

        return $this->builder->whereRaw(Order::STATUS_SINCE_SQL.' <= ?', [now()->subSeconds($seconds)]);
    }

    /** ?waitingMax=1  (under this many days in the current status) */
    public function waitingMax($value)
    {
        $seconds = (int) round((float) $value * 86400);

        return $this->builder->whereRaw(Order::STATUS_SINCE_SQL.' > ?', [now()->subSeconds($seconds)]);
    }

    /** ?due=2026-11-09 (still being worked on, due that Manila day) or ?due=overdue */
    public function due($value)
    {
        $working = [
            OrderStatus::idFor('received'), OrderStatus::idFor('washing'),
            OrderStatus::idFor('drying'), OrderStatus::idFor('folding'),
        ];
        $this->builder->whereIn('orders.current_status_id', $working);

        if ($value === 'overdue') {
            return $this->builder->where('orders.promised_at', '<', now());
        }

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return $this->builder->whereRaw('1 = 0');
        }

        $this->builder->where('orders.promised_at', '>=', now());
        $this->dateRange('orders.promised_at', $value);

        return $this->builder;
    }
}
