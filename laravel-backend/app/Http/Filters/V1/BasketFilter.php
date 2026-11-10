<?php

namespace App\Http\Filters\V1;

/**
 * The filters allowed on GET /baskets.
 */
class BasketFilter extends QueryFilter
{
    protected array $sortable = [
        'basketNumber' => 'basket_number',
        'status' => 'status',
        'createdAt' => 'created_at',
    ];

    protected string $defaultSort = 'basketNumber';

    /** ?status=available,in_use */
    public function status($value)
    {
        return $this->builder->whereIn('baskets.status', $this->list($value));
    }

    /** ?search=0007  (basket number, label, or the order it holds) */
    public function search($value)
    {
        $like = $this->likeValue(mb_strtolower($value));

        return $this->builder->where(function ($query) use ($like) {
            $query->where('baskets.basket_number', 'like', $like)
                ->orWhere('baskets.label', 'like', $like)
                ->orWhereHas('activeAssignment.order', fn ($q) => $q->where('order_number', 'like', $like));
        });
    }

    /** ?label=*blue* */
    public function label($value)
    {
        return $this->builder->where('baskets.label', 'like', $this->likeValue($value));
    }
}
