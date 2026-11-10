<?php

namespace Tests;

use App\Models\Basket;
use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Models\OrderStatus;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use PHPOpenSourceSaver\JWTAuth\JWTGuard;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /** Every test starts from the reference data: roles, the four staff, services, statuses … */
    protected bool $seed = true;

    protected string $seeder = ReferenceDataSeeder::class;

    protected function setUp(): void
    {
        parent::setUp();
        OrderStatus::flushCache();
    }

    /**
     * A fresh guard for every request, as in production where each request is its own process:
     * the JWT guard must never reuse the user of an earlier request in the same test.
     */
    public function call($method, $uri, $parameters = [], $cookies = [], $files = [], $server = [], $content = null)
    {
        $this->resetAuthState();

        return parent::call($method, $uri, $parameters, $cookies, $files, $server, $content);
    }

    /** Replaces the reference data with the full demo seed (120 days of orders and payments). */
    protected function useDemoData(): void
    {
        foreach (['audit_logs', 'notifications', 'inventory_movements', 'inventory_items', 'payments', 'order_baskets', 'order_status_history', 'order_items', 'orders', 'order_sequences',
            'receipt_sequences', 'baskets', 'customer_accounts', 'customers', 'services', 'shop_settings', 'units', 'payment_methods', 'order_statuses', 'barangays', 'role_permission', 'users', 'permissions', 'roles'] as $table) {
            DB::table($table)->delete();
        }
        OrderStatus::flushCache();
        $this->seed(DemoSeeder::class);
    }

    /** A staff token (liza.ramos is the owner, kevin.m staff), without going through login. */
    protected function tokenFor(User|string $user): string
    {
        $user = \is_string($user) ? User::query()->where('username', $user)->firstOrFail() : $user;

        return $this->issueToken('api', $user->getKey());
    }

    protected function customerToken(CustomerAccount $account): string
    {
        return $this->issueToken('customer', $account->getKey());
    }

    /** Issues a JWT on the given guard, then resets auth so the guard does not remember it. */
    private function issueToken(string $guard, int|string $id): string
    {
        $jwtGuard = $this->app['auth']->guard($guard);
        \assert($jwtGuard instanceof JWTGuard);
        $token = (string) $jwtGuard->tokenById($id);
        $this->resetAuthState();

        return $token;
    }

    /** The JWT services are request-scoped and remember the token they parsed. */
    private function resetAuthState(): void
    {
        $this->app->forgetScopedInstances();
        $this->app['auth']->forgetGuards();
    }

    /** JSON requests as a signed-in staff member (the owner by default). */
    protected function asStaff(User|string $user = 'liza.ramos'): static
    {
        return $this->withHeaders(['Authorization' => 'Bearer '.$this->tokenFor($user), 'Accept' => 'application/json']);
    }

    protected function asCustomer(CustomerAccount $account): static
    {
        return $this->withHeaders(['Authorization' => 'Bearer '.$this->customerToken($account), 'Accept' => 'application/json']);
    }

    /** No token at all. */
    protected function asGuest(): static
    {
        $this->defaultHeaders = [];

        return $this->withHeaders(['Accept' => 'application/json']);
    }

    /** A customer with an account (password123). */
    protected function customerWithAccount(array $overrides = [], string $email = ''): Customer
    {
        static $n = 0;
        $n++;
        $customer = Customer::query()->create([
            'full_name' => "Test Customer {$n}",
            'contact_number' => '0917'.str_pad((string) (1000000 + $n), 7, '0', STR_PAD_LEFT),
            'barangay_id' => 28,
            ...$overrides,
        ]);
        CustomerAccount::query()->create([
            'customer_id' => $customer->getKey(),
            'email' => $email ?: "customer{$n}.".uniqid().'@example.com',
            'password' => 'password123',
            'is_active' => true,
            'must_change_password' => false,
        ]);

        return $customer->load('account');
    }

    /** n fresh available baskets. */
    protected function baskets(int $count = 1): array
    {
        $ids = [];
        $start = (int) Basket::query()->max('id');
        for ($i = 1; $i <= $count; $i++) {
            $ids[] = Basket::query()->create([
                'basket_number' => \sprintf('BSK-%04d', $start + $i),
                'qr_token' => substr(str_repeat(md5(uniqid((string) $i, true)), 2), 0, 32),
                'label' => null,
                'status' => 'available',
                'created_by' => 1,
            ])->getKey();
        }

        return $ids;
    }

    /**
     * POST /orders in the course's JSON:API shape.
     *
     * @param  list<array<string, mixed>>  $items
     */
    protected function orderBody(int $customerId, array $basketIds, array $items = [['serviceId' => 1, 'weightKg' => 5]], ?array $payment = null): array
    {
        return ['data' => [
            'attributes' => array_filter([
                'items' => $items,
                'promisedAt' => now()->addDay()->toIso8601String(),
                'notes' => null,
                'payment' => $payment,
            ], fn ($v) => $v !== null),
            'relationships' => [
                'customer' => ['data' => ['id' => $customerId]],
                'baskets' => ['data' => array_map(fn ($id) => ['id' => $id], $basketIds)],
            ],
        ]];
    }

    /** Creates an order through the API and returns its id. */
    protected function createOrder(array $items = [['serviceId' => 1, 'weightKg' => 5]], ?array $payment = null, ?Customer $customer = null): int
    {
        $customer ??= $this->customerWithAccount();
        $response = $this->asStaff()->postJson('/api/v1/orders', $this->orderBody($customer->getKey(), $this->baskets(), $items, $payment));
        $response->assertCreated();

        return (int) $response->json('data.id');
    }

    /** POST /orders/{id}/status */
    protected function moveTo(int $orderId, string $status, ?string $note = null, User|string $user = 'liza.ramos'): TestResponse
    {
        return $this->asStaff($user)->postJson("/api/v1/orders/{$orderId}/status", ['data' => ['attributes' => array_filter(['toStatus' => $status, 'note' => $note])]]);
    }

    /** The first error message of a course-style error response. */
    protected function firstError(TestResponse $response): ?string
    {
        return $response->json('errors.0.message');
    }

    /** Every error source of a course-style error response. */
    protected function errorSources(TestResponse $response): array
    {
        return array_column($response->json('errors') ?? [], 'source');
    }
}
