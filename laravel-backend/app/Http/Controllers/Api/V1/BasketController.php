<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\V1\Baskets;
use App\Http\Filters\V1\BasketFilter;
use App\Http\Requests\Api\V1\ReplaceBasketRequest;
use App\Http\Requests\Api\V1\StoreBasketRequest;
use App\Http\Requests\Api\V1\UpdateBasketRequest;
use App\Http\Resources\V1\BasketAssignmentResource;
use App\Http\Resources\V1\BasketResource;
use App\Models\Basket;
use Illuminate\Support\Facades\DB;

/**
 * @group Baskets
 *
 * The reusable QR baskets. Each label is permanent; a lost basket is retired, never deleted.
 */
class BasketController extends APIController
{
    protected int $perPage = 20;

    /**
     * List baskets
     *
     * By number. `meta.counts` has the number of baskets in each status.
     *
     * @queryParam status string available, in_use or retired. Example: available
     * @queryParam search string Basket number, label or the order it holds. Example: 0007
     * @queryParam sort string basketNumber, status or createdAt. Example: basketNumber
     * @queryParam page integer The page number. Example: 1
     */
    public function index(BasketFilter $filters)
    {
        if (! $this->isAble('viewAny', Basket::class)) {
            return $this->notAuthorized('You are not authorized to view baskets.');
        }

        $counts = ['available' => 0, 'in_use' => 0, 'retired' => 0];
        foreach (Basket::query()->select('status', DB::raw('COUNT(*) AS total'))->groupBy('status')->pluck('total', 'status') as $status => $total) {
            $counts[$status] = (int) $total;
        }

        return BasketResource::collection(
            Basket::query()->withUsage()->filter($filters)->paginate($this->perPage())
        )->additional(['meta' => ['counts' => $counts]]);
    }

    /**
     * Add baskets
     *
     * 1 to 100 at a time. Numbers continue after the highest ever issued; each basket gets its own
     * permanent 32-character QR token.
     */
    public function store(StoreBasketRequest $request, Baskets $baskets)
    {
        if (! $this->isAble('store', Basket::class)) {
            return $this->notAuthorized('You are not authorized to create that resource.');
        }

        $created = $baskets->create($request->user(), $request->count(), $request->nullableText('data.attributes.label'));

        return BasketResource::collection(
            Basket::query()->withUsage()->whereIn('id', $created->pluck('id'))->orderBy('id')->get()
        )->response()->setStatusCode(201);
    }

    /** List the baskets free for a new order */
    public function available()
    {
        if (! $this->isAble('viewAny', Basket::class)) {
            return $this->notAuthorized('You are not authorized to view baskets.');
        }

        return BasketResource::collection(
            Basket::query()->withUsage()->where('status', 'available')->whereDoesntHave('activeAssignment')->orderBy('basket_number')->get()
        );
    }

    /** Show a basket */
    public function show(Basket $basket)
    {
        if (! $this->isAble('view', $basket)) {
            return $this->notAuthorized('You are not authorized to view that resource.');
        }

        return new BasketResource($this->load($basket));
    }

    /** Replace a basket's label and notes */
    public function replace(ReplaceBasketRequest $request, Basket $basket, Baskets $baskets)
    {
        if (! $this->isAble('replace', $basket)) {
            return $this->notAuthorized('You are not authorized to replace that resource.');
        }

        return new BasketResource($this->load($baskets->update($request->user(), $basket, $request->basketAttributes())));
    }

    /** Update a basket's label or notes */
    public function update(UpdateBasketRequest $request, Basket $basket, Baskets $baskets)
    {
        if (! $this->isAble('update', $basket)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        return new BasketResource($this->load($baskets->update($request->user(), $basket, $request->basketAttributes())));
    }

    /**
     * Retire a basket
     *
     * For a lost or broken basket: kept with its history, its number never reused.
     * 409 while it holds an order or when already retired.
     *
     * @bodyParam data.attributes.reason string Why it is retired. Example: Cracked handle, replaced
     */
    public function retire(Basket $basket, Baskets $baskets)
    {
        if (! $this->isAble('retire', $basket)) {
            return $this->notAuthorized('You are not authorized to retire baskets.');
        }

        request()->validate(
            ['data.attributes.reason' => ['sometimes', 'nullable', 'string', 'max:255']],
            ['data.attributes.reason.max' => 'Keep the reason under 255 characters.'],
        );
        $reason = request()->input('data.attributes.reason');
        $reason = is_string($reason) && trim($reason) !== '' ? trim($reason) : null;

        return new BasketResource($this->load($baskets->retire(request()->user(), $basket, $reason)));
    }

    /**
     * A basket's history
     *
     * Every order it held, newest first, 10 per page.
     */
    public function history(Basket $basket)
    {
        if (! $this->isAble('view', $basket)) {
            return $this->notAuthorized('You are not authorized to view that resource.');
        }

        return BasketAssignmentResource::collection(
            $basket->assignments()
                ->with(['order:id,order_number,customer_id', 'order.customer:id,full_name', 'assignedBy.role'])
                ->orderByDesc('assigned_at')->orderByDesc('id')
                ->paginate($this->perPage(10))
        );
    }

    private function load(Basket $basket): Basket
    {
        return Basket::query()->withUsage()->findOrFail($basket->id);
    }
}
