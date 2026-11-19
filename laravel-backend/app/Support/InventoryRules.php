<?php

namespace App\Support;

/**
 * Supply stock rules, ported from react-frontend/src/lib/inventory.ts. On-hand stock is never
 * stored: it is the signed sum of the movements.
 */
final class InventoryRules
{
    /** Quantities stay exact to three decimals when summed. */
    public static function round(float|int $value): float
    {
        return Js::roundTo($value, 3);
    }

    public static function signedQuantity(string $type, float|int $quantity): float
    {
        return match ($type) {
            'out', 'usage' => -abs((float) $quantity),
            'in' => abs((float) $quantity),
            default => (float) $quantity,
        };
    }

    /** @param  iterable<array{type: string, quantity: float|int}>  $movements */
    public static function onHand(iterable $movements): float
    {
        $sum = 0.0;
        foreach ($movements as $movement) {
            $sum += self::signedQuantity($movement['type'], $movement['quantity']);
        }

        return self::round($sum);
    }

    /** Low at or below the reorder level; Critical at or below half of it. */
    public static function stockStatus(float $onHand, float $reorderLevel): string
    {
        if ($onHand <= $reorderLevel * 0.5) {
            return 'critical';
        }

        return $onHand <= $reorderLevel ? 'low' : 'ok';
    }

    /** Bar fill: a full bar means at least twice the reorder level. */
    public static function levelPercent(float $onHand, float $reorderLevel): int
    {
        if ($reorderLevel <= 0) {
            return $onHand > 0 ? 100 : 0;
        }

        return max(0, min(100, Js::round(($onHand / ($reorderLevel * 2)) * 100)));
    }

    /**
     * Whether a movement may be recorded. Stock-out cannot exceed what is on hand.
     *
     * @return array{ok: true}|array{ok: false, message: string}
     */
    public static function checkMovement(string $type, float $quantity, float $currentOnHand): array
    {
        $shown = self::format($currentOnHand);

        if ($type === 'adjust') {
            if ($quantity == 0) {
                return ['ok' => false, 'message' => 'An adjustment cannot be zero.'];
            }
            if (self::round($currentOnHand + $quantity) < 0) {
                return ['ok' => false, 'message' => "The adjustment would leave less than zero ({$shown} on hand)."];
            }

            return ['ok' => true];
        }

        if ($quantity <= 0) {
            return ['ok' => false, 'message' => 'Quantity must be more than zero.'];
        }

        if ($type === 'out' && $quantity > $currentOnHand) {
            return ['ok' => false, 'message' => "Stock-out cannot exceed the {$shown} on hand."];
        }

        return ['ok' => true];
    }

    /** A quantity as JavaScript prints it: 2, 3.5, 0.125. */
    public static function format(float|int $value): string
    {
        $value = self::round($value);

        return $value == floor($value) ? (string) (int) $value : rtrim(rtrim(number_format($value, 3, '.', ''), '0'), '.');
    }
}
