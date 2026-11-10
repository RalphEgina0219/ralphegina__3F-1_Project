<?php

namespace App\Http\Filters\V1;

/**
 * The filters allowed on GET /activity-logs.
 */
class AuditLogFilter extends QueryFilter
{
    protected array $sortable = [
        'createdAt' => 'created_at',
    ];

    protected string $defaultSort = '-createdAt';

    /** ?user=2 */
    public function user($value)
    {
        return $this->builder->whereIn('audit_logs.user_id', $this->list($value));
    }

    /** ?entity=order  (the auditable type) */
    public function entity($value)
    {
        return $this->builder->whereIn('audit_logs.auditable_type', $this->list($value));
    }

    /** ?action=payment  (the action code, or text in the recorded values such as an order number) */
    public function action($value)
    {
        $like = $this->likeValue(mb_strtolower($value));

        return $this->builder->where(function ($query) use ($like) {
            $query->where('audit_logs.action', 'like', $like)
                ->orWhereRaw('LOWER(CAST(audit_logs.new_values AS CHAR)) LIKE ?', [$like]);
        });
    }

    /** ?createdAt=2026-11-01,2026-11-08  (Manila days, inclusive) */
    public function createdAt($value)
    {
        $this->dateRange('audit_logs.created_at', $value);

        return $this->builder;
    }
}
