<?php

namespace App\Http\Resources\V1;

use App\Support\Iso;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\MissingValue;

/**
 * Shared helpers for the version 1 resources. Every resource has the course's JSON:API shape
 * (L9–L11): type, id, attributes (camelCase), relationships, includes and links.
 */
abstract class ApiResource extends JsonResource
{
    /** A timestamp as an ISO-8601 UTC string, or null. */
    protected function iso(mixed $value): ?string
    {
        return Iso::format($value);
    }

    /**
     * A relationship entry: { data: { type, id }, links: { self } }.
     *
     * @return array<string, mixed>|null
     */
    protected function ref(string $type, mixed $id, ?string $route = null, array $parameters = []): ?array
    {
        if ($id === null) {
            return ['data' => null];
        }

        $entry = ['data' => ['type' => $type, 'id' => (int) $id]];
        if ($route !== null) {
            $entry['links'] = ['self' => route($route, $parameters ?: [(int) $id])];
        }

        return $entry;
    }

    /**
     * A loaded belongs-to relation as a resource, null when the foreign key is null, and absent
     * when the relation was not loaded (course L11: whenLoaded()).
     *
     * @param  class-string<JsonResource>  $resource
     */
    protected function loadedOne(string $relation, string $resource): mixed
    {
        if (! $this->resource->relationLoaded($relation)) {
            return new MissingValue;
        }

        $model = $this->resource->getRelation($relation);

        return $model ? new $resource($model) : null;
    }

    /**
     * A loaded has-many relation as a resource collection, absent when not loaded.
     *
     * @param  class-string<JsonResource>  $resource
     */
    protected function loadedMany(string $relation, string $resource): mixed
    {
        if (! $this->resource->relationLoaded($relation)) {
            return new MissingValue;
        }

        return $resource::collection($this->resource->getRelation($relation));
    }

    /** Drops empty includes, so the key is absent unless something was asked for. */
    protected function withIncludes(array $data, array $includes): array
    {
        $includes = array_filter($includes, fn ($value) => ! $value instanceof MissingValue);
        if ($includes !== []) {
            $data['includes'] = $includes;
        }

        return $data;
    }
}
