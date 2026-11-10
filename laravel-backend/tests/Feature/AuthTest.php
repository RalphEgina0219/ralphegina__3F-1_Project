<?php

use App\Models\AuditLog;
use App\Models\CustomerAccount;
use App\Models\User;

describe('staff sign-in (JWT, course L8)', function () {
    it('returns a bearer token and the user with role and permissions', function () {
        $response = $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'kevin.m', 'password' => 'password123']);

        $response->assertOk()
            ->assertJsonPath('message', 'Login successful')
            ->assertJsonPath('data.token_type', 'bearer')
            ->assertJsonPath('data.user.type', 'user')
            ->assertJsonPath('data.user.attributes.role', 'staff')
            ->assertJsonPath('data.user.attributes.permissions', ['payments.record', 'inventory.stock_out']);
        expect($response->json('data.access_token'))->toBeString();
        expect(json_encode($response->json()))->not->toContain('password":');
    });

    it('writes the abilities into the token', function () {
        $token = $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'kevin.m', 'password' => 'password123'])->json('data.access_token');
        $payload = json_decode(base64_decode(strtr(explode('.', $token)[1], '-_', '+/')), true);

        expect($payload['guard'])->toBe('staff');
        expect($payload['abilities'])->toContain('orders.manage', 'payments.record')->not->toContain('settings.manage');
    });

    it('answers 401 for a wrong password, 403 for a disabled account and 422 for missing fields', function () {
        $wrong = $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'kevin.m', 'password' => 'nope']);
        $wrong->assertStatus(401)->assertJsonPath('errors.0.message', 'Invalid credentials');

        $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'jessa.l', 'password' => 'password123'])
            ->assertStatus(403)->assertJsonPath('errors.0.message', 'This account is disabled. Please ask the shop owner.');

        $missing = $this->asGuest()->postJson('/api/v1/auth/login', []);
        $missing->assertStatus(422);
        expect($this->errorSources($missing))->toBe(['username', 'password']);
    });

    it('throttles five failed attempts a minute per username and IP', function () {
        foreach (range(1, 5) as $_) {
            $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'aira.d', 'password' => 'wrong'])->assertStatus(401);
        }
        $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'aira.d', 'password' => 'password123'])
            ->assertStatus(429)->assertJsonPath('errors.0.status', 429);
    });

    it('reads the current user, refreshes and revokes tokens', function () {
        $token = $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'liza.ramos', 'password' => 'password123'])->json('data.access_token');
        $auth = fn (string $t) => ['Authorization' => "Bearer {$t}", 'Accept' => 'application/json'];

        $this->withHeaders($auth($token))->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.user.attributes.username', 'liza.ramos');

        $fresh = $this->withHeaders($auth($token))->postJson('/api/v1/auth/refresh')->assertOk()->json('data.access_token');
        $this->withHeaders($auth($token))->getJson('/api/v1/auth/me')->assertStatus(401);
        $this->withHeaders($auth($fresh))->getJson('/api/v1/auth/me')->assertOk();

        $this->withHeaders($auth($fresh))->postJson('/api/v1/auth/logout')->assertOk()->assertJsonPath('message', 'Successfully logged out');
        $this->withHeaders($auth($fresh))->getJson('/api/v1/auth/me')->assertStatus(401)->assertJsonPath('errors.0.message', 'Unauthenticated');
    });

    it('answers 401 without a token, in the course error format', function () {
        $this->asGuest()->getJson('/api/v1/orders')->assertStatus(401)->assertExactJson(['errors' => [['status' => 401, 'message' => 'Unauthenticated', 'source' => '']]]);
    });

    it('signs a disabled account out at once, even with an unexpired token', function () {
        $headers = ['Authorization' => 'Bearer '.$this->tokenFor('kevin.m'), 'Accept' => 'application/json'];
        User::query()->where('username', 'kevin.m')->update(['is_active' => false]);

        $this->withHeaders($headers)->getJson('/api/v1/orders')->assertStatus(401);
    });

    it('blocks everything but changing the password while one is pending', function () {
        User::query()->where('username', 'kevin.m')->update(['must_change_password' => true]);
        $this->asStaff('kevin.m')->getJson('/api/v1/orders')->assertStatus(403)->assertJsonPath('errors.0.message', 'Change your temporary password first.');
        $this->asStaff('kevin.m')->getJson('/api/v1/auth/me')->assertOk();

        $this->asStaff('kevin.m')->putJson('/api/v1/auth/password', [
            'current_password' => 'password123', 'password' => 'newpass123', 'password_confirmation' => 'newpass123',
        ])->assertOk();
        $this->asStaff('kevin.m')->getJson('/api/v1/orders')->assertOk();
    });

    it('makes a staff user choose a new password after the owner resets theirs', function () {
        $kevin = User::query()->where('username', 'kevin.m')->firstOrFail();

        $reset = $this->asStaff()->postJson("/api/v1/users/{$kevin->getKey()}/reset-password")->assertOk();
        $temporary = $reset->json('data.temporaryPassword');
        expect($temporary)->toBeString()->not->toBeEmpty();
        expect($kevin->refresh()->must_change_password)->toBeTrue();

        // Shown once: no later answer about the user carries it.
        $shown = $this->asStaff()->getJson("/api/v1/users/{$kevin->getKey()}")->assertOk()
            ->assertJsonPath('data.attributes.mustChangePassword', true);
        expect(json_encode($shown->json()))->not->toContain($temporary);

        $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'kevin.m', 'password' => 'password123'])->assertStatus(401);
        $login = $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'kevin.m', 'password' => $temporary])
            ->assertOk()->assertJsonPath('data.user.attributes.mustChangePassword', true);
        $headers = ['Authorization' => 'Bearer '.$login->json('data.access_token'), 'Accept' => 'application/json'];

        $this->withHeaders($headers)->getJson('/api/v1/orders')->assertStatus(403)
            ->assertJsonPath('errors.0.source', 'mustChangePassword');
        $this->withHeaders($headers)->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.user.attributes.mustChangePassword', true);

        $this->withHeaders($headers)->putJson('/api/v1/auth/password', [
            'current_password' => $temporary, 'password' => 'fresh-pass1', 'password_confirmation' => 'fresh-pass1',
        ])->assertOk()->assertJsonPath('data.user.attributes.mustChangePassword', false);

        $this->withHeaders($headers)->getJson('/api/v1/orders')->assertOk();
        $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'kevin.m', 'password' => 'fresh-pass1'])->assertOk();
        expect(AuditLog::query()->where('action', 'user.password_reset')->where('auditable_id', $kevin->getKey())->exists())->toBeTrue();
    });

    it('lets a staff user change their own password, with the field errors under each field', function () {
        $invalid = $this->asStaff('kevin.m')->putJson('/api/v1/auth/password', [
            'current_password' => 'wrong', 'password' => 'short', 'password_confirmation' => 'other',
        ])->assertStatus(422);
        expect($this->errorSources($invalid))->toContain('current_password', 'password', 'password_confirmation');

        $this->asStaff('kevin.m')->putJson('/api/v1/auth/password', [
            'current_password' => 'password123', 'password' => 'password123', 'password_confirmation' => 'password123',
        ])->assertStatus(422)->assertJsonPath('errors.0.message', 'Choose a password different from the current one.');

        $this->asStaff('kevin.m')->putJson('/api/v1/auth/password', [
            'current_password' => 'password123', 'password' => 'newpass123', 'password_confirmation' => 'newpass123',
        ])->assertOk();
        $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'kevin.m', 'password' => 'newpass123'])->assertOk();
    });

    it('lets only the owner reset a staff password', function () {
        $this->asStaff('kevin.m')->postJson('/api/v1/users/1/reset-password')->assertStatus(403);
        $this->asGuest()->postJson('/api/v1/users/2/reset-password')->assertStatus(401);
        expect(User::query()->where('username', 'liza.ramos')->value('must_change_password'))->toBeFalsy();
    });

    it('takes a revoked permission away at once, whatever the token says', function () {
        $headers = ['Authorization' => 'Bearer '.$this->tokenFor('kevin.m'), 'Accept' => 'application/json'];
        $this->withHeaders($headers)->getJson('/api/v1/payments')->assertOk();

        $this->asStaff()->putJson('/api/v1/roles/staff/permissions', ['data' => ['attributes' => ['permissions' => []]]])->assertOk();

        $this->withHeaders($headers)->getJson('/api/v1/payments')->assertStatus(403);
    });
});

describe('separate guards for staff and customers', function () {
    it('rejects a customer token on every staff route and a staff token on customer routes', function () {
        $customer = $this->customerWithAccount();
        $customerToken = ['Authorization' => 'Bearer '.$this->customerToken($customer->account), 'Accept' => 'application/json'];

        foreach (['/api/v1/orders', '/api/v1/auth/me', '/api/v1/dashboard/summary', '/api/v1/customers'] as $url) {
            $this->withHeaders($customerToken)->getJson($url)->assertStatus(401);
        }
        $this->withHeaders($customerToken)->postJson('/api/v1/orders', [])->assertStatus(401);

        $this->asStaff()->getJson('/api/v1/customer/auth/me')->assertStatus(401);
        $this->asStaff()->getJson('/api/v1/customer/orders')->assertStatus(401);
    });

    it('signs customers in with their email, case-insensitively', function () {
        $customer = $this->customerWithAccount([], 'maria.test@example.com');

        $this->asGuest()->postJson('/api/v1/customer/auth/login', ['email' => ' Maria.Test@Example.com ', 'password' => 'password123'])
            ->assertOk()
            ->assertJsonPath('data.customer.attributes.email', 'maria.test@example.com')
            ->assertJsonPath('data.customer.id', $customer->id);
    });

    it('refuses a disabled customer account', function () {
        $customer = $this->customerWithAccount([], 'off@example.com');
        CustomerAccount::query()->where('customer_id', $customer->id)->update(['is_active' => false]);

        $this->asGuest()->postJson('/api/v1/customer/auth/login', ['email' => 'off@example.com', 'password' => 'password123'])->assertStatus(403);
    });
});
