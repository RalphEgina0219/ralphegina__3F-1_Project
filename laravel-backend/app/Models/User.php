<?php

namespace App\Models;

use App\Models\Concerns\HasQueryFilter;
use App\Permissions\V1\Abilities;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

/**
 * A staff account (the owner or laundry staff). Signs in with a username through the "api" JWT guard.
 */
#[Fillable(['role_id', 'name', 'username', 'password', 'is_active', 'must_change_password', 'last_login_at'])]
#[Hidden(['password'])]
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasQueryFilter;

    /** Live abilities, worked out once per request. */
    private ?array $liveAbilities = null;

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function roleName(): string
    {
        return $this->role?->name ?? 'staff';
    }

    public function isAdmin(): bool
    {
        return $this->roleName() === 'admin';
    }

    /**
     * The permission codes of this user's role. Admins hold every code.
     *
     * @return list<string>
     */
    public function permissionCodes(): array
    {
        if ($this->isAdmin()) {
            return Permission::query()->orderBy('id')->pluck('code')->all();
        }

        return $this->role?->permissions()->orderBy('permissions.id')->pluck('code')->all() ?? [];
    }

    /** The value stored inside the token to identify the user (L8). */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Extra claims: which guard the token belongs to and the user's abilities (L20).
     * Anyone can read these on jwt.io, so nothing secret goes here.
     */
    public function getJWTCustomClaims()
    {
        return [
            'guard' => 'staff',
            'abilities' => Abilities::getAbilities($this),
        ];
    }

    /**
     * Checks an ability stored in the current JWT, for example 'orders.manage' (L20).
     *
     * The claim is an upper bound: the ability must also still be granted right now, so turning a
     * permission off, demoting an admin or disabling an account takes effect immediately rather
     * than when the token expires (least privilege, L24).
     */
    public function tokenCan(string $ability): bool
    {
        try {
            $claimed = auth('api')->payload()->get('abilities') ?? [];
        } catch (\Throwable) {
            // No token, or an unreadable one: no abilities.
            return false;
        }

        return in_array($ability, $claimed, true) && $this->currentlyCan($ability);
    }

    /** The ability as granted now by the database, without looking at a token. */
    public function currentlyCan(string $ability): bool
    {
        $this->liveAbilities ??= Abilities::getAbilities($this);

        return in_array($ability, $this->liveAbilities, true);
    }

    /** Clears the remembered abilities, for example after the staff permissions change. */
    public function forgetAbilities(): void
    {
        $this->liveAbilities = null;
    }
}
