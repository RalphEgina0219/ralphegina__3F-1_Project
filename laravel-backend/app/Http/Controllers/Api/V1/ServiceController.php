<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\BaseServiceRequest;
use App\Http\Requests\Api\V1\ReplaceServiceRequest;
use App\Http\Requests\Api\V1\StoreServiceRequest;
use App\Http\Requests\Api\V1\UpdateServiceRequest;
use App\Http\Resources\V1\ServiceResource;
use App\Models\Service;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;

/**
 * @group Services
 *
 * The price list. Changing a rate never changes old orders: their prices were frozen.
 */
class ServiceController extends APIController
{
    /**
     * List services
     *
     * @queryParam active boolean Only active (1) or inactive (0) services. Example: 1
     */
    public function index()
    {
        if (! $this->isAble('viewAny', Service::class)) {
            return $this->notAuthorized('You are not authorized to view services.');
        }

        $query = Service::query()->orderBy('id');
        $active = request()->query('active');
        if (is_string($active) && $active !== '') {
            $query->where('is_active', in_array($active, ['1', 'true'], true));
        }

        return ServiceResource::collection($query->get());
    }

    /** Add a service */
    public function store(StoreServiceRequest $request)
    {
        if (! $this->isAble('store', Service::class)) {
            return $this->notAuthorized('You are not authorized to create that resource.');
        }

        $service = DB::transaction(function () use ($request) {
            $service = Service::query()->create($request->serviceAttributes());
            Audit::record($request->user()->id, 'service.created', 'service', $service->id, ['name' => $service->name]);

            return $service;
        });

        return (new ServiceResource($service))->response()->setStatusCode(201);
    }

    /** Show a service */
    public function show(Service $service)
    {
        if (! $this->isAble('view', $service)) {
            return $this->notAuthorized('You are not authorized to view that resource.');
        }

        return new ServiceResource($service);
    }

    /** Replace a service (every field) */
    public function replace(ReplaceServiceRequest $request, Service $service)
    {
        if (! $this->isAble('replace', $service)) {
            return $this->notAuthorized('You are not authorized to replace that resource.');
        }

        return new ServiceResource($this->save($request, $service));
    }

    /** Update a service (fields sent) */
    public function update(UpdateServiceRequest $request, Service $service)
    {
        if (! $this->isAble('update', $service)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        return new ServiceResource($this->save($request, $service));
    }

    private function save(BaseServiceRequest $request, Service $service): Service
    {
        return DB::transaction(function () use ($request, $service) {
            $before = ['name' => $service->name, 'rate_cents' => $service->rate_cents, 'is_active' => $service->is_active];
            $previousRate = $service->rate_cents;
            $service->update($request->serviceAttributes($service));

            $values = ['name' => $service->name, 'rate_cents' => $service->rate_cents, 'is_active' => $service->is_active];
            if ($previousRate !== $service->rate_cents) {
                $values['summary'] = "updated rate {$service->name} ".self::rate($previousRate).' → '.self::rate($service->rate_cents);
            }
            Audit::record($request->user()->id, 'service.updated', 'service', $service->id, $values, $before);

            return $service;
        });
    }

    /** ₱35 or ₱35.50, as the activity log shows it (lib/money.ts formatRate). */
    private static function rate(int $cents): string
    {
        return '₱'.($cents % 100 === 0 ? number_format($cents / 100) : number_format($cents / 100, 2));
    }
}
