<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use DateTimeInterface;

/** Timestamps as JavaScript's toISOString() prints them: 2026-11-08T05:40:00.000Z (UTC). */
final class Iso
{
    public static function format(DateTimeInterface|string|null $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $date = $value instanceof DateTimeInterface
            ? CarbonImmutable::instance($value)
            : CarbonImmutable::parse($value, config('app.timezone'));

        return $date->utc()->format('Y-m-d\TH:i:s.v\Z');
    }
}
