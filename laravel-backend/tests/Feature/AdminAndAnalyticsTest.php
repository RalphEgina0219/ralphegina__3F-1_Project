<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

describe('owner-only settings', function () {
    it('keeps users, permissions, settings, reports and the activity log from staff', function () {
        foreach (['/api/v1/users', '/api/v1/roles/permissions', '/api/v1/settings/shop', '/api/v1/activity-logs', '/api/v1/reports/sales'] as $url) {
            $this->asStaff('kevin.m')->getJson($url)->assertStatus(403);
            $this->asStaff()->getJson($url)->assertOk();
        }
        $this->asStaff()->getJson('/api/v1/reports/nonsense')->assertNotFound()->assertJsonPath('errors.0.message', 'There is no such report.');
    });

    it('manages staff accounts without ever deleting one', function () {
        $created = $this->asStaff()->postJson('/api/v1/users', ['data' => ['attributes' => [
            'name' => 'Rico Santos', 'username' => 'Rico.S', 'role' => 'staff', 'password' => 'password123',
        ]]])->assertCreated()->assertJsonPath('data.attributes.username', 'rico.s');
        $id = $created->json('data.id');

        $this->asStaff()->postJson('/api/v1/users', ['data' => ['attributes' => ['name' => 'X', 'username' => 'rico.s', 'role' => 'boss', 'password' => 'short']]])
            ->assertStatus(422);
        $this->asStaff()->postJson("/api/v1/users/{$id}/disable")->assertOk()->assertJsonPath('data.attributes.isActive', false);
        $this->asStaff()->patchJson("/api/v1/users/{$id}", ['data' => ['attributes' => ['isActive' => true]]])->assertOk()->assertJsonPath('data.attributes.isActive', true);
        $this->asStaff()->postJson('/api/v1/users/1/disable')->assertStatus(422)->assertJsonPath('errors.0.message', 'You cannot disable your own account.');
        $this->asStaff()->patchJson('/api/v1/users/1', ['data' => ['attributes' => ['role' => 'staff']]])->assertStatus(422)
            ->assertJsonPath('errors.0.message', 'You cannot remove your own administrator role.');
        $this->asStaff()->deleteJson("/api/v1/users/{$id}")->assertStatus(405);

        $password = $this->asStaff()->postJson("/api/v1/users/{$id}/reset-password")->assertOk()->json('data.temporaryPassword');
        $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'rico.s', 'password' => $password])->assertOk();
        expect(User::query()->count())->toBe(5);
    });

    it('replaces the shop profile and records it in the activity log', function () {
        $this->asStaff()->putJson('/api/v1/settings/shop', ['data' => ['attributes' => [
            'name' => 'LaundryFlow Bongabong', 'address' => 'Poblacion', 'contactNumber' => '0917', 'openingHours' => '7–7',
            'receiptFooter' => 'Salamat!', 'claimPolicyDays' => 45,
        ]]])->assertOk()->assertJsonPath('data.attributes.claimPolicyDays', 45);

        $this->asStaff()->getJson('/api/v1/activity-logs?entity=shop_settings')->assertOk()
            ->assertJsonPath('data.0.attributes.summary', 'updated the shop profile')
            ->assertJsonPath('data.0.attributes.oldValues.claim_policy_days', 30);
    });

    it('answers unknown routes and methods in the course error format', function () {
        $this->asStaff()->getJson('/api/v1/nothing')->assertNotFound()->assertJsonPath('errors.0.source', 'Route');
        $this->asStaff()->deleteJson('/api/v1/auth/me')->assertStatus(405)->assertJsonPath('errors.0.status', 405);
        // The removed endpoints do not exist.
        $this->asStaff()->getJson('/api/v1/orders/1/receipt')->assertNotFound();
        $this->asGuest()->getJson('/api/v1/public/track/abc')->assertNotFound();
    });

    it('answers 401, 403, 404, 409, 422, 429 and 500 in the one course format', function () {
        $shape = fn ($response, int $status) => $response->assertStatus($status)
            ->assertJsonStructure(['errors' => [['status', 'message', 'source']]])
            ->assertJsonPath('errors.0.status', $status);

        $shape($this->asGuest()->getJson('/api/v1/orders'), 401);
        $shape($this->asStaff('kevin.m')->getJson('/api/v1/users'), 403);
        $shape($this->asStaff()->getJson('/api/v1/orders/999999'), 404);
        $shape($this->moveTo($this->createOrder(), 'drying'), 409);
        $shape($this->asStaff()->postJson('/api/v1/customers', ['data' => ['attributes' => []]]), 422);
        foreach (range(1, 5) as $attempt) {
            $this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'aira.d', 'password' => 'wrong']);
        }
        $shape($this->asGuest()->postJson('/api/v1/auth/login', ['username' => 'aira.d', 'password' => 'wrong']), 429);
    });

    it('never shows a crash to the client while APP_DEBUG is off', function () {
        config(['app.debug' => false]);
        Route::middleware('api')->get('api/v1/_crash', fn () => throw new RuntimeException('SQLSTATE secret at C:\\laragon\\www'));

        $response = $this->asGuest()->getJson('/api/v1/_crash')->assertStatus(500);

        expect($response->json())->toBe(['errors' => [['status' => 500, 'message' => 'Server error', 'source' => '']]]);
        expect($response->getContent())->not->toContain('SQLSTATE')->not->toContain('laragon')->not->toContain('RuntimeException');
    });
});

describe('analytics (120 days of demo history)', function () {
    beforeEach(function () {
        $this->useDemoData();
    });

    it('agrees to the centavo: dashboard, sales report, payments report and the payment log', function () {
        $from = now()->subDays(29)->toDateString();
        $to = now()->toDateString();

        $dashboard = $this->asStaff()->getJson("/api/v1/analytics/dashboard?from={$from}&to={$to}")->assertOk();
        $sales = $this->asStaff()->getJson("/api/v1/reports/sales?from={$from}&to={$to}")->assertOk();
        $payments = $this->asStaff()->getJson("/api/v1/reports/payments?from={$from}&to={$to}")->assertOk();
        $log = $this->asStaff()->getJson("/api/v1/payments?paidAt={$from},{$to}")->assertOk();
        $sql = (int) DB::table('payments')->whereNull('voided_at')->where('paid_at', '>=', $from)->where('paid_at', '<', now()->addDay()->toDateString())->sum('amount_cents');

        $kpi = collect($dashboard->json('data.kpis'))->firstWhere('key', 'sales')['value'];
        expect($kpi)->toBeGreaterThan(0)
            ->toBe($sales->json('data.table.totals.sales'))
            ->toBe($payments->json('data.table.totals.amount'))
            ->toBe($log->json('meta.collectedCents'))
            ->toBe($sql);
        // Revenue by service adds up to sales exactly (largest-remainder allocation).
        expect(array_sum(array_column($dashboard->json('data.series.revenue_by_service'), 'value')))->toBe($kpi);
        // Zero-filled: one point per day of the range.
        expect($dashboard->json('data.series.sales'))->toHaveCount(30);
        expect($dashboard->json('data.compare_range.to'))->toBe(now()->subDays(30)->toDateString());
    });

    it('builds the staff dashboard without a single peso field', function () {
        $staff = $this->asStaff('kevin.m')->getJson('/api/v1/analytics/dashboard')->assertOk();

        expect($staff->json('data.series.role'))->toBe('staff');
        expect(collect($staff->json('data.kpis'))->pluck('format')->unique()->all())->toBe(['count']);
        $json = json_encode($staff->json());
        expect($json)->not->toContain('_cents')->not->toContain('"money"')->not->toContain('revenue')->not->toContain('sales');

        $summary = $this->asStaff('kevin.m')->getJson('/api/v1/dashboard/summary')->assertOk();
        expect($summary->json('data.kpis'))->not->toHaveKey('salesTodayCents');
        expect($summary->json('data'))->not->toHaveKey('weeklySales');
    });

    it('answers every report with the analytics envelope', function () {
        foreach (['sales', 'orders', 'payments', 'services', 'customers', 'inventory', 'staff'] as $kind) {
            $this->asStaff()->getJson("/api/v1/reports/{$kind}")->assertOk()
                ->assertJsonStructure(['data' => ['range' => ['from', 'to'], 'compare_range', 'generated_at', 'kpis', 'series', 'table' => ['columns', 'rows', 'totals'], 'insights']]);
        }
    });
});
