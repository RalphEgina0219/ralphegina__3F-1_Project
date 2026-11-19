<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\V1\SaveWashType;
use App\Http\Requests\Api\V1\SaveWashTypeRequest;
use App\Http\Resources\V1\WashTypeResource;
use App\Models\ShopSetting;
use App\Models\WashType;
use Illuminate\Database\Eloquent\Builder;

/**
 * @group Wash types
 *
 * How the laundry is washed, with the optional surcharge per kilo and the soaps each one uses.
 * Staff read them to take orders; only the owner changes them (Settings > Pricing & Usage).
 * Changes apply to new orders only: an order freezes its wash type surcharge when it is made.
 */
class WashTypeController extends APIController
{
    /**
     * List wash types
     *
     * In the order they are shown (sortOrder). `meta.blockOrdersOnLowSoap` is the shop's stock rule.
     *
     * @queryParam active boolean Only active (1) or inactive (0) wash types. Example: 1
     */
    public function index()
    {
        if (! $this->isAble('viewAny', WashType::class)) {
            return $this->notAuthorized('You are not authorized to view wash types.');
        }

        $query = $this->query()->orderBy('sort_order')->orderBy('id');
        $active = request()->query('active');
        if (is_string($active) && $active !== '') {
            $query->where('is_active', in_array($active, ['1', 'true'], true));
        }

        return WashTypeResource::collection($query->get())->additional(['meta' => [
            'blockOrdersOnLowSoap' => (bool) ShopSetting::current()->block_orders_on_low_soap,
        ]]);
    }

    /** Add a wash type */
    public function store(SaveWashTypeRequest $request, SaveWashType $save)
    {
        if (! $this->isAble('store', WashType::class)) {
            return $this->notAuthorized('You are not authorized to create that resource.');
        }

        $washType = $save(null, $request->washTypeAttributes(), $request->supplyRows(), $request->user());

        return (new WashTypeResource($this->fresh($washType)))->response()->setStatusCode(201);
    }

    /** Show a wash type */
    public function show(WashType $washType)
    {
        if (! $this->isAble('view', $washType)) {
            return $this->notAuthorized('You are not authorized to view that resource.');
        }

        return new WashTypeResource($this->fresh($washType));
    }

    /** Replace a wash type (fields sent; `supplies` replaces the whole list) */
    public function replace(SaveWashTypeRequest $request, WashType $washType, SaveWashType $save)
    {
        if (! $this->isAble('replace', $washType)) {
            return $this->notAuthorized('You are not authorized to replace that resource.');
        }

        $save($washType, $request->washTypeAttributes(), $request->supplyRows(), $request->user());

        return new WashTypeResource($this->fresh($washType));
    }

    /** Update a wash type (fields sent) */
    public function update(SaveWashTypeRequest $request, WashType $washType, SaveWashType $save)
    {
        if (! $this->isAble('update', $washType)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        $save($washType, $request->washTypeAttributes(), $request->supplyRows(), $request->user());

        return new WashTypeResource($this->fresh($washType));
    }

    /** @return Builder<WashType> */
    private function query(): Builder
    {
        return WashType::query()->with(['supplies.item' => fn ($q) => $q->withOnHand()]);
    }

    private function fresh(WashType $washType): WashType
    {
        return $this->query()->findOrFail($washType->id);
    }
}
