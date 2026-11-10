<?php

namespace App\Policies\V1;

use App\Models\User;
use App\Permissions\V1\Abilities;

/** The activity log is the owner's. Nobody can change or delete it through the API. */
class AuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }
}
