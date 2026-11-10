<?php

// Ported case by case from react-frontend/src/lib/inventory.test.ts.

use App\Support\InventoryRules;

describe('stockStatus', function () {
    it('is critical at or under half the reorder level', function () {
        expect(InventoryRules::stockStatus(2, 5))->toBe('critical');
        expect(InventoryRules::stockStatus(2.5, 5))->toBe('critical');
    });

    it('is low at or under the reorder level', function () {
        expect(InventoryRules::stockStatus(3.5, 4))->toBe('low');
        expect(InventoryRules::stockStatus(50, 50))->toBe('low');
    });

    it('is ok above the reorder level', function () {
        expect(InventoryRules::stockStatus(12, 5))->toBe('ok');
    });
});

describe('onHand', function () {
    it('sums signed movements without float drift', function () {
        expect(InventoryRules::onHand([
            ['type' => 'in', 'quantity' => 10],
            ['type' => 'out', 'quantity' => 6.5],
            ['type' => 'out', 'quantity' => 1.5],
        ]))->toEqual(2);
        expect(InventoryRules::onHand([
            ['type' => 'in', 'quantity' => 0.1],
            ['type' => 'in', 'quantity' => 0.2],
        ]))->toBe(0.3);
    });

    it('treats adjustments as signed deltas', function () {
        expect(InventoryRules::signedQuantity('adjust', -2))->toEqual(-2);
        expect(InventoryRules::onHand([
            ['type' => 'in', 'quantity' => 5],
            ['type' => 'adjust', 'quantity' => -2],
        ]))->toEqual(3);
    });
});

describe('checkMovement', function () {
    it('blocks a stock-out above on-hand', function () {
        expect(InventoryRules::checkMovement('out', 3, 2))->toMatchArray(['ok' => false]);
        expect(InventoryRules::checkMovement('out', 2, 2))->toBe(['ok' => true]);
    });

    it('blocks adjustments below zero', function () {
        expect(InventoryRules::checkMovement('adjust', -3, 2))->toMatchArray(['ok' => false]);
        expect(InventoryRules::checkMovement('adjust', 0, 2))->toMatchArray(['ok' => false]);
        expect(InventoryRules::checkMovement('adjust', -2, 2))->toBe(['ok' => true]);
    });

    it('requires a positive quantity for stock-in', function () {
        expect(InventoryRules::checkMovement('in', 0, 2))->toMatchArray(['ok' => false]);
    });

    it('says how much is on hand, as the frontend prints it', function () {
        expect(InventoryRules::checkMovement('out', 3, 2.5)['message'])->toBe('Stock-out cannot exceed the 2.5 on hand.');
    });
});

describe('stockLevelPercent', function () {
    it('is clamped between 0 and 100', function () {
        expect(InventoryRules::levelPercent(2, 5))->toBe(20);
        expect(InventoryRules::levelPercent(500, 5))->toBe(100);
        expect(InventoryRules::levelPercent(0, 0))->toBe(0);
    });
});
