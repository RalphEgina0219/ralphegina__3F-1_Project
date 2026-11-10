<?php

namespace App\Http\Controllers\Api\V1\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ChangePasswordRequest;
use App\Http\Requests\Api\LoginCustomerRequest;
use App\Http\Requests\Api\RegisterCustomerRequest;
use App\Http\Resources\V1\CustomerSelfResource;
use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Support\AccountRules;
use App\Support\Audit;
use App\Traits\ApiResponses;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

/**
 * @group Customer portal: authentication
 *
 * The customer guard (JWT), entirely separate from staff sign-in: a customer token is rejected by
 * every staff route, and a staff token by every customer route.
 */
class CustomerAuthController extends Controller
{
    use ApiResponses;

    /**
     * Register
     *
     * Creates the customer profile and its account in one transaction and signs the customer in.
     *
     * @unauthenticated
     */
    public function register(RegisterCustomerRequest $request)
    {
        $account = DB::transaction(function () use ($request) {
            $customer = Customer::query()->create([
                'full_name' => $request->input('full_name'),
                'contact_number' => $request->input('contact_number'),
                'barangay_id' => $request->integer('barangay_id'),
                'street_address' => $request->input('street_address'),
            ]);

            $account = CustomerAccount::query()->create([
                'customer_id' => $customer->id,
                'email' => $request->input('email'),
                'password' => $request->string('password')->toString(),
                'is_active' => true,
                'must_change_password' => false,
                'last_login_at' => now(),
            ]);

            Audit::record(null, 'customer.registered', 'customer', $customer->id, ['full_name' => $customer->full_name]);

            return $account;
        });

        $token = Auth::guard('customer')->login($account);

        return $this->ok('Registered successfully', $this->formatToken($token, $account));
    }

    /**
     * Log in
     *
     * Five failed attempts a minute for the same email and IP answer 429.
     *
     * @unauthenticated
     */
    public function login(LoginCustomerRequest $request)
    {
        $email = $request->string('email')->toString();
        $key = 'login:customer:'.$email.'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, AccountRules::LOGIN_ATTEMPTS_PER_MINUTE)) {
            return $this->error('Too many sign-in attempts. Please wait a minute and try again.', 429);
        }

        if (! $token = Auth::guard('customer')->attempt(['email' => $email, 'password' => $request->string('password')->toString()])) {
            RateLimiter::hit($key, 60);

            return $this->error('Invalid credentials', 401);
        }

        /** @var CustomerAccount $account */
        $account = Auth::guard('customer')->user();

        if (! $account->is_active) {
            Auth::guard('customer')->invalidate(true);

            return $this->error('This account is disabled. Please ask the shop.', 403);
        }

        RateLimiter::clear($key);
        $account->forceFill(['last_login_at' => now()])->save();

        return $this->ok('Login successful', $this->formatToken($token, $account));
    }

    /**
     * Current customer
     *
     * @response {"data":{"customer":{"type":"customerAccount","id":1,"attributes":{"fullName":"Maria Santos","email":"maria.santos@example.com","contactNumber":"09178452210","barangayId":28,"barangayName":"Poblacion","streetAddress":null,"mustChangePassword":false},"links":{"self":"http://laundryflow.test/api/v1/customer/auth/me"}}},"message":"Customer retrieved","status":200}
     */
    public function me()
    {
        return $this->ok('Customer retrieved', ['customer' => new CustomerSelfResource($this->account())]);
    }

    /**
     * Refresh the token
     *
     * An expired token is accepted within JWT_REFRESH_TTL.
     */
    public function refresh()
    {
        $guard = Auth::guard('customer');
        $rotated = $guard->refresh();
        $account = $guard->setToken($rotated)->user();

        if (! $account instanceof CustomerAccount || ! $account->is_active) {
            $guard->invalidate(true);

            return $this->error('Unauthenticated', 401);
        }

        $token = $guard->login($account);
        $guard->setToken($rotated)->invalidate(true);
        $guard->setToken($token);

        return $this->ok('Token refreshed', $this->formatToken($token, $account));
    }

    /** Log out */
    public function logout()
    {
        Auth::guard('customer')->logout(true);

        return $this->ok('Successfully logged out', null);
    }

    /**
     * Change my password
     *
     * Allowed while a password change is pending; clears must_change_password.
     */
    public function password(ChangePasswordRequest $request)
    {
        $account = $this->account();
        $account->forceFill([
            'password' => $request->string('password')->toString(),
            'must_change_password' => false,
        ])->save();

        return $this->ok('Password changed', ['customer' => new CustomerSelfResource($account->fresh('customer.barangay'))]);
    }

    private function account(): CustomerAccount
    {
        /** @var CustomerAccount $account */
        $account = Auth::guard('customer')->user();

        return $account->loadMissing('customer.barangay');
    }

    protected function formatToken(string $token, CustomerAccount $account): array
    {
        return [
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('customer')->factory()->getTTL() * 60,
            'customer' => new CustomerSelfResource($account->loadMissing('customer.barangay')),
        ];
    }
}
