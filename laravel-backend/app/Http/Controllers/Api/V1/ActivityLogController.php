<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Filters\V1\AuditLogFilter;
use App\Http\Resources\V1\ActivityLogResource;
use App\Models\AuditLog;

/**
 * @group Settings
 */
class ActivityLogController extends APIController
{
    protected int $perPage = 20;

    /**
     * Activity log
     *
     * Who did what, newest first, with a readable summary and the values before and after.
     *
     * @queryParam user integer One staff member. Example: 2
     * @queryParam entity string order, payment, customer, basket, service, inventory_item, user, role, shop_settings. Example: order
     * @queryParam action string Text in the action or its values. Example: LF-26
     * @queryParam createdAt string A Manila day, or from,to. Example: 2026-11-01,2026-11-08
     */
    public function index(AuditLogFilter $filters)
    {
        if (! $this->isAble('viewAny', AuditLog::class)) {
            return $this->notAuthorized('You are not authorized to view the activity log.');
        }

        return ActivityLogResource::collection(
            AuditLog::query()->with('user.role')->filter($filters)->orderByDesc('id')->paginate($this->perPage())
        );
    }
}
