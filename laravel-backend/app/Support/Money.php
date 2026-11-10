<?php

namespace App\Support;

/** Peso formatting, as react-frontend/src/lib/money.ts prints it (en-PH). */
final class Money
{
    /** 123450 -> ₱1,234.50 */
    public static function format(int $cents): string
    {
        return ($cents < 0 ? '-' : '').'₱'.number_format(abs($cents) / 100, 2);
    }

    /** 486000 -> ₱4,860 (rounded to the peso) */
    public static function peso(int $cents): string
    {
        $pesos = Js::round($cents / 100);

        return ($pesos < 0 ? '-' : '').'₱'.number_format(abs($pesos));
    }

    /** 3500 -> ₱35, 3550 -> ₱35.50 */
    public static function rate(int $cents): string
    {
        return $cents % 100 === 0 ? self::peso($cents) : self::format($cents);
    }
}
