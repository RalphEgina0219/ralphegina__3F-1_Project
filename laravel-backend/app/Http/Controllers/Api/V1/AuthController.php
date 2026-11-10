<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ChangePasswordRequest;
use App\Http\Requests\Api\LoginUserRequest;
use App\Http\Resources\V1\UserResource;
use App\Models\User;
use App\Support\AccountRules;
use App\Support\Audit;
use App\Traits\ApiResponses;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;

/**
 * @group Authentication
 *
 * Staff sign-in with JWT (course L8): log in, read the current user, refresh and log out.
 * Staff accounts are created by the owner in Settings, so there is no public registration.
 */
class AuthController extends Controller
{
    // Gives this controller the ok(), success() and error() response helpers
    use ApiResponses;

    /**
     * Log in
     *
     * Returns an access token. Send it as a Bearer token on every other request. Five failed
     * attempts a minute for the same username and IP answer 429.
     *
     * @unauthenticated
     */
    public function login(LoginUserRequest $request)
    {
        $username = mb_strtolower(trim($request->string('username')));
        $key = 'login:staff:'.$username.'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, AccountRules::LOGIN_ATTEMPTS_PER_MINUTE)) {
            return $this->error('Too many sign-in attempts. Please wait a minute and try again.', 429);
        }

        $credentials = ['username' => $username, 'password' => $request->string('password')->toString()];

        // attempt() returns false when the username or password is wrong
        if (! $token = Auth::guard('api')->attempt($credentials)) {
            RateLimiter::hit($key, 60);

            return $this->error('Invalid credentials', 401);
        }

        /** @var User $user */
        $user = Auth::guard('api')->user();

        if (! $user->is_active) {
            Auth::guard('api')->invalidate(true);

            return $this->error('This account is disabled. Please ask the shop owner.', 403);
        }

        RateLimiter::clear($key);
        $user->forceFill(['last_login_at' => now()])->save();
        Audit::record($user->id, 'auth.login', 'user', $user->id);

        return $this->ok('Login successful', $this->formatToken($token, $user));
    }

    /**
     * Current user
     *
     * Returns the staff member who owns the Bearer token, with their role and permissions.
     */
    public function me()
    {
        return $this->ok('User retrieved', ['user' => new UserResource(Auth::guard('api')->user())]);
    }

    /**
     * Refresh the token
     *
     * Blacklists the current token (an expired one is accepted within JWT_REFRESH_TTL) and returns
     * a new one carrying the user's current abilities.
     */
    public function refresh()
    {
        $guard = Auth::guard('api');

        // refresh() blacklists the old token; the new one still has the old claims...
        $rotated = $guard->refresh();
        $user = $guard->setToken($rotated)->user();

        if (! $user instanceof User || ! $user->is_active) {
            $guard->invalidate(true);

            return $this->error('Unauthenticated', 401);
        }

        // ...so log in again to write today's abilities into the token, and drop the rotated one.
        $token = $guard->login($user);
        $guard->setToken($rotated)->invalidate(true);
        $guard->setToken($token);

        return $this->ok('Token refreshed', $this->formatToken($token, $user));
    }

    /**
     * Log out
     *
     * Blacklists the current token so it can never be used again.
     */
    public function logout()
    {
        $user = Auth::guard('api')->user();
        Auth::guard('api')->logout(true);
        if ($user) {
            Audit::record($user->id, 'auth.logout', 'user', $user->id);
        }

        return $this->ok('Successfully logged out', null);
    }

    /**
     * Change my password
     *
     * Also allowed while a password change is pending.
     */
    public function password(ChangePasswordRequest $request)
    {
        /** @var User $user */
        $user = Auth::guard('api')->user();
        $user->forceFill([
            'password' => $request->string('password')->toString(),
            'must_change_password' => false,
        ])->save();
        Audit::record($user->id, 'user.password_changed', 'user', $user->id, ['username' => $user->username]);

        return $this->ok('Password changed', ['user' => new UserResource($user)]);
    }

    /**
     * The token in OAuth 2.0 style (L8), plus the signed-in user so the app needs no second call.
     */
    protected function formatToken(string $token, User $user): array
    {
        return [
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
            'user' => new UserResource($user),
        ];
    }
}
