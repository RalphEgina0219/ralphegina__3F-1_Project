<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

/*
| The production-hardening checks: rate limits, the JWT settings, no secret in any answer, and
| no field written that the request does not map.
*/

describe('rate limits', function () {
    it('allows ten self-registrations a minute from one address', function () {
        $body = fn (int $n) => ['data' => [
            'attributes' => [
                'fullName' => "Rate Limit {$n}", 'contactNumber' => '0917'.str_pad((string) (2000000 + $n), 7, '0', STR_PAD_LEFT),
                'email' => "rate{$n}@example.com", 'password' => 'rate-pass1', 'password_confirmation' => 'rate-pass1',
            ],
            'relationships' => ['barangay' => ['data' => ['id' => 1]]],
        ]];

        foreach (range(1, 10) as $n) {
            expect($this->asGuest()->postJson('/api/v1/customer/auth/register', $body($n))->status())->not->toBe(429);
        }
        $this->asGuest()->postJson('/api/v1/customer/auth/register', $body(11))->assertStatus(429)
            ->assertJsonPath('errors.0.status', 429)
            ->assertHeader('Retry-After');
    });

    it('allows 120 scans a minute per staff member', function () {
        $token = $this->tokenFor('kevin.m');
        $headers = ['Authorization' => "Bearer {$token}", 'Accept' => 'application/json'];

        foreach (range(1, 120) as $n) {
            expect($this->withHeaders($headers)->getJson('/api/v1/scan/BSK-9999')->status())->not->toBe(429);
        }
        $this->withHeaders($headers)->getJson('/api/v1/scan/BSK-9999')->assertStatus(429);
        // Another staff member is not slowed down by Kevin's scans.
        $this->asStaff('aira.d')->getJson('/api/v1/scan/BSK-9999')->assertStatus(404);
    });
});

describe('tokens', function () {
    it('keeps access tokens short, with a bounded refresh window and the blacklist on', function () {
        expect(config('jwt.ttl'))->toBeGreaterThanOrEqual(15)->toBeLessThanOrEqual(120);
        expect(config('jwt.refresh_ttl'))->toBeLessThanOrEqual(20160);
        expect((bool) config('jwt.blacklist_enabled'))->toBeTrue();
        // The secret comes from the environment only.
        expect(file_get_contents(config_path('jwt.php')))->toContain("env('JWT_SECRET')");
    });

    it('stops a token at logout and when its account is disabled', function () {
        $token = $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'kevin.m', 'password' => 'password123'])->json('data.access_token');
        $headers = ['Authorization' => "Bearer {$token}", 'Accept' => 'application/json'];
        $this->withHeaders($headers)->postJson('/api/v1/auth/logout')->assertOk();
        $this->withHeaders($headers)->getJson('/api/v1/auth/me')->assertStatus(401);
        $this->withHeaders($headers)->postJson('/api/v1/auth/refresh')->assertStatus(401);

        $token = $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'aira.d', 'password' => 'password123'])->json('data.access_token');
        $this->asStaff()->postJson('/api/v1/users/3/disable')->assertOk();
        $this->withHeaders(['Authorization' => "Bearer {$token}", 'Accept' => 'application/json'])->getJson('/api/v1/orders')->assertStatus(401);
    });
});

describe('what answers never contain', function () {
    it('has no password hash or token secret in any account answer', function () {
        $customer = $this->customerWithAccount();
        $answers = [
            $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'liza.ramos', 'password' => 'password123']),
            $this->asStaff()->getJson('/api/v1/auth/me'),
            $this->asStaff()->getJson('/api/v1/users'),
            $this->asStaff()->getJson('/api/v1/users/2'),
            $this->asStaff()->getJson("/api/v1/customers/{$customer->getKey()}"),
            $this->asStaff()->getJson('/api/v1/customers'),
            $this->asStaff()->getJson('/api/v1/activity-logs'),
            $this->asGuest()->postJson('/api/v1/customer/auth/login', ['email' => $customer->account->email, 'password' => 'password123']),
            $this->asCustomer($customer->account)->getJson('/api/v1/customer/auth/me'),
        ];

        foreach ($answers as $answer) {
            $answer->assertOk();
            $body = $answer->getContent();
            expect($body)->not->toContain('"password"')->not->toContain('$2y$')
                ->not->toContain('remember_token')->not->toContain((string) config('jwt.secret'));
        }
    });
});

it('keeps file paths out of deliberate answers even while APP_DEBUG is on', function () {
    config(['app.debug' => true]);
    $order = $this->createOrder();

    $conflict = $this->moveTo($order, 'drying')->assertStatus(409);
    expect($conflict->json())->toBe(['errors' => [['status' => 409, 'message' => 'Orders move one stage at a time. Next is Washing.', 'source' => '']]]);

    // A real crash still shows where it happened, for the developer.
    Route::middleware('api')->get('api/v1/_crash', fn () => throw new RuntimeException('boom'));
    $crash = $this->asGuest()->getJson('/api/v1/_crash')->assertStatus(500);
    expect($crash->json('errors.0.message'))->toBe('boom');
    expect($crash->json('errors.0.source'))->toStartWith('Line ');
});

it('answers 404, not a crash, for a notification id that is not a number', function () {
    $customer = $this->customerWithAccount();
    $this->asCustomer($customer->account)->postJson('/api/v1/customer/notifications/:notification/read')->assertNotFound();
    $this->asCustomer($customer->account)->postJson('/api/v1/customer/notifications/abc/read')->assertNotFound();
});

describe('writes', function () {
    it('writes only the fields a request maps, whatever else the body carries', function () {
        $this->asStaff()->patchJson('/api/v1/users/2', ['data' => ['attributes' => [
            'name' => 'Kevin M.', 'roleId' => 1, 'role_id' => 1, 'mustChangePassword' => true,
            'lastLoginAt' => '2000-01-01T00:00:00Z', 'id' => 99, 'password' => 'injected1',
        ]]])->assertOk();

        $kevin = User::query()->findOrFail(2);
        expect($kevin->name)->toBe('Kevin M.');
        expect($kevin->load('role')->roleName())->toBe('staff');
        expect($kevin->must_change_password)->toBeFalse();
        expect($kevin->last_login_at?->year)->not->toBe(2000);
        expect(User::query()->find(99))->toBeNull();
    });

    it('validates the reason for retiring a basket', function () {
        $basket = $this->baskets()[0];
        $this->asStaff()->postJson("/api/v1/baskets/{$basket}/retire", ['data' => ['attributes' => ['reason' => str_repeat('x', 256)]]])
            ->assertStatus(422)->assertJsonPath('errors.0.source', 'data.attributes.reason');
        $this->asStaff()->postJson("/api/v1/baskets/{$basket}/retire", ['data' => ['attributes' => ['reason' => ['not', 'text']]]])
            ->assertStatus(422);
        $this->asStaff()->postJson("/api/v1/baskets/{$basket}/retire", ['data' => ['attributes' => ['reason' => 'Cracked']]])->assertOk();
    });
});
