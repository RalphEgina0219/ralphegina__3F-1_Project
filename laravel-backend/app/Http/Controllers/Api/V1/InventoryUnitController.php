<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\UnitResource;
use App\Models\InventoryItem;
use App\Models\Unit;

/**
 * @group Inventory
 */
class InventoryUnitController extends APIController
{
    /** List units */
    public function index()
    {
        if (! $this->isAble('viewAny', InventoryItem::class)) {
            return $this->notAuthorized('You are not authorized to view inventory.');
        }

        return UnitResource::collection(Unit::query()->orderBy('id')->get());
    }
}
