<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;

/** cash or gcash. */
#[Fillable(['code', 'label'])]
#[WithoutTimestamps]
class PaymentMethod extends Model
{
    public static function idFor(string $code): int
    {
        return (int) static::query()->where('code', $code)->value('id');
    }
}
