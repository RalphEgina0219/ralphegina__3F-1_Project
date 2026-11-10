<?php

// Key cases from react-frontend/src/lib/analytics/time.test.ts and series.test.ts.

use App\Support\Analytics\ManilaTime;
use App\Support\Analytics\Series;

describe('Manila time', function () {
    it('reads the Manila calendar day and hour of an instant', function () {
        // 2026-11-06T16:30:00Z is 00:30 on Nov 7 in Manila.
        $ms = strtotime('2026-11-06T16:30:00Z') * 1000;
        expect(ManilaTime::day($ms))->toBe('2026-11-07');
        expect(ManilaTime::hour($ms))->toBe(0);
    });

    it('counts ranges inclusively and finds the previous one', function () {
        $range = ['from' => '2026-11-01', 'to' => '2026-11-30'];
        expect(ManilaTime::rangeLength($range))->toBe(30);
        expect(ManilaTime::previousRange($range))->toBe(['from' => '2026-10-02', 'to' => '2026-10-31']);
    });

    it('starts weeks on Monday', function () {
        expect(ManilaTime::weekStart('2026-11-08'))->toBe('2026-11-02');
        expect(ManilaTime::weekdayOf('2026-11-08'))->toBe(6);
    });

    it('rejects malformed ranges and swaps reversed ones', function () {
        $fallback = ['from' => '2026-01-01', 'to' => '2026-01-31'];
        expect(ManilaTime::parseRange('2026-02-30', '2026-03-01', $fallback))->toBe($fallback);
        expect(ManilaTime::parseRange('2026-03-10', '2026-03-01', $fallback))->toBe(['from' => '2026-03-01', 'to' => '2026-03-10']);
    });
});

describe('series', function () {
    it('splits centavos by the largest remainder', function () {
        expect(Series::allocate(1000, [100, 100, 100]))->toBe([334, 333, 333]);
        expect(Series::allocate(100, [0, 0]))->toBe([100, 0]);
        expect(array_sum(Series::allocate(12345, [3500, 1500, 777])))->toBe(12345);
    });

    it('rounds the percent change to one decimal and refuses a zero base', function () {
        expect(Series::deltaPct(115, 100))->toEqual(15);
        expect(Series::deltaPct(1, 3))->toEqual(-66.7);
        expect(Series::deltaPct(5, 0))->toBeNull();
        expect(Series::deltaPct(null, 5))->toBeNull();
    });

    it('zero-fills every day of the range', function () {
        $at = ManilaTime::instant('2026-11-03', 10);
        $points = Series::sumByDay([['at' => $at]], ['from' => '2026-11-01', 'to' => '2026-11-05'], fn ($r) => $r['at']);
        expect(array_column($points, 'value'))->toBe([0, 0, 1, 0, 0]);
    });

    it('counts sales on the Manila day they were paid, voided ones excluded', function () {
        $late = strtotime('2026-11-06T16:30:00Z') * 1000; // Nov 7, 00:30 in Manila
        $payments = [
            ['amount_cents' => 1000, 'paid_at' => $late, 'voided' => false],
            ['amount_cents' => 500, 'paid_at' => $late, 'voided' => true],
        ];
        $points = Series::salesByDay($payments, ['from' => '2026-11-06', 'to' => '2026-11-07']);
        expect($points)->toBe([['date' => '2026-11-06', 'value' => 0], ['date' => '2026-11-07', 'value' => 1000]]);
    });
});
