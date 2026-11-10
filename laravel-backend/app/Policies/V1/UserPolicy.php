<?php

namespace App\Policies\V1;

use App\Models\User;
use App\Permissions\V1\Abilities;

/**
 * Managing staff accounts (course L23). $model is the user being managed; $user is the logged-in
 * user asking. Only the owner (settings.manage) passes.
 */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    public function view(User $user, User $model): bool
    {
        return $user->id === $model->id || $user->tokenCan(Abilities::SettingsManage);
    }

    public function store(User $user): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    public function replace(User $user, User $model): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    public function update(User $user, User $model): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    public function disable(User $user, User $model): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    public function resetPassword(User $user, User $model): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }

    /** The staff permission toggles. */
    public function managePermissions(User $user): bool
    {
        return $user->tokenCan(Abilities::SettingsManage);
    }
}
