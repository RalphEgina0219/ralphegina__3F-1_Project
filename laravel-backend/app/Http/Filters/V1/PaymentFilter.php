<?php

namespace App\Http\Filters\V1;

use App\Models\PaymentMethod;

/**
 * The filters allowed on GET /payments.
 */
class PaymentFilter extends QueryFilter
{
    protected array $sortable = [
        'paidAt' => 'paid_at',
        'amountCents' => 'amount_cents',
        'receiptNumber' => 'receipt_number',
    ];

    protected string $defaultSort = '-paidAt';

    /** ?paidAt=2026-11-08  or  ?paidAt=2026-11-01,2026-11-08  (Manila days, inclusive) */
    public function paidAt($value)
    {
        $this->dateRange('payments.paid_at', $value);

        return $this->builder;
    }

    /** ?method=cash|gcash|maya */
    public function method($value)
    {
        $ids = PaymentMethod::query()->whereIn('code', $this->list($value))->pluck('id');

        return $this->builder->whereIn('payments.payment_method_id', $ids);
    }

    /** ?search=OR-000245  (receipt number, order number or customer name) */
    public function search($value)
    {
        $like = $this->likeValue(mb_strtolower($value));

        return $this->builder->where(function ($query) use ($like) {
            $query->where('payments.receipt_number', 'like', $like)
                ->orWhereHas('order', fn ($q) => $q->where('order_number', 'like', $like)
                    ->orWhereHas('customer', fn ($c) => $c->where('full_name', 'like', $like)));
        });
    }

    /** ?voided=true|false */
    public function voided($value)
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN)
            ? $this->builder->whereNotNull('payments.voided_at')
            : $this->builder->whereNull('payments.voided_at');
    }
}
