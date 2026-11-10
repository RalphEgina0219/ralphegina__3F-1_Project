<?php

namespace App\Http\Resources\V1;

use App\Models\OrderStatus;
use App\Models\OrderStatusHistory;
use Illuminate\Http\Request;

/** @mixin OrderStatusHistory */
class StatusHistoryResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return $this->withIncludes([
            'type' => 'statusChange',
            'id' => $this->id,
            'attributes' => [
                'fromStatus' => OrderStatus::codeFor($this->from_status_id),
                'toStatus' => OrderStatus::codeFor($this->to_status_id),
                'note' => $this->note,
                'changedAt' => $this->iso($this->changed_at),
            ],
        ], [
            'changedBy' => $this->loadedOne('changedBy', UserResource::class),
        ]);
    }
}
