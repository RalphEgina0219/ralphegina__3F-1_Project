<?php

namespace App\Http\Filters\V1;

/**
 * The filters allowed on GET /customers.
 */
class CustomerFilter extends QueryFilter
{
    protected array $sortable = [
        'fullName' => 'full_name',
        'createdAt' => 'created_at',
        'lastVisitAt' => 'last_visit_at',
    ];

    // Most recent visit first, as at the counter.
    protected string $defaultSort = '-lastVisitAt';

    /** ?search=maria  (name, account email, or the digits of the phone number) */
    public function search($value)
    {
        $needle = mb_strtolower($value);
        $digits = preg_replace('/\D/', '', $value);

        return $this->builder->where(function ($query) use ($needle, $digits) {
            $query->where('customers.full_name', 'like', $this->likeValue($needle))
                ->orWhereHas('account', fn ($q) => $q->where('email', 'like', $this->likeValue($needle)));
            if ($digits !== '') {
                $query->orWhere('customers.contact_number', 'like', "%{$digits}%");
            }
        });
    }

    /** ?fullName=*santos* */
    public function fullName($value)
    {
        return $this->builder->where('customers.full_name', 'like', $this->likeValue($value));
    }

    /** ?barangay=28,12 */
    public function barangay($value)
    {
        return $this->builder->whereIn('customers.barangay_id', $this->list($value));
    }

    /** ?hasAccount=true|false */
    public function hasAccount($value)
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN)
            ? $this->builder->whereHas('account')
            : $this->builder->whereDoesntHave('account');
    }

    /** ?createdAt=2026-11-01,2026-11-08 */
    public function createdAt($value)
    {
        $this->dateRange('customers.created_at', $value);

        return $this->builder;
    }
}
