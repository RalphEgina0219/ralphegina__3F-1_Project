<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** The shop profile: a single row with id 1. */
#[Fillable(['id', 'name', 'address', 'contact_number', 'opening_hours', 'receipt_footer', 'claim_policy_days'])]
class ShopSetting extends Model
{
    public $incrementing = false;

    protected function casts(): array
    {
        return ['claim_policy_days' => 'integer'];
    }

    public static function current(): self
    {
        return static::query()->findOrFail(1);
    }
}
