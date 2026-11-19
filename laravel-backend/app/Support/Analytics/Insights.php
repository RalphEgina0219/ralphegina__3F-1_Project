<?php

namespace App\Support\Analytics;

use App\Support\Js;
use App\Support\Money;

/**
 * Plain-language findings from fixed rules, ported from react-frontend/src/lib/analytics/insights.ts.
 * Every rule returns null when it has nothing worth saying.
 */
final class Insights
{
    private static function pct(float|int $share): string
    {
        return Js::round($share * 100).'%';
    }

    /** A number as JavaScript prints it: 22.4, 22, 3.5. */
    public static function num(float|int|null $value): string
    {
        if ($value === null) {
            return 'null';
        }
        if (is_int($value) || floor($value) == $value) {
            return (string) (int) $value;
        }

        return rtrim(rtrim(number_format($value, 10, '.', ''), '0'), '.');
    }

    public static function previousLabel(int $days): string
    {
        return $days === 1 ? 'the previous day' : "the previous {$days} days";
    }

    public static function busiestWeekday(array $points): ?string
    {
        $sum = Series::total($points);
        if ($sum == 0 || count($points) < 7) {
            return null;
        }
        $by = array_fill(0, 7, 0);
        foreach ($points as $p) {
            $by[ManilaTime::weekdayOf($p['date'])] += $p['value'];
        }
        $best = array_search(max($by), $by, true);

        return ManilaTime::WEEKDAYS_LONG[$best].' was the busiest day ('.self::pct($by[$best] / $sum).' of orders).';
    }

    public static function peakDay(array $points, string $unit): ?string
    {
        $peak = null;
        foreach ($points as $p) {
            if ($peak === null || $p['value'] > $peak['value']) {
                $peak = $p;
            }
        }
        if ($peak === null || $peak['value'] == 0 || count($points) < 2) {
            return null;
        }
        $amount = $unit === 'money' ? Money::peso((int) $peak['value']) : "{$peak['value']} orders";

        return 'The busiest day was '.ManilaTime::formatDayLong($peak['date']).", with {$amount}.";
    }

    public static function trendSentence(string $label, float|int|null $delta, int $days): ?string
    {
        if ($delta === null) {
            return null;
        }
        if (abs($delta) < 1) {
            return "{$label} held steady compared with ".self::previousLabel($days).'.';
        }
        $verb = $delta > 0 ? 'rose' : 'fell';

        return "{$label} {$verb} ".number_format(abs($delta), 1, '.', '').'% compared with '.self::previousLabel($days).'.';
    }

    public static function topShare(array $list, string $noun): ?string
    {
        $top = $list[0] ?? null;
        if (! $top || $top['value'] == 0) {
            return null;
        }

        return "{$top['label']} brought in ".self::pct($top['share'])." of {$noun}.";
    }

    public static function oldUnpaid(array $aging): ?string
    {
        foreach ($aging as $bucket) {
            if ($bucket['key'] === '31+') {
                if ($bucket['value'] == 0) {
                    return null;
                }
                $orders = $bucket['extra']['orders'] ?? 0;

                return 'Unpaid balances older than 30 days: '.Money::peso((int) $bucket['value'])." across {$orders} ".($orders === 1 ? 'order' : 'orders').'.';
            }
        }

        return null;
    }

    public static function digitalShare(array $mix): ?string
    {
        $digital = 0;
        $found = false;
        $any = false;
        foreach ($mix as $m) {
            if (in_array($m['key'], ['gcash', 'maya'], true)) {
                $digital += $m['share'];
                $found = true;
            }
            $any = $any || $m['value'] != 0;
        }
        if (! $found || ! $any) {
            return null;
        }

        return 'GCash and Maya were '.self::pct($digital).' of collections; the rest was cash.';
    }

    public static function peakHour(array $heatmap): ?string
    {
        if ($heatmap['total'] === 0) {
            return null;
        }
        $best = ['weekday' => 0, 'hour' => 0, 'count' => -1];
        foreach ($heatmap['cells'] as $weekday => $row) {
            foreach ($row as $index => $count) {
                if ($count > $best['count']) {
                    $best = ['weekday' => $weekday, 'hour' => $heatmap['hours'][$index], 'count' => $count];
                }
            }
        }
        $byHour = [];
        foreach ($heatmap['hours'] as $index => $_) {
            $byHour[$index] = array_sum(array_column($heatmap['cells'], $index));
        }
        $hour = $heatmap['hours'][array_search(max($byHour), $byHour, true)];

        return 'The busiest hour is '.ManilaTime::formatHour($hour).'–'.ManilaTime::formatHour($hour + 1)
            .'; the busiest single slot is '.ManilaTime::WEEKDAYS_LONG[$best['weekday']].' at '.ManilaTime::formatHour($best['hour']).'.';
    }

    public static function turnaroundSentence(array $summary): ?string
    {
        if ($summary['average'] === null || $summary['within_target'] === null) {
            return null;
        }

        return self::pct($summary['within_target']).' of orders were ready within 24 hours (average '.self::num($summary['average']).' hr from drop-off).';
    }

    public static function expressShare(int $express, int $orders): ?string
    {
        return $orders === 0 ? null : 'Express was added to '.self::pct($express / $orders).' of orders.';
    }

    public static function returningShare(array $split): ?string
    {
        if ($split['customers'] === 0) {
            return null;
        }

        return self::pct($split['returning'] / $split['customers'])." of the {$split['customers']} customers served were returning customers.";
    }

    public static function topCustomerSentence(?array $row): ?string
    {
        if (! $row || $row['spend'] == 0) {
            return null;
        }

        return "{$row['name']} was the top customer: ".Money::peso((int) $row['spend'])." across {$row['orders']} ".($row['orders'] === 1 ? 'order' : 'orders').'.';
    }

    public static function topBarangay(array $list): ?string
    {
        $top = $list[0] ?? null;

        return $top ? "{$top['label']} has the most customers ({$top['value']}, ".self::pct($top['share']).').' : null;
    }

    public static function staffLeader(array $rows): ?string
    {
        $top = $rows[0] ?? null;
        if (! $top || $top['status_updates'] === 0) {
            return null;
        }

        return "{$top['name']} made the most status updates ({$top['status_updates']}).";
    }

    /** @param  array<int, int|null>  $daysLeft */
    public static function stockWarnings(array $items, array $daysLeft): array
    {
        $lines = [];
        foreach ($items as $item) {
            if ($item['stock_status'] === 'critical') {
                $lines[] = "{$item['name']} is critically low: ".self::num($item['on_hand'])." {$item['unit']} left, reorder level ".self::num($item['reorder_level'])." {$item['unit']}.";
            }
        }

        $soonest = null;
        foreach ($items as $item) {
            if ($item['stock_status'] === 'critical' || ($daysLeft[$item['id']] ?? null) === null) {
                continue;
            }
            if ($soonest === null || $daysLeft[$item['id']] < $soonest[1]) {
                $soonest = [$item, $daysLeft[$item['id']]];
            }
        }
        if ($soonest && $soonest[1] <= 14) {
            $lines[] = "{$soonest[0]['name']} will run out in about {$soonest[1]} ".($soonest[1] === 1 ? 'day' : 'days').' at the current rate.';
        }

        return $lines;
    }
}
