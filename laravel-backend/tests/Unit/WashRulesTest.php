<?php

// The wash type and soap rules, held to the same cases as the frontend (shared/wash-cases.json).

use App\Support\WashRules;

$cases = json_decode(file_get_contents(__DIR__.'/../../../shared/wash-cases.json'), true, 512, JSON_THROW_ON_ERROR);

describe('perKgTenths', function () use ($cases) {
    foreach ($cases['perKgTenths'] as $case) {
        it($case['name'], function () use ($case) {
            expect(WashRules::perKgTenths($case['lines']))->toBe($case['expected']);
        });
    }
});

describe('surchargeCents', function () use ($cases) {
    foreach ($cases['surcharge'] as $case) {
        it($case['name'], function () use ($case) {
            expect(WashRules::surchargeCents($case['perKgTenths'], $case['perKgCents']))->toBe($case['expected']);
        });
    }
});

describe('usageQuantity', function () use ($cases) {
    foreach ($cases['usage'] as $case) {
        it($case['name'], function () use ($case) {
            expect(WashRules::usageQuantity($case['unit'], (float) $case['usagePerKg'], $case['perKgTenths']))->toEqualWithDelta((float) $case['expected'], 1e-9);
        });
    }

    it('refuses units that are not soap units', function () {
        WashRules::usageQuantity('rolls', 5.0, 10);
    })->throws(InvalidArgumentException::class);
});

describe('formatting', function () use ($cases) {
    foreach ($cases['format'] as $case) {
        it("prints {$case['quantity']} {$case['unit']} as {$case['expected']}", function () use ($case) {
            expect(WashRules::formatAmount($case['unit'], (float) $case['quantity']))->toBe($case['expected']);
        });
    }

    foreach ($cases['formatUsage'] as $case) {
        it("prints a usage of {$case['usagePerKg']} for {$case['unit']} as {$case['expected']}", function () use ($case) {
            expect(WashRules::formatUsage($case['unit'], (float) $case['usagePerKg']))->toBe($case['expected']);
        });
    }

    foreach ($cases['shortage'] as $case) {
        it('words a shortage', function () use ($case) {
            expect(WashRules::shortageMessage($case['item'], $case['unit'], (float) $case['needed'], (float) $case['onHand']))->toBe($case['expected']);
        });
    }
});
