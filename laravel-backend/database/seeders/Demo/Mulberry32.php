<?php

namespace Database\Seeders\Demo;

/**
 * The frontend seed's random generator (mocks/seed.ts), reproduced bit for bit with JavaScript's
 * 32-bit integer semantics, so the Laravel demo has exactly the same shop history.
 */
final class Mulberry32
{
    private int $state;

    public function __construct(int $seed)
    {
        $this->state = self::int32($seed);
    }

    /** A float in [0, 1), like the JavaScript version. */
    public function next(): float
    {
        $this->state = self::int32($this->state + 0x6D2B79F5);
        $t = self::imul($this->state ^ self::urs($this->state, 15), self::int32(1 | $this->state));
        $t = self::int32(self::int32($t + self::imul($t ^ self::urs($t, 7), self::int32(61 | $t))) ^ $t);

        return (self::int32($t ^ self::urs($t, 14)) & 0xFFFFFFFF) / 4294967296;
    }

    /** ToInt32: wrap to a signed 32-bit integer. */
    private static function int32(int $value): int
    {
        $value &= 0xFFFFFFFF;

        return $value >= 0x80000000 ? $value - 0x100000000 : $value;
    }

    /** x >>> n on a 32-bit value. */
    private static function urs(int $value, int $bits): int
    {
        return ($value & 0xFFFFFFFF) >> $bits;
    }

    /** Math.imul: the low 32 bits of the product, signed. */
    private static function imul(int $a, int $b): int
    {
        $a = self::int32($a);
        $b = self::int32($b);
        // Split to stay exact inside 64 bits: (aHigh·2^16 + aLow)·b mod 2^32.
        $low = ($a & 0xFFFF) * $b;
        $high = (($a >> 16) & 0xFFFF) * $b;

        return self::int32($low + (($high & 0xFFFF) << 16));
    }
}
