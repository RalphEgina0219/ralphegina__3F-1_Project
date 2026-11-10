<?php

use App\Models\CustomerAccount;
use Illuminate\Support\Facades\DB;

/*
| Every list endpoint answers a page with a fixed number of queries, however many rows the page
| holds: related data is eager-loaded, never fetched row by row (N+1). Measured on the full demo
| seed, with the same ?include= and page sizes the screens send.
*/

beforeEach(function () {
    $this->useDemoData();
});

/** The queries one request runs, after the guard has loaded the user. */
function queriesFor(callable $request): array
{
    DB::flushQueryLog();
    DB::enableQueryLog();
    $request();
    DB::disableQueryLog();

    return DB::getQueryLog();
}

dataset('staff lists', [
    'orders (list screen)' => ['/api/v1/orders?include=customer,baskets,items,receivedBy&perPage=15'],
    'orders (board, every active one)' => ['/api/v1/orders?include=customer,baskets,items,receivedBy&perPage=500&status=received,washing,drying,folding,ready_for_pickup'],
    'customers' => ['/api/v1/customers'],
    'customers (search)' => ['/api/v1/customers?search=maria'],
    'a customer\'s orders' => ['/api/v1/customers/1/orders?include=customer,baskets,items,receivedBy'],
    'payments' => ['/api/v1/payments'],
    'balances' => ['/api/v1/balances?include=customer,baskets,items,receivedBy'],
    'baskets' => ['/api/v1/baskets'],
    'available baskets' => ['/api/v1/baskets/available'],
    'inventory items' => ['/api/v1/inventory/items'],
    'inventory movements' => ['/api/v1/inventory/movements'],
    'activity log' => ['/api/v1/activity-logs'],
    'users' => ['/api/v1/users'],
    'services' => ['/api/v1/services'],
    'notifications' => ['/api/v1/notifications'],
]);

it('answers :dataset with the same queries for 5 rows as for 50, and at most 15', function (string $url) {
    $token = $this->tokenFor('liza.ramos');
    $headers = ['Authorization' => "Bearer {$token}", 'Accept' => 'application/json'];
    $page = fn (int $size) => preg_replace('/([?&])perPage=\d+/', '$1', $url).(str_contains($url, '?') ? '&' : '?')."perPage={$size}";

    // Once to warm the per-process lookups (statuses, payment methods), as after the first request.
    $this->withHeaders($headers)->getJson($page(1))->assertOk();
    $small = queriesFor(fn () => $this->withHeaders($headers)->getJson($page(5))->assertOk());
    $large = queriesFor(fn () => $this->withHeaders($headers)->getJson($page(50))->assertOk());

    // No N+1: ten times the rows, not one query more.
    expect(count($large))->toBe(count($small), "{$url}: ".count($small).' queries for 5 rows, '.count($large)." for 50:\n".collect($large)->pluck('query')->implode("\n"));
    // The user and role, the page, its count, the summary figures and one query per included relation.
    expect(count($large))->toBeLessThanOrEqual(15, "{$url} ran ".count($large)." queries:\n".collect($large)->pluck('query')->implode("\n"));
})->with('staff lists');

it('answers the customer portal lists in at most 10 queries', function () {
    $account = CustomerAccount::query()->where('email', 'maria.santos@example.com')->firstOrFail();
    $token = $this->customerToken($account);
    $headers = ['Authorization' => "Bearer {$token}", 'Accept' => 'application/json'];

    foreach (['/api/v1/customer/orders', '/api/v1/customer/orders?status=completed', '/api/v1/customer/notifications'] as $url) {
        $log = queriesFor(fn () => $this->withHeaders($headers)->getJson($url)->assertOk());
        expect(count($log))->toBeLessThanOrEqual(10, "{$url} ran ".count($log)." queries:\n".collect($log)->pluck('query')->implode("\n"));
    }
});

it('builds every report and the dashboard with a fixed number of queries', function () {
    $token = $this->tokenFor('liza.ramos');
    $headers = ['Authorization' => "Bearer {$token}", 'Accept' => 'application/json'];
    $range = 'from='.now()->subDays(29)->toDateString().'&to='.now()->toDateString().'&compare=previous';

    foreach (['analytics/dashboard', 'reports/sales', 'reports/orders', 'reports/payments', 'reports/services', 'reports/customers', 'reports/inventory', 'reports/staff'] as $path) {
        $log = queriesFor(fn () => $this->withHeaders($headers)->getJson("/api/v1/{$path}?{$range}")->assertOk());
        // A report reads each table it sums once per period (and once more for the comparison).
        expect(count($log))->toBeLessThanOrEqual(25, "{$path} ran ".count($log)." queries:\n".collect($log)->pluck('query')->implode("\n"));
    }
});
