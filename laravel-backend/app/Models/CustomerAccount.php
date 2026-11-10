<?php

namespace App\Models;

use App\Permissions\V1\Abilities;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

/**
 * A customer's sign-in for the portal, 1:1 with customers. It signs in with an email through the
 * "customer" JWT guard, which is separate from the staff guard.
 */
#[Fillable(['customer_id', 'email', 'password', 'is_active', 'must_change_password', 'last_login_at'])]
#[Hidden(['password'])]
class CustomerAccount extends Authenticatable implements JWTSubject
{
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /** Emails are unique case-insensitively, so they are always stored lower-case. */
    protected function email(): Attribute
    {
        return Attribute::make(set: fn (string $value) => mb_strtolower(trim($value)));
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'guard' => 'customer',
            'abilities' => Abilities::getAbilities($this),
        ];
    }

    /** The customer counterpart of User::tokenCan(). */
    public function tokenCan(string $ability): bool
    {
        try {
            $claimed = auth('customer')->payload()->get('abilities') ?? [];
        } catch (\Throwable) {
            return false;
        }

        return in_array($ability, $claimed, true)
            && in_array($ability, Abilities::getAbilities($this), true);
    }
}
