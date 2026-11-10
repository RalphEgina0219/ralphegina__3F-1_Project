<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\BaseInventoryItemRequest;
use App\Http\Requests\Api\V1\ReplaceInventoryItemRequest;
use App\Http\Requests\Api\V1\StoreInventoryItemRequest;
use App\Http\Requests\Api\V1\UpdateInventoryItemRequest;
use App\Http\Resources\V1\InventoryItemResource;
use App\Models\InventoryItem;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;

/**
 * @group Inventory
 *
 * Supply items. Stock on hand is computed from the movements, never typed in.
 */
class InventoryItemController extends APIController
{
    /**
     * List supply items
     *
     * Active items, Critical first, then Low, then OK.
     */
    public function index()
    {
        if (! $this->isAble('viewAny', InventoryItem::class)) {
            return $this->notAuthorized('You are not authorized to view inventory.');
        }

        $rank = ['critical' => 0, 'low' => 1, 'ok' => 2];
        $items = InventoryItem::query()->withOnHand()->where('is_active', true)->orderBy('id')->get()
            ->sortBy(fn (InventoryItem $item) => $rank[$item->stockStatus()], SORT_REGULAR)
            ->values();

        return InventoryItemResource::collection($items);
    }

    /** Add a supply item */
    public function store(StoreInventoryItemRequest $request)
    {
        if (! $this->isAble('store', InventoryItem::class)) {
            return $this->notAuthorized('You are not authorized to create that resource.');
        }

        $item = DB::transaction(function () use ($request) {
            $item = InventoryItem::query()->create($request->itemAttributes() + ['is_active' => true]);
            Audit::record($request->user()->id, 'inventory.item_created', 'inventory_item', $item->id, ['name' => $item->name]);

            return $item;
        });

        return (new InventoryItemResource($this->load($item)))->response()->setStatusCode(201);
    }

    /** Show a supply item */
    public function show(InventoryItem $item)
    {
        if (! $this->isAble('view', $item)) {
            return $this->notAuthorized('You are not authorized to view that resource.');
        }

        return new InventoryItemResource($this->load($item));
    }

    /** Replace a supply item (every field) */
    public function replace(ReplaceInventoryItemRequest $request, InventoryItem $item)
    {
        if (! $this->isAble('replace', $item)) {
            return $this->notAuthorized('You are not authorized to replace that resource.');
        }

        return new InventoryItemResource($this->load($this->save($request, $item)));
    }

    /** Update a supply item (fields sent) */
    public function update(UpdateInventoryItemRequest $request, InventoryItem $item)
    {
        if (! $this->isAble('update', $item)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        return new InventoryItemResource($this->load($this->save($request, $item)));
    }

    private function save(BaseInventoryItemRequest $request, InventoryItem $item): InventoryItem
    {
        return DB::transaction(function () use ($request, $item) {
            $before = ['name' => $item->name, 'reorder_level' => (float) $item->reorder_level];
            $item->update($request->itemAttributes());
            Audit::record($request->user()->id, 'inventory.item_updated', 'inventory_item', $item->id, [
                'name' => $item->name,
                'reorder_level' => (float) $item->reorder_level,
            ], $before);

            return $item;
        });
    }

    private function load(InventoryItem $item): InventoryItem
    {
        return InventoryItem::query()->withOnHand()->findOrFail($item->id);
    }
}
