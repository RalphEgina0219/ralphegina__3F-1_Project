<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\V1\RecordStockMovement;
use App\Http\Requests\Api\V1\StoreInventoryMovementRequest;
use App\Http\Resources\V1\InventoryMovementResource;
use App\Models\InventoryMovement;

/**
 * @group Inventory
 */
class InventoryMovementController extends APIController
{
    protected int $perPage = 8;

    /**
     * List stock movements
     *
     * Newest first.
     *
     * @queryParam item integer One item's movements. Example: 1
     * @queryParam page integer The page number. Example: 1
     */
    public function index()
    {
        if (! $this->isAble('viewAny', InventoryMovement::class)) {
            return $this->notAuthorized('You are not authorized to view inventory.');
        }

        $query = InventoryMovement::query()->with(['item.unit', 'user.role'])->orderByDesc('moved_at')->orderByDesc('id');
        $item = request()->query('item', request()->query('item_id'));
        if (is_numeric($item)) {
            $query->where('item_id', (int) $item);
        }

        return InventoryMovementResource::collection($query->paginate($this->perPage()));
    }

    /**
     * Record a stock movement
     *
     * Stock-in and adjustments need inventory.manage (the owner); stock-out also works with
     * inventory.stock_out. A stock-out cannot exceed what is on hand.
     */
    public function store(StoreInventoryMovementRequest $request, RecordStockMovement $record)
    {
        $type = (string) $request->input('data.attributes.type');

        if (! $this->isAble('store', InventoryMovement::class)) {
            return $this->notAuthorized('You are not authorized to record stock movements.');
        }
        if (! $this->isAble('storeType', [InventoryMovement::class, $type])) {
            return $this->notAuthorized('Only an administrator can record stock-in or adjustments.');
        }

        $movement = $record(
            $request->relationshipId('item'),
            $type,
            (float) $request->input('data.attributes.quantity'),
            $request->nullableText('data.attributes.remarks'),
            $request->user(),
        );

        return (new InventoryMovementResource($movement->load(['item.unit', 'user.role'])))->response()->setStatusCode(201);
    }
}
