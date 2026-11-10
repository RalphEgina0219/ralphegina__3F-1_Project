<?php

namespace App\Models\Concerns;

use App\Http\Filters\V1\QueryFilter;
use Illuminate\Database\Eloquent\Builder;

/**
 * The course's filter scope (L12, L14), shared by every model with a filtered list:
 * Model::filter($filters) applies the filters sent in the URL.
 */
trait HasQueryFilter
{
    public function scopeFilter(Builder $builder, QueryFilter $filters): Builder
    {
        return $filters->apply($builder);
    }
}
