<?php

namespace App\Policies\V1;

use App\Models\ShopSetting;
use App\Models\User;
use App\Permissions\V1\Abilities;

/** The shop profile is the owner's. */
class ShopSettingPolicy
{
    public function view(User $user, ShopSetting $settings): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    public function replace(User $user, ShopSetting $settings): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }
}
