<?php

// Ported case by case from react-frontend/src/lib/billing.test.ts, so both sides agree.

use App\Support\Billing;
use App\Support\Money;

$wdf = ['pricing_type' => 'per_kg', 'rate_cents' => 3500, 'minimum_qty' => 3];

describe('lineSubtotalCents', function () use ($wdf) {
    it('bills per kg above the minimum', function () use ($wdf) {
        expect(Billing::lineSubtotalCents($wdf + ['weight_kg' => 6.5]))->toBe(22750);
    });

    it('applies the minimum weight', function () use ($wdf) {
        expect(Billing::lineSubtotalCents($wdf + ['weight_kg' => 1.2]))->toBe(10500);
        expect(Billing::billableQuantity($wdf + ['weight_kg' => 1.2]))->toEqual(3);
    });

    it('bills nothing for an empty per-kg line', function () use ($wdf) {
        expect(Billing::lineSubtotalCents($wdf + ['weight_kg' => 0]))->toBe(0);
    });

    it('avoids float errors on 0.1 kg steps', function () use ($wdf) {
        expect(Billing::lineSubtotalCents($wdf + ['weight_kg' => 7.5]))->toBe(26250);
        expect(Billing::lineSubtotalCents(['pricing_type' => 'per_kg', 'rate_cents' => 3333, 'weight_kg' => 3.3]))->toBe(10999);
    });

    it('bills per piece and flat', function () {
        expect(Billing::lineSubtotalCents(['pricing_type' => 'per_piece', 'rate_cents' => 1500, 'quantity' => 6]))->toBe(9000);
        expect(Billing::lineSubtotalCents(['pricing_type' => 'flat', 'rate_cents' => 5000]))->toBe(5000);
    });
});

describe('order totals', function () {
    it('sums the mockup order to 367.50', function () {
        expect(Billing::orderTotalCents([22750, 9000, 5000]))->toBe(36750);
    });

    it('ignores voided payments', function () {
        expect(Billing::amountPaidCents([
            ['amount_cents' => 20000, 'voided_at' => null],
            ['amount_cents' => 16750, 'voided_at' => '2026-10-31T10:00:00Z'],
        ]))->toBe(20000);
    });

    it('never returns a negative balance', function () {
        expect(Billing::balanceCents(36750, 20000))->toBe(16750);
        expect(Billing::balanceCents(36750, 40000))->toBe(0);
    });

    it('derives the payment status', function () {
        expect(Billing::paymentStatus(36750, 0))->toBe('unpaid');
        expect(Billing::paymentStatus(36750, 20000))->toBe('partial');
        expect(Billing::paymentStatus(36750, 36750))->toBe('paid');
        expect(Billing::paymentStatus(36750, 40000))->toBe('paid');
    });
});

describe('money', function () {
    it('formats centavos as pesos', function () {
        expect(Money::format(123450))->toBe('₱1,234.50');
        expect(Money::format(0))->toBe('₱0.00');
        expect(Money::rate(3500))->toBe('₱35');
        expect(Money::rate(3550))->toBe('₱35.50');
    });
});
