<?php

namespace App\Http\Resources\V1;

use App\Models\Barangay;
use Illuminate\Http\Request;

/** @mixin Barangay */
class BarangayResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return [
            'type' => 'barangay',
            'id' => $this->id,
            'attributes' => [
                'name' => $this->name,
            ],
        ];
    }
}
