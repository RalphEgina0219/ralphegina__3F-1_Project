<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;

/** cash, gcash or maya. */
#[Fillable(['code', 'label', 'is_active', 'display_label'])]
#[WithoutTimestamps]
class PaymentMethod extends Model
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** The name the shop gave it, or its label. */
    public function shownLabel(): string
    {
        return $this->display_label ?: $this->label;
    }

    /** @return list<string> codes of the methods that are turned on */
    public static function activeCodes(): array
    {
        return static::query()->where('is_active', true)->pluck('code')->all();
    }

    public static function idFor(string $code): int
    {
        return (int) static::query()->where('code', $code)->value('id');
    }
}
