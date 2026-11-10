<?php

// Ported case by case from react-frontend/src/lib/status.test.ts.

use App\Support\StatusRules;

$check = fn (string $from, string $to, string $role = 'staff', int $balance = 0, ?string $note = null) => StatusRules::checkTransition($from, $to, $role, $balance, $note);

describe('status order', function () {
    it('is the fixed six-stage lifecycle', function () {
        expect(array_map(fn ($s) => StatusRules::label($s), StatusRules::ORDER))
            ->toBe(['Received', 'Washing', 'Drying', 'Folding', 'Ready for Pickup', 'Completed']);
    });

    it('shows Completed for the internal released code everywhere', function () {
        expect(StatusRules::label('released'))->toBe('Completed');
        expect(StatusRules::ORDER[5])->toBe('released');
    });

    it('steps forward and back', function () {
        expect(StatusRules::next('received'))->toBe('washing');
        expect(StatusRules::next('released'))->toBeNull();
        expect(StatusRules::previous('received'))->toBeNull();
    });
});

describe('checkTransition', function () use ($check) {
    it('allows one step forward for anyone', function () use ($check) {
        expect($check('received', 'washing'))->toBe(['ok' => true, 'direction' => 'forward']);
    });

    it('rejects skipping stages and staying put', function () use ($check) {
        expect($check('received', 'drying'))->toMatchArray(['ok' => false, 'code' => 'skip_not_allowed']);
        expect($check('washing', 'washing'))->toMatchArray(['ok' => false, 'code' => 'same_status']);
    });

    it('requires a zero balance to release', function () use ($check) {
        expect($check('ready_for_pickup', 'released', 'staff', 1))->toMatchArray(['ok' => false, 'code' => 'balance_due']);
        expect($check('ready_for_pickup', 'released'))->toMatchArray(['ok' => true]);
    });

    it('treats a completed transaction as closed, even for an admin', function () use ($check) {
        expect($check('released', 'ready_for_pickup', 'admin', 0, 'Customer came back'))
            ->toMatchArray(['ok' => false, 'code' => 'already_completed', 'message' => 'This transaction is completed.']);
    });

    it('only allows other stages while a balance is due', function () use ($check) {
        expect($check('washing', 'drying', 'staff', 500))->toMatchArray(['ok' => true]);
    });

    it('blocks staff from reverting', function () use ($check) {
        expect($check('drying', 'washing', 'staff', 0, 'oops'))->toMatchArray(['ok' => false, 'code' => 'revert_not_allowed']);
    });

    it('lets an admin revert one step with a reason', function () use ($check) {
        expect($check('drying', 'washing', 'admin'))->toMatchArray(['ok' => false, 'code' => 'revert_reason_required']);
        expect($check('drying', 'washing', 'admin', 0, '   '))->toMatchArray(['ok' => false, 'code' => 'revert_reason_required']);
        expect($check('drying', 'washing', 'admin', 0, 'Wrong load'))->toBe(['ok' => true, 'direction' => 'revert']);
        expect($check('folding', 'washing', 'admin', 0, 'x'))->toMatchArray(['ok' => false, 'code' => 'revert_not_allowed']);
    });
});
