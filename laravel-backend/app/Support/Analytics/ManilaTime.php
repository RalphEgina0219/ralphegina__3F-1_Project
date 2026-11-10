<?php

namespace App\Support\Analytics;

/**
 * Shop-time helpers, ported from react-frontend/src/lib/analytics/time.ts. Every report groups by
 * the calendar day and hour in Asia/Manila (UTC+8 all year, so a fixed offset is exact).
 * Instants are epoch milliseconds; days travel as "Y-m-d" keys; ranges are inclusive.
 */
final class ManilaTime
{
    public const OFFSET_MS = 8 * 3_600_000;

    public const DAY_MS = 86_400_000;

    public const HOUR_MS = 3_600_000;

    public const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    public const WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    private const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    /** The Manila calendar day of an instant (ms). */
    public static function day(int|float $ms): string
    {
        return gmdate('Y-m-d', (int) floor(($ms + self::OFFSET_MS) / 1000));
    }

    /** 0 to 23 on a Manila clock. */
    public static function hour(int|float $ms): int
    {
        return (int) gmdate('G', (int) floor(($ms + self::OFFSET_MS) / 1000));
    }

    /** 0 = Monday … 6 = Sunday, in Manila. */
    public static function weekday(int|float $ms): int
    {
        return ((int) gmdate('w', (int) floor(($ms + self::OFFSET_MS) / 1000)) + 6) % 7;
    }

    /** 0 = Monday … 6 = Sunday, for a day key. */
    public static function weekdayOf(string $day): int
    {
        return ((int) gmdate('w', self::keySeconds($day)) + 6) % 7;
    }

    /** The instant (ms) that reads hour:minute on a Manila clock on $day. */
    public static function instant(string $day, int $hour = 0, int $minute = 0): int
    {
        return self::keySeconds($day) * 1000 + ($hour * 60 + $minute) * 60_000 - self::OFFSET_MS;
    }

    /** The first instant after the Manila day ends (exclusive end), in ms. */
    public static function dayEnd(string $day): int
    {
        return self::keySeconds($day) * 1000 - self::OFFSET_MS + self::DAY_MS;
    }

    public static function addDays(string $day, int $days): string
    {
        return gmdate('Y-m-d', self::keySeconds($day) + $days * 86400);
    }

    public static function diffDays(string $a, string $b): int
    {
        return (int) round((self::keySeconds($b) - self::keySeconds($a)) / 86400);
    }

    /** @return list<string> every day key from $from to $to, inclusive */
    public static function eachDay(array $range): array
    {
        $days = [];
        for ($day = $range['from']; $day <= $range['to']; $day = self::addDays($day, 1)) {
            $days[] = $day;
        }

        return $days;
    }

    public static function rangeLength(array $range): int
    {
        return self::diffDays($range['from'], $range['to']) + 1;
    }

    /** The range of the same length that ends the day before $range starts. */
    public static function previousRange(array $range): array
    {
        $to = self::addDays($range['from'], -1);

        return ['from' => self::addDays($to, 1 - self::rangeLength($range)), 'to' => $to];
    }

    public static function inRange(int|float|null $ms, array $range): bool
    {
        if ($ms === null) {
            return false;
        }
        $day = self::day($ms);

        return $day >= $range['from'] && $day <= $range['to'];
    }

    /** The Monday that starts the week holding $day. */
    public static function weekStart(string $day): string
    {
        return self::addDays($day, -self::weekdayOf($day));
    }

    public static function isDayKey(mixed $value): bool
    {
        if (! is_string($value) || ! preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $m)) {
            return false;
        }

        return checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
    }

    /** today, 7d, 30d, this_month or last_month, ending today in Manila. */
    public static function presetRange(string $preset, int $nowMs): array
    {
        $today = self::day($nowMs);
        $firstOfMonth = substr($today, 0, 8).'01';

        return match ($preset) {
            'today' => ['from' => $today, 'to' => $today],
            '7d' => ['from' => self::addDays($today, -6), 'to' => $today],
            'this_month' => ['from' => $firstOfMonth, 'to' => $today],
            'last_month' => (function () use ($firstOfMonth) {
                $to = self::addDays($firstOfMonth, -1);

                return ['from' => substr($to, 0, 8).'01', 'to' => $to];
            })(),
            default => ['from' => self::addDays($today, -29), 'to' => $today],
        };
    }

    /** A range from query parameters, or the fallback; reversed bounds swap, spans cap at $maxDays. */
    public static function parseRange(mixed $from, mixed $to, array $fallback, int $maxDays = 400): array
    {
        if (! self::isDayKey($from) || ! self::isDayKey($to)) {
            return $fallback;
        }
        $range = $from <= $to ? ['from' => $from, 'to' => $to] : ['from' => $to, 'to' => $from];

        return self::rangeLength($range) > $maxDays
            ? ['from' => self::addDays($range['to'], 1 - $maxDays), 'to' => $range['to']]
            : $range;
    }

    /** "Nov 7" */
    public static function formatDayShort(string $day): string
    {
        [, $m, $d] = array_map('intval', explode('-', $day));

        return self::MONTHS[$m - 1].' '.$d;
    }

    /** "Sat, Nov 7" */
    public static function formatDayLong(string $day): string
    {
        return self::WEEKDAYS[self::weekdayOf($day)].', '.self::formatDayShort($day);
    }

    /** "7 AM", "12 PM", "6 PM" */
    public static function formatHour(int $hour): string
    {
        $suffix = $hour < 12 ? 'AM' : 'PM';
        $h = $hour % 12 === 0 ? 12 : $hour % 12;

        return "{$h} {$suffix}";
    }

    /** ms -> "2026-11-08T05:40:00.000Z" */
    public static function iso(int|float|null $ms): ?string
    {
        if ($ms === null) {
            return null;
        }
        $seconds = (int) floor($ms / 1000);
        $millis = (int) ($ms - $seconds * 1000);

        return gmdate('Y-m-d\TH:i:s', $seconds).'.'.str_pad((string) $millis, 3, '0', STR_PAD_LEFT).'Z';
    }

    private static function keySeconds(string $day): int
    {
        [$y, $m, $d] = array_map('intval', explode('-', $day));

        return gmmktime(0, 0, 0, $m, $d, $y);
    }
}
