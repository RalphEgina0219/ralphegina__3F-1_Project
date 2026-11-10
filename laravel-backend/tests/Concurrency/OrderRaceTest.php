<?php

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/*
|--------------------------------------------------------------------------
| Real concurrency: simultaneous HTTP requests against a running server
|--------------------------------------------------------------------------
|
| Not part of `composer test`: it needs a server that runs requests in parallel (Laragon's Apache,
| not `php artisan serve`, which serves one request at a time) and it writes to that server's
| database. Run it against a freshly seeded demo database:
|
|   php artisan migrate:fresh --seed
|   RACE_URL=http://laundryflow.test php artisan test tests/Concurrency
|
| Without a hosts entry: RACE_URL=http://127.0.0.1 RACE_HOST=laundryflow.test. Every request goes
| out at once through curl_multi (Http::pool), so the database, not PHP, decides who wins.
|
*/

function raceUrl(string $path): string
{
    return rtrim((string) env('RACE_URL'), '/').'/api/v1'.$path;
}

function raceClient(?string $token = null)
{
    $client = Http::acceptJson()->asJson()->timeout(60);
    if ($host = env('RACE_HOST')) {
        $client = $client->withHeaders(['Host' => $host]);
    }

    return $token ? $client->withToken($token) : $client;
}

/** @param  list<int>  $basketIds */
function raceOrderBody(int $customerId, array $basketIds): array
{
    return ['data' => [
        'attributes' => [
            'items' => [['serviceId' => 1, 'weightKg' => 5]],
            'promisedAt' => now()->addDay()->toIso8601String(),
        ],
        'relationships' => [
            'customer' => ['data' => ['id' => $customerId]],
            'baskets' => ['data' => array_map(fn (int $id) => ['id' => $id], $basketIds)],
        ],
    ]];
}

/**
 * Fires every body at POST /orders in the same instant.
 *
 * @param  list<array>  $bodies
 * @return list<Response>
 */
function raceOrders(string $token, array $bodies): array
{
    $responses = Http::pool(function (Pool $pool) use ($token, $bodies) {
        $requests = [];
        foreach ($bodies as $index => $body) {
            $request = $pool->as("order-{$index}")->acceptJson()->asJson()->timeout(60)->withToken($token);
            if ($host = env('RACE_HOST')) {
                $request = $request->withHeaders(['Host' => $host]);
            }
            $requests[] = $request->post(raceUrl('/orders'), $body);
        }

        return $requests;
    });

    return array_values($responses);
}

/** The NNNN of LF-YYMMDD-NNNN. */
function sequenceOf(string $orderNumber): int
{
    return (int) substr($orderNumber, -4);
}

beforeEach(function () {
    if (! env('RACE_URL')) {
        $this->markTestSkipped('Set RACE_URL to a running LaundryFlow server (see the comment at the top of this file).');
    }

    $login = raceClient()->post(raceUrl('/auth/login'), ['username' => 'liza.ramos', 'password' => 'password123']);
    expect($login->status())->toBe(200, 'Sign-in failed: is the server seeded? '.$login->body());
    $this->token = $login->json('data.access_token');

    $suffix = now()->format('His').random_int(100, 999);
    $customer = raceClient($this->token)->post(raceUrl('/customers'), ['data' => [
        'attributes' => [
            'fullName' => "Race Customer {$suffix}",
            'contactNumber' => '0918'.substr(str_pad($suffix, 7, '0'), 0, 7),
            'email' => "race{$suffix}@example.com",
        ],
        'relationships' => ['barangay' => ['data' => ['id' => 1]]],
    ]]);
    expect($customer->status())->toBe(201, $customer->body());
    $this->customerId = (int) $customer->json('data.customer.id');

    $baskets = raceClient($this->token)->post(raceUrl('/baskets'), ['data' => ['attributes' => ['count' => 21]]]);
    expect($baskets->status())->toBe(201, $baskets->body());
    $this->basketIds = array_map('intval', array_column($baskets->json('data'), 'id'));
});

it('gives one basket to exactly one of 10 simultaneous orders, then numbers 20 simultaneous orders without gaps', function () {
    // 1. Ten counters take the same basket at the same moment.
    $basket = $this->basketIds[0];
    $responses = raceOrders($this->token, array_fill(0, 10, raceOrderBody($this->customerId, [$basket])));

    $byStatus = collect($responses)->groupBy(fn (Response $r) => $r->status())->map->count()->all();
    ksort($byStatus);
    expect($byStatus)->toBe([201 => 1, 409 => 9], 'Statuses: '.json_encode($byStatus).' '.collect($responses)->filter->failed()->map->body()->first());

    $winner = collect($responses)->first(fn (Response $r) => $r->status() === 201);
    $winnerNumber = $winner->json('data.attributes.orderNumber');
    foreach ($responses as $response) {
        expect($response->body())->not->toContain('Deadlock')->not->toContain('SQLSTATE');
        if ($response->status() === 409) {
            // The course format, with the message the counter shows as it is.
            expect($response->json('errors.0.status'))->toBe(409);
            expect($response->json('errors.0.message'))->toMatch('/^BSK-\d{4} is in use by '.preg_quote($winnerNumber, '/').'\.$/');
        }
    }

    // 2. Twenty counters each take in an order on the same day, at the same moment.
    $bodies = array_map(fn (int $id) => raceOrderBody($this->customerId, [$id]), array_slice($this->basketIds, 1, 20));
    $responses = raceOrders($this->token, $bodies);

    foreach ($responses as $response) {
        expect($response->status())->toBe(201, $response->body());
    }
    $numbers = collect($responses)->map(fn (Response $r) => $r->json('data.attributes.orderNumber'))->all();
    expect(array_unique($numbers))->toHaveCount(20);

    // Sequential, and the nine refused orders above used up no number: the winner's + 1 … + 20.
    $sequence = array_map('sequenceOf', $numbers);
    sort($sequence);
    $first = sequenceOf($winnerNumber) + 1;
    expect($sequence)->toBe(range($first, $first + 19));
    expect(collect($numbers)->map(fn (string $n) => substr($n, 0, 9))->unique()->all())->toBe([substr($winnerNumber, 0, 9)]);
});
