<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponses;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs after auth:api or auth:customer.
 *
 * - A disabled account answers 401 even with a token that has not expired yet, so disabling an
 *   account signs it out everywhere at once.
 * - While must_change_password is set, every route except the ones named in $allowed answers 403
 *   (change password, me and logout).
 */
class EnsureAccountIsUsable
{
    use ApiResponses;

    /** Route names that stay open while a password change is pending. */
    private const ALLOWED_WHILE_PENDING = [
        'auth.me',
        'auth.logout',
        'auth.refresh',
        'auth.password',
        'customer.auth.me',
        'customer.auth.logout',
        'customer.auth.refresh',
        'customer.account.password',
    ];

    public function handle(Request $request, Closure $next, string $guard): Response
    {
        $account = auth($guard)->user();

        if (! $account || ! $account->is_active) {
            return $this->error([[
                'status' => 401,
                'message' => 'Unauthenticated',
                'source' => '',
            ]]);
        }

        if ($account->must_change_password && ! $request->routeIs(...self::ALLOWED_WHILE_PENDING)) {
            return $this->error([[
                'status' => 403,
                'message' => 'Change your temporary password first.',
                'source' => 'mustChangePassword',
            ]]);
        }

        return $next($request);
    }
}
