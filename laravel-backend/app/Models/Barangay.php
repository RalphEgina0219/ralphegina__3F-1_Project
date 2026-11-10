<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One of the 36 barangays of Bongabong, Oriental Mindoro. */
#[Fillable(['name'])]
#[WithoutTimestamps]
class Barangay extends Model
{
    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }
}
