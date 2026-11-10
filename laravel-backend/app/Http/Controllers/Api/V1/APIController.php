<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponses;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * Base class for the version 1 API controllers. Shared helpers live here (course L11, L15, L19).
 */
class APIController extends Controller
{
    // Gives every controller that extends this class the ok(), success() and error() helpers
    use ApiResponses, AuthorizesRequests;

    /** The list size when the client does not ask for one (course: paginate() = 15). */
    protected int $perPage = 15;

    /**
     * Returns true when the client asked for a relationship with ?include=...
     * Example: /orders?include=customer  ->  include('customer') is true.
     */
    public function include(string $relationship): bool
    {
        // Read the "include" query parameter (null when it is not in the URL)
        $param = request()->get('include');

        if (! isset($param) || ! is_string($param)) {
            return false;
        }

        // ?include=customer,items  ->  ['customer', 'items']
        $includeValues = explode(',', strtolower($param));

        return in_array(strtolower($relationship), $includeValues);
    }

    /**
     * The relationships asked for with ?include=, limited to an allowed list
     * (relationship name in the URL => Eloquent relation to load).
     *
     * @param  array<string, string|array<int|string, mixed>>  $allowed
     * @return array<int|string, mixed>
     */
    protected function includes(array $allowed): array
    {
        $with = [];
        foreach ($allowed as $name => $relation) {
            if ($this->include($name)) {
                if (is_array($relation)) {
                    $with = array_merge($with, $relation);
                } else {
                    $with[] = $relation;
                }
            }
        }

        return $with;
    }

    /**
     * Asks the policy whether the logged-in user may do $ability on $target.
     * Returns true or false instead of throwing an exception.
     *
     * Example: isAble('update', $order) calls OrderPolicy::update()
     */
    public function isAble(string $ability, mixed $target = []): bool
    {
        try {
            // authorize() throws AuthorizationException when the policy says no
            $this->authorize($ability, $target);

            return true;
        } catch (AuthorizationException $e) {
            return false;
        }
    }

    /** ?perPage=, between 1 and 500 (the order board asks for every active order at once). */
    protected function perPage(?int $default = null): int
    {
        $requested = (int) request()->query('perPage', request()->query('per_page', 0));

        return $requested > 0 ? min($requested, 500) : ($default ?? $this->perPage);
    }
}
