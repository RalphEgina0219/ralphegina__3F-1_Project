<?php

namespace App\Support;

/**
 * JavaScript number semantics where PHP differs, so ported rules round exactly like the frontend.
 */
final class Js
{
    /** Math.round(): halves round towards +∞ (Math.round(-2.5) === -2), unlike PHP's round(). */
    public static function round(float|int $value): int
    {
        return (int) floor($value + 0.5);
    }

    /** Math.round(value * 10^digits) / 10^digits. */
    public static function roundTo(float|int $value, int $digits): float
    {
        $factor = 10 ** $digits;

        return floor($value * $factor + 0.5) / $factor;
    }
}
