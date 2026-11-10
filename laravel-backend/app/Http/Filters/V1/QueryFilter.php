<?php

namespace App\Http\Filters\V1;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Base class for every filter (course L12, L14). It turns query-string parameters into query
 * conditions: ?status=received calls the status('received') method of the child filter class.
 */
abstract class QueryFilter
{
    // The Eloquent query being built (set in apply())
    protected Builder $builder;

    // The incoming request, which holds the query-string parameters
    protected Request $request;

    // Columns the client may sort by. Child classes fill this in.
    // 'receivedAt' => 'received_at' maps a public name to a real column.
    protected array $sortable = [];

    // The order used when the client sends no ?sort=.
    protected string $defaultSort = '';

    // Parameters this run ignores (see except()).
    protected array $skip = [];

    // Names that are never filters, whatever the child class defines.
    private const RESERVED = ['apply', 'except', 'page', 'perPage', 'per_page', 'include'];

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    /**
     * Loop over the query parameters and call the matching method (if it exists).
     * Parameters without a method are ignored.
     */
    public function apply(Builder $builder): Builder
    {
        $this->builder = $builder;
        $sorted = false;

        foreach ($this->request->query() as $key => $value) {
            // Skip internal names and names starting with __ so clients cannot call internal methods
            if (in_array($key, self::RESERVED, true) || in_array($key, $this->skip, true)
                || str_starts_with($key, '__') || ! method_exists($this, $key)
                || ! (new \ReflectionMethod($this, $key))->isPublic() && $key !== 'sort') {
                continue;
            }

            // Arrays (?status[]=a) are not part of the format; empty values filter nothing.
            if (! is_string($value) || trim($value) === '') {
                continue;
            }

            $this->$key(trim($value));
            $sorted = $sorted || $key === 'sort';
        }

        if (! $sorted && $this->defaultSort !== '') {
            $this->sort($this->defaultSort);
        }

        return $builder;
    }

    /** The same filter without some parameters, for counts that must ignore them. */
    public function except(string ...$keys): static
    {
        $copy = clone $this;
        $copy->skip = array_merge($this->skip, $keys);

        return $copy;
    }

    /**
     * ?sort=name              ascending
     * ?sort=-receivedAt       descending (leading minus)
     * ?sort=status,name       several columns, in order
     */
    protected function sort($value): void
    {
        $sortAttributes = explode(',', $value);

        foreach ($sortAttributes as $sortAttribute) {
            $direction = 'asc';

            // A leading minus means descending order
            if (str_starts_with($sortAttribute, '-')) {
                $direction = 'desc';
                $sortAttribute = substr($sortAttribute, 1);
            }

            // Ignore anything that is not on the whitelist
            if (! in_array($sortAttribute, $this->sortable, true)
                && ! array_key_exists($sortAttribute, $this->sortable)) {
                continue;
            }

            // Translate the public name (receivedAt) to the real column (received_at)
            $columnName = $this->sortable[$sortAttribute] ?? $sortAttribute;

            $this->builder->orderBy($columnName, $direction);
        }
    }

    /** "*pha*" -> "%pha%"; text without a wildcard matches anywhere. */
    protected function likeValue(string $value): string
    {
        $escaped = addcslashes($value, '%_\\');

        return str_contains($value, '*') ? str_replace('*', '%', $escaped) : "%{$escaped}%";
    }

    /**
     * ?receivedAt=2026-11-08 (one Manila day) or ?receivedAt=2026-11-01,2026-11-08 (inclusive).
     * The database session runs at +08:00, so DATE(column) is the Manila day.
     */
    protected function dateRange(string $column, string $value): void
    {
        $dates = array_values(array_filter(explode(',', $value), fn ($d) => preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)));

        if (count($dates) === 0) {
            return;
        }

        $from = $dates[0];
        $to = $dates[1] ?? $dates[0];

        // Whole days, inclusive at both ends, using the index on the column.
        $this->builder->where($column, '>=', $from.' 00:00:00')
            ->where($column, '<', date('Y-m-d', strtotime($to.' +1 day')).' 00:00:00');
    }

    /** A comma list of values. */
    protected function list(string $value): array
    {
        return array_values(array_filter(array_map('trim', explode(',', $value)), fn ($v) => $v !== ''));
    }
}
