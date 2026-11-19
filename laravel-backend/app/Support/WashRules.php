<?php

namespace App\Support;

/**
 * Wash type and soap rules, ported from react-frontend/src/lib/wash.ts with identical behaviour
 * (both are tested with shared/wash-cases.json).
 *
 * Weights are whole tenths of a kilogram. A wash type's surcharge and its soap both apply to the
 * order's per-kg weight: the actual weights of all per-kg lines, not the billable minimum.
 * Usage is entered per kilo in the item's small unit: g for kg items, mL for L items, pieces for
 * pcs items.
 */
final class WashRules
{
    /**
     * Total weight of the per-kg lines, in tenths of a kilogram. Other lines do not count.
     *
     * @param  iterable<array{pricing_type: string, weight_kg?: float|int|null}>  $lines
     */
    public static function perKgTenths(iterable $lines): int
    {
        $tenths = 0;
        foreach ($lines as $line) {
            if ($line['pricing_type'] === 'per_kg') {
                $tenths += Billing::kgToTenths($line['weight_kg'] ?? 0);
            }
        }

        return $tenths;
    }

    /** surcharge per kg × weight, in whole centavos. */
    public static function surchargeCents(int $perKgTenths, int $surchargePerKgCents): int
    {
        if ($perKgTenths <= 0 || $surchargePerKgCents <= 0) {
            return 0;
        }

        return Js::round(($perKgTenths * $surchargePerKgCents) / 10);
    }

    /**
     * The amount of an item an order uses, in the item's unit.
     * pcs rounds up to whole pieces; kg and L keep three decimals (1 g or 1 mL).
     */
    public static function usageQuantity(string $unitCode, float $usagePerKgSmallUnit, int $perKgTenths): float
    {
        if ($perKgTenths <= 0 || $usagePerKgSmallUnit <= 0) {
            return 0.0;
        }

        $small = Js::roundTo(($usagePerKgSmallUnit * $perKgTenths) / 10, 6);

        return match ($unitCode) {
            'pcs' => (float) ceil($small),
            'kg', 'L' => Js::round($small) / 1000,
            default => throw new \InvalidArgumentException("Soap items use kg, L or pcs, not {$unitCode}"),
        };
    }

    /** A soap quantity the way the shop says it: 1.250 kg, 25 g, 325 mL, 2 pcs. */
    public static function formatAmount(string $unitCode, float $quantity): string
    {
        $quantity = InventoryRules::round($quantity);

        return match (true) {
            $unitCode === 'kg' && $quantity < 1 => Js::round($quantity * 1000).' g',
            $unitCode === 'L' && $quantity < 1 => Js::round($quantity * 1000).' mL',
            $unitCode === 'kg', $unitCode === 'L' => number_format($quantity, 3, '.', '').' '.$unitCode,
            default => InventoryRules::format($quantity).' '.$unitCode,
        };
    }

    /** Usage per kilo as the admin enters it: 25 g/kg, 30 mL/kg, 0.25 pcs/kg. */
    public static function formatUsage(string $unitCode, float $usagePerKgSmallUnit): string
    {
        $small = ['kg' => 'g', 'L' => 'mL'][$unitCode] ?? $unitCode;

        return InventoryRules::format($usagePerKgSmallUnit)." {$small}/kg";
    }

    /** "Fabric conditioner: needs 130 mL, only 80 mL recorded". */
    public static function shortageMessage(string $itemName, string $unitCode, float $needed, float $onHand): string
    {
        return "{$itemName}: needs ".self::formatAmount($unitCode, $needed).', only '.self::formatAmount($unitCode, $onHand).' recorded';
    }
}
