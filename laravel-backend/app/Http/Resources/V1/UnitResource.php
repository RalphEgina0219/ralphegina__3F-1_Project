<?php

namespace App\Http\Resources\V1;

use App\Models\Unit;
use Illuminate\Http\Request;

/** @mixin Unit */
class UnitResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return [
            'type' => 'unit',
            'id' => $this->id,
            'attributes' => [
                'code' => $this->code,
                'label' => $this->label,
            ],
        ];
    }
}
