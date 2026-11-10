<?php

// Ported from react-frontend/src/lib/permissions.test.ts: the same can() semantics, read from the
// list of abilities a token receives (Abilities::forStaffPermissions / ALL_STAFF).

use App\Permissions\V1\Abilities;

$staff = fn (array $permissions = []) => Abilities::forStaffPermissions($permissions);

it('allows an admin everything', function () {
    foreach (['settings.manage', 'reports.view', 'payments.void', 'baskets.manage', 'baskets.scan'] as $ability) {
        expect(Abilities::ALL_STAFF)->toContain($ability);
    }
});

it('gives staff the operational base only', function () use ($staff) {
    expect($staff())->toContain('orders.manage', 'baskets.scan', 'inventory.view');
    expect($staff())->not->toContain('baskets.manage', 'reports.view', 'settings.manage', 'sales.view', 'orders.revert', 'inventory.manage');
});

it('unlocks staff abilities from their toggles', function () use ($staff) {
    expect($staff())->not->toContain('payments.record');
    expect($staff(['payments.record']))->toContain('payments.record', 'payments.view');
    expect($staff(['payments.record']))->not->toContain('payments.void');
    expect($staff(['inventory.stock_out']))->toContain('inventory.stock_out');
});

it('ignores unknown permission codes', function () use ($staff) {
    expect($staff(['settings.manage']))->toBe($staff());
});
