<?php

namespace App\Support;

/**
 * Money rules, ported from react-frontend/src/lib/billing.ts with identical behaviour.
 * Money is whole centavos. Weights are held in whole tenths of a kilogram, so no float reaches
 * the money math.
 */
final class Billing
{
    public static function kgToTenths(float|int|null $weightKg): int
    {
        return Js::round(((float) ($weightKg ?? 0)) * 10);
    }

    /**
     * The billable weight or quantity after any minimum is applied.
     *
     * @param  array{pricing_type: string, rate_cents: int, minimum_qty?: float|int|null, weight_kg?: float|int|null, quantity?: int|null}  $line
     */
    public static function billableQuantity(array $line): float|int
    {
        return match ($line['pricing_type']) {
            'per_kg' => max(self::kgToTenths($line['weight_kg'] ?? 0), self::kgToTenths($line['minimum_qty'] ?? 0)) / 10,
            'per_piece' => $line['quantity'] ?? 0,
            'flat' => 1,
        };
    }

    /**
     * per_kg = max(weight, minimum) × rate; per_piece = quantity × rate; flat = the rate, once.
     *
     * @param  array{pricing_type: string, rate_cents: int, minimum_qty?: float|int|null, weight_kg?: float|int|null, quantity?: int|null}  $line
     */
    public static function lineSubtotalCents(array $line): int
    {
        $rate = (int) $line['rate_cents'];

        switch ($line['pricing_type']) {
            case 'per_kg':
                $weight = self::kgToTenths($line['weight_kg'] ?? 0);
                if ($weight <= 0) {
                    return 0;
                }
                $tenths = max($weight, self::kgToTenths($line['minimum_qty'] ?? 0));

                return Js::round(($tenths * $rate) / 10);
            case 'per_piece':
                return max(0, (int) ($line['quantity'] ?? 0)) * $rate;
            case 'flat':
                return $rate;
        }

        throw new \InvalidArgumentException("Unknown pricing type {$line['pricing_type']}");
    }

    /** @param  iterable<int>  $subtotals */
    public static function orderTotalCents(iterable $subtotals): int
    {
        $sum = 0;
        foreach ($subtotals as $value) {
            $sum += (int) $value;
        }

        return $sum;
    }

    /**
     * The amount paid: every payment that is not voided.
     *
     * @param  iterable<array{amount_cents: int, voided_at: mixed}>  $payments
     */
    public static function amountPaidCents(iterable $payments): int
    {
        $sum = 0;
        foreach ($payments as $payment) {
            if (empty($payment['voided_at'])) {
                $sum += (int) $payment['amount_cents'];
            }
        }

        return $sum;
    }

    /** Never negative. */
    public static function balanceCents(int $totalCents, int $paidCents): int
    {
        return max(0, $totalCents - $paidCents);
    }

    /** unpaid, partial or paid: derived, never stored. */
    public static function paymentStatus(int $totalCents, int $paidCents): string
    {
        if ($paidCents <= 0) {
            return 'unpaid';
        }

        return $paidCents >= $totalCents ? 'paid' : 'partial';
    }
}
