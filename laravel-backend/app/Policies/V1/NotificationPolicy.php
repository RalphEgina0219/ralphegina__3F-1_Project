<?php

namespace App\Policies\V1;

use App\Models\Notification;
use App\Models\User;
use App\Permissions\V1\Abilities;

/** The staff bell: every active staff member. Customer notices are never reachable here. */
class NotificationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::DashboardView);
    }

    public function markRead(User $user, Notification $notification): bool
    {
        return $notification->recipient_type === Notification::STAFF
            && $user->tokenCan(Abilities::DashboardView);
    }
}
