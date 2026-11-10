<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** admin or staff. */
#[Fillable(['name'])]
#[WithoutTimestamps]
class Role extends Model
{
    public const ADMIN = 'admin';

    public const STAFF = 'staff';

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permission');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public static function idFor(string $name): int
    {
        return (int) static::query()->where('name', $name)->value('id');
    }
}
