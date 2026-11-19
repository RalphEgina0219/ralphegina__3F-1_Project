<?php

namespace App\Support\Analytics;

use App\Support\Js;
use App\Support\StatusRules;

/**
 * The aggregations behind the dashboard and every report, ported from
 * react-frontend/src/lib/analytics/series.ts with identical results. Money stays in integer
 * centavos; days and hours are Manila time; ranges are inclusive; sums over days are zero-filled.
 *
 * Facts are plain arrays (see Facts::load()); instants are epoch milliseconds.
 */
final class Series
{
    /** The shop is open 7 AM to 7 PM: drop-off hours 7 through 18. */
    public const SHOP_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

    public const ACTIVE_STAGES = StatusRules::BOARD;

    public const METHOD_LABELS = ['cash' => 'Cash', 'gcash' => 'GCash', 'maya' => 'Maya'];

    public const UNPAID_AGE_BUCKETS = [
        ['key' => '0-7', 'label' => '0–7 days', 'min' => 0, 'max' => 7],
        ['key' => '8-30', 'label' => '8–30 days', 'min' => 8, 'max' => 30],
        ['key' => '31+', 'label' => 'Over 30 days', 'min' => 31, 'max' => INF],
    ];

    public const AGING_BUCKETS = [
        ['key' => 'lt1', 'label' => '< 1 day', 'min' => 0, 'max' => 1],
        ['key' => '1-2', 'label' => '1–2 days', 'min' => 1, 'max' => 2],
        ['key' => '2-3', 'label' => '2–3 days', 'min' => 2, 'max' => 3],
        ['key' => 'gt3', 'label' => '> 3 days', 'min' => 3, 'max' => INF],
    ];

    public static function round1(float|int $value): float|int
    {
        return Js::roundTo($value, 1);
    }

    /** String comparison like JavaScript's localeCompare (case-insensitive first). */
    public static function compare(string $a, string $b): int
    {
        static $collator = null;
        if ($collator === null && class_exists(\Collator::class)) {
            $collator = new \Collator('en');
        }

        return $collator ? $collator->compare($a, $b) : strnatcasecmp($a, $b);
    }

    /**
     * Sums value(row) into each day of the range by when(row), zero-filled.
     *
     * @return list<array{date: string, value: int|float}>
     */
    public static function sumByDay(array $rows, array $range, callable $when, ?callable $value = null): array
    {
        $totals = array_fill_keys(ManilaTime::eachDay($range), 0);
        foreach ($rows as $row) {
            $at = $when($row);
            if ($at === null) {
                continue;
            }
            $day = ManilaTime::day($at);
            if (array_key_exists($day, $totals)) {
                $totals[$day] += $value ? $value($row) : 1;
            }
        }

        $points = [];
        foreach ($totals as $date => $total) {
            $points[] = ['date' => (string) $date, 'value' => $total];
        }

        return $points;
    }

    /** Lines the comparison range up with the current one, point by point. */
    public static function withPrevious(array $current, array $previous): array
    {
        return array_map(
            fn ($point, $index) => $point + ['previous' => $previous[$index]['value'] ?? null],
            $current,
            array_keys($current),
        );
    }

    public static function total(array $points): int|float
    {
        $sum = 0;
        foreach ($points as $point) {
            $sum += $point['value'] ?? 0;
        }

        return $sum;
    }

    /** @return list<int|float> */
    public static function values(array $points): array
    {
        return array_map(fn ($p) => $p['value'] ?? 0, $points);
    }

    /** Percent change, one decimal. Null when the previous value is zero or missing. */
    public static function deltaPct(int|float|null $current, int|float|null $previous): int|float|null
    {
        if ($current === null || $previous === null || $previous == 0) {
            return null;
        }

        return self::round1((($current - $previous) / abs($previous)) * 100);
    }

    /**
     * Splits $amount centavos in proportion to $weights with no centavo lost or invented: the
     * largest-remainder method. 1000 over [100, 100, 100] gives [334, 333, 333].
     *
     * @param  list<int|float>  $weights
     * @return list<int>
     */
    public static function allocate(int $amount, array $weights): array
    {
        $sum = array_sum($weights);
        if ($sum <= 0) {
            return array_map(fn ($w, $i) => $i === 0 ? $amount : 0, $weights, array_keys($weights));
        }

        $exact = array_map(fn ($w) => ($amount * $w) / $sum, $weights);
        $floors = array_map(fn ($v) => (int) floor($v), $exact);
        $left = $amount - array_sum($floors);

        $order = [];
        foreach ($exact as $index => $value) {
            $order[] = ['index' => $index, 'rest' => $value - floor($value)];
        }
        usort($order, fn ($a, $b) => ($b['rest'] <=> $a['rest']) ?: ($a['index'] <=> $b['index']));

        foreach ($order as $entry) {
            if ($left <= 0) {
                break;
            }
            $floors[$entry['index']]++;
            $left--;
        }

        return $floors;
    }

    public static function livePayments(array $payments, array $range): array
    {
        return array_values(array_filter($payments, fn ($p) => ! $p['voided'] && ManilaTime::inRange($p['paid_at'], $range)));
    }

    public static function receivedIn(array $orders, array $range): array
    {
        return array_values(array_filter($orders, fn ($o) => ManilaTime::inRange($o['received_at'], $range)));
    }

    // Money ------------------------------------------------------------------------------------

    /** Sales = money collected: every payment not voided, on the day it was paid. */
    public static function salesByDay(array $payments, array $range): array
    {
        return self::sumByDay(
            array_filter($payments, fn ($p) => ! $p['voided']),
            $range,
            fn ($p) => $p['paid_at'],
            fn ($p) => $p['amount_cents'],
        );
    }

    public static function salesTotal(array $payments, array $range): int
    {
        return (int) array_sum(array_column(self::livePayments($payments, $range), 'amount_cents'));
    }

    /** Each payment split across its order's services in proportion to their subtotals. */
    public static function revenueByService(array $orders, array $payments, array $range): array
    {
        $lines = array_column($orders, 'lines', 'id');
        $byService = [];
        foreach (self::livePayments($payments, $range) as $payment) {
            $orderLines = $lines[$payment['order_id']] ?? [];
            $parts = self::allocate($payment['amount_cents'], array_column($orderLines, 'subtotal_cents'));
            foreach ($orderLines as $index => $line) {
                $byService[$line['service_id']] ??= ['label' => $line['service_name'], 'value' => 0];
                $byService[$line['service_id']]['value'] += $parts[$index] ?? 0;
            }
        }

        $list = [];
        foreach ($byService as $id => $entry) {
            $list[] = ['key' => (string) $id, 'label' => $entry['label'], 'value' => $entry['value']];
        }

        return self::withShares($list);
    }

    public static function withShares(array $list): array
    {
        $sum = array_sum(array_column($list, 'value'));
        $list = array_map(fn ($item) => $item + ['share' => $sum > 0 ? $item['value'] / $sum : 0], $list);
        usort($list, fn ($a, $b) => ($b['value'] <=> $a['value']) ?: self::compare($a['label'], $b['label']));

        return $list;
    }

    /** Cash vs GCash collected. Both always present, in that order. */
    public static function paymentMix(array $payments, array $range): array
    {
        $live = self::livePayments($payments, $range);
        $sum = array_sum(array_column($live, 'amount_cents'));

        return array_map(function ($method) use ($live, $sum) {
            $mine = array_filter($live, fn ($p) => $p['method'] === $method);
            $value = (int) array_sum(array_column($mine, 'amount_cents'));

            return [
                'key' => $method,
                'label' => self::METHOD_LABELS[$method],
                'value' => $value,
                'share' => $sum > 0 ? $value / $sum : 0,
                'extra' => ['count' => count($mine)],
            ];
        }, ['cash', 'gcash', 'maya']);
    }

    /** For orders received in the range: billed, collected so far, and still owed. */
    public static function collectedVsOutstanding(array $orders, array $range): array
    {
        $inside = self::receivedIn($orders, $range);
        $billed = (int) array_sum(array_column($inside, 'total_cents'));
        $collected = 0;
        $unpaid = 0;
        foreach ($inside as $o) {
            $collected += min($o['paid_cents'], $o['total_cents']);
            if ($o['paid_cents'] < $o['total_cents']) {
                $unpaid++;
            }
        }

        return ['billed' => $billed, 'collected' => $collected, 'outstanding' => $billed - $collected, 'unpaid_orders' => $unpaid];
    }

    /** What customers owed at the close of each day. */
    public static function outstandingByDay(array $orders, array $payments, array $range): array
    {
        $paidByOrder = [];
        foreach ($payments as $p) {
            if (! $p['voided']) {
                $paidByOrder[$p['order_id']][] = [$p['paid_at'], $p['amount_cents']];
            }
        }

        $points = [];
        foreach (ManilaTime::eachDay($range) as $date) {
            $close = ManilaTime::dayEnd($date);
            $owed = 0;
            foreach ($orders as $order) {
                if ($order['received_at'] >= $close) {
                    continue;
                }
                $paid = 0;
                foreach ($paidByOrder[$order['id']] ?? [] as [$at, $amount]) {
                    if ($at < $close) {
                        $paid += $amount;
                    }
                }
                $owed += max(0, $order['total_cents'] - $paid);
            }
            $points[] = ['date' => $date, 'value' => $owed];
        }

        return $points;
    }

    /** Unpaid balances by how long ago the order came in. */
    public static function unpaidAging(array $orders, int $now): array
    {
        $list = array_map(function ($bucket) use ($orders, $now) {
            $value = 0;
            $count = 0;
            foreach ($orders as $o) {
                if ($o['paid_cents'] >= $o['total_cents']) {
                    continue;
                }
                $age = (int) floor(($now - $o['received_at']) / ManilaTime::DAY_MS);
                if ($age >= $bucket['min'] && $age <= $bucket['max']) {
                    $value += $o['total_cents'] - $o['paid_cents'];
                    $count++;
                }
            }

            return ['key' => $bucket['key'], 'label' => $bucket['label'], 'value' => $value, 'share' => 0, 'extra' => ['orders' => $count]];
        }, self::UNPAID_AGE_BUCKETS);
        $sum = array_sum(array_column($list, 'value'));

        return array_map(fn ($item) => ['share' => $sum > 0 ? $item['value'] / $sum : 0] + $item, $list);
    }

    // Volume -----------------------------------------------------------------------------------

    public static function ordersByDay(array $orders, array $range): array
    {
        return self::sumByDay($orders, $range, fn ($o) => $o['received_at']);
    }

    public static function kilosByDay(array $orders, array $range): array
    {
        return array_map(
            fn ($p) => ['date' => $p['date'], 'value' => self::round1($p['value'])],
            self::sumByDay($orders, $range, fn ($o) => $o['received_at'], fn ($o) => $o['kilos']),
        );
    }

    /** Billed per order for orders received in the range, in centavos. */
    public static function averageOrderValue(array $orders, array $range): ?int
    {
        $inside = self::receivedIn($orders, $range);
        if ($inside === []) {
            return null;
        }

        return Js::round(array_sum(array_column($inside, 'total_cents')) / count($inside));
    }

    /** Orders sitting in each work stage right now. */
    public static function statusPipeline(array $orders): array
    {
        $active = array_filter($orders, fn ($o) => $o['status'] !== 'released');
        $count = count($active);

        return array_map(function ($status) use ($active, $count) {
            $value = count(array_filter($active, fn ($o) => $o['status'] === $status));

            return ['key' => $status, 'label' => StatusRules::label($status), 'value' => $value, 'share' => $count ? $value / $count : 0];
        }, self::ACTIVE_STAGES);
    }

    /** Orders received in the range by their current status. */
    public static function statusDistribution(array $orders, array $range): array
    {
        $inside = self::receivedIn($orders, $range);
        $count = count($inside);

        return array_map(function ($status) use ($inside, $count) {
            $value = count(array_filter($inside, fn ($o) => $o['status'] === $status));

            return ['key' => $status, 'label' => StatusRules::label($status), 'value' => $value, 'share' => $count ? $value / $count : 0];
        }, StatusRules::ORDER);
    }

    /** Drop-offs by weekday (Mon–Sun) and shop hour (7 AM–6 PM). */
    public static function dropoffHeatmap(array $orders, array $range): array
    {
        $cells = array_fill(0, 7, array_fill(0, count(self::SHOP_HOURS), 0));
        $total = 0;
        foreach (self::receivedIn($orders, $range) as $order) {
            $hourIndex = array_search(ManilaTime::hour($order['received_at']), self::SHOP_HOURS, true);
            if ($hourIndex === false) {
                continue;
            }
            $cells[ManilaTime::weekday($order['received_at'])][$hourIndex]++;
            $total++;
        }

        return [
            'weekdays' => [0, 1, 2, 3, 4, 5, 6],
            'hours' => self::SHOP_HOURS,
            'cells' => $cells,
            'max' => max(0, ...array_merge(...$cells)),
            'total' => $total,
        ];
    }

    /** Drop-offs on one day, by shop hour. */
    public static function dropoffsByHour(array $orders, string $day): array
    {
        $counts = array_fill(0, count(self::SHOP_HOURS), 0);
        foreach ($orders as $o) {
            if (ManilaTime::day($o['received_at']) === $day) {
                $index = array_search(ManilaTime::hour($o['received_at']), self::SHOP_HOURS, true);
                if ($index !== false) {
                    $counts[$index]++;
                }
            }
        }
        $sum = array_sum($counts);

        return array_map(fn ($hour, $index) => [
            'key' => (string) $hour,
            'label' => (string) $hour,
            'value' => $counts[$index],
            'share' => $sum ? $counts[$index] / $sum : 0,
        ], self::SHOP_HOURS, array_keys(self::SHOP_HOURS));
    }

    public static function turnaroundHours(array $order): ?float
    {
        return $order['ready_at'] !== null ? ($order['ready_at'] - $order['received_at']) / ManilaTime::HOUR_MS : null;
    }

    /** Average hours from Received to Ready, by the day orders became ready. Empty days: null. */
    public static function turnaroundByDay(array $orders, array $range): array
    {
        $sums = array_fill_keys(ManilaTime::eachDay($range), [0, 0]);
        foreach ($orders as $order) {
            $hours = self::turnaroundHours($order);
            if ($hours === null) {
                continue;
            }
            $day = ManilaTime::day($order['ready_at']);
            if (! array_key_exists($day, $sums)) {
                continue;
            }
            $sums[$day][0] += $hours;
            $sums[$day][1]++;
        }

        $points = [];
        foreach ($sums as $date => [$sum, $count]) {
            $points[] = ['date' => (string) $date, 'value' => $count ? self::round1($sum / $count) : null, 'count' => $count];
        }

        return $points;
    }

    /** Average turnaround over the range and the share ready within $target hours. */
    public static function turnaroundSummary(array $orders, array $range, int $target = 24): array
    {
        $hours = [];
        foreach ($orders as $o) {
            if ($o['ready_at'] !== null && ManilaTime::inRange($o['ready_at'], $range)) {
                $hours[] = self::turnaroundHours($o);
            }
        }
        $count = count($hours);

        return [
            'average' => $count ? self::round1(array_sum($hours) / $count) : null,
            'within_target' => $count ? count(array_filter($hours, fn ($h) => $h <= $target)) / $count : null,
            'count' => $count,
        ];
    }

    /** Orders ready for pickup by how long they have waited. */
    public static function readyAging(array $orders, int $now): array
    {
        $ready = array_filter($orders, fn ($o) => $o['status'] === 'ready_for_pickup');
        $count = count($ready);

        return array_map(function ($bucket) use ($ready, $count, $now) {
            $value = count(array_filter($ready, function ($o) use ($bucket, $now) {
                $days = ($now - $o['status_since']) / ManilaTime::DAY_MS;

                return $days >= $bucket['min'] && $days < $bucket['max'];
            }));

            return ['key' => $bucket['key'], 'label' => $bucket['label'], 'value' => $value, 'share' => $count ? $value / $count : 0];
        }, self::AGING_BUCKETS);
    }

    /** Active work by estimated completion: overdue, then today and the next days, by stage. */
    public static function workloadDue(array $orders, int $now, int $days = 3): array
    {
        $today = ManilaTime::day($now);
        $working = array_filter($orders, fn ($o) => $o['status'] !== 'released' && $o['status'] !== 'ready_for_pickup');
        $stages = array_values(array_filter(self::ACTIVE_STAGES, fn ($s) => $s !== 'ready_for_pickup'));

        $point = function (string $key, string $label, callable $match) use ($working, $stages) {
            $values = [];
            foreach ($stages as $stage) {
                $values[$stage] = count(array_filter($working, fn ($o) => $o['status'] === $stage && $match($o)));
            }

            return ['key' => $key, 'label' => $label, 'values' => $values];
        };

        $points = [$point('overdue', 'Overdue', fn ($o) => $o['promised_at'] < $now)];
        for ($i = 0; $i < $days; $i++) {
            $day = ManilaTime::addDays($today, $i);
            $label = $i === 0 ? 'Today' : ($i === 1 ? 'Tomorrow' : ManilaTime::formatDayShort($day));
            $points[] = $point($day, $label, fn ($o) => $o['promised_at'] >= $now && ManilaTime::day($o['promised_at']) === $day);
        }

        return $points;
    }

    /** Orders with any status change on each day. */
    public static function ordersHandledByDay(array $changes, array $range): array
    {
        $seen = array_fill_keys(ManilaTime::eachDay($range), []);
        foreach ($changes as $change) {
            $day = ManilaTime::day($change['changed_at']);
            if (array_key_exists($day, $seen)) {
                $seen[$day][$change['order_id']] = true;
            }
        }

        $points = [];
        foreach ($seen as $date => $ids) {
            $points[] = ['date' => (string) $date, 'value' => count($ids)];
        }

        return $points;
    }

    // Customers --------------------------------------------------------------------------------

    /** @return array<int, string> customer id => the day of their first order */
    public static function firstOrderDays(array $orders): array
    {
        $first = [];
        foreach ($orders as $order) {
            $day = ManilaTime::day($order['received_at']);
            if (! isset($first[$order['customer_id']]) || $day < $first[$order['customer_id']]) {
                $first[$order['customer_id']] = $day;
            }
        }

        return $first;
    }

    /** Distinct customers each week (Monday start, clipped to the range): new and returning. */
    public static function newVsReturningByWeek(array $orders, array $range): array
    {
        $first = self::firstOrderDays($orders);
        $weeks = [];
        foreach (ManilaTime::eachDay($range) as $day) {
            $start = ManilaTime::weekStart($day);
            $weeks[$start] ??= ['from' => $day, 'to' => $day, 'fresh' => [], 'back' => []];
            $weeks[$start]['to'] = $day;
        }

        foreach (self::receivedIn($orders, $range) as $order) {
            $start = ManilaTime::weekStart(ManilaTime::day($order['received_at']));
            if (! isset($weeks[$start])) {
                continue;
            }
            $week = &$weeks[$start];
            $firstDay = $first[$order['customer_id']] ?? ManilaTime::day($order['received_at']);
            if ($firstDay >= $week['from'] && $firstDay <= $week['to']) {
                $week['fresh'][$order['customer_id']] = true;
            } elseif (! isset($week['fresh'][$order['customer_id']])) {
                $week['back'][$order['customer_id']] = true;
            }
            unset($week);
        }

        return array_values(array_map(fn ($week) => [
            'key' => $week['from'],
            'label' => 'Week of '.ManilaTime::formatDayShort($week['from']),
            'values' => ['new' => count($week['fresh']), 'returning' => count($week['back'])],
        ], $weeks));
    }

    /** Distinct customers in the range: new (first ever order in the range) and returning. */
    public static function customerSplit(array $orders, array $range): array
    {
        $first = self::firstOrderDays($orders);
        $served = array_unique(array_column(self::receivedIn($orders, $range), 'customer_id'));
        $fresh = 0;
        foreach ($served as $id) {
            $day = $first[$id] ?? null;
            if ($day && $day >= $range['from'] && $day <= $range['to']) {
                $fresh++;
            }
        }

        return ['customers' => count($served), 'new' => $fresh, 'returning' => count($served) - $fresh];
    }

    /** Customers by money paid in the range, with their orders received in the range. */
    public static function topCustomers(array $orders, array $payments, array $range, int $limit = 10): array
    {
        $byId = array_column($orders, null, 'id');
        $rows = [];
        $entry = function (array $order) use (&$rows) {
            $rows[$order['customer_id']] ??= [
                'id' => $order['customer_id'],
                'name' => $order['customer_name'],
                'barangay' => $order['barangay'],
                'spend' => 0,
                'orders' => [],
            ];

            return $order['customer_id'];
        };
        foreach (self::livePayments($payments, $range) as $payment) {
            if (isset($byId[$payment['order_id']])) {
                $rows[$entry($byId[$payment['order_id']])]['spend'] += $payment['amount_cents'];
            }
        }
        foreach (self::receivedIn($orders, $range) as $order) {
            $rows[$entry($order)]['orders'][$order['id']] = true;
        }

        $list = array_map(fn ($row) => [
            'id' => $row['id'],
            'name' => $row['name'],
            'barangay' => $row['barangay'],
            'spend' => $row['spend'],
            'orders' => count($row['orders']),
        ], array_values($rows));
        usort($list, fn ($a, $b) => ($b['spend'] <=> $a['spend']) ?: (($b['orders'] <=> $a['orders']) ?: self::compare($a['name'], $b['name'])));

        return array_slice($list, 0, $limit);
    }

    /** Distinct customers served in the range, by barangay. */
    public static function customersByBarangay(array $orders, array $range): array
    {
        $by = [];
        foreach (self::receivedIn($orders, $range) as $order) {
            $by[$order['barangay']][$order['customer_id']] = true;
        }

        $list = [];
        foreach ($by as $label => $ids) {
            $list[] = ['key' => (string) $label, 'label' => (string) $label, 'value' => count($ids)];
        }

        return self::withShares($list);
    }

    // Services ---------------------------------------------------------------------------------

    /** Per service: orders, kilos, pieces, revenue (payments allocated) and billed per order. */
    public static function serviceStats(array $orders, array $payments, array $range): array
    {
        $revenue = [];
        foreach (self::revenueByService($orders, $payments, $range) as $row) {
            $revenue[(int) $row['key']] = $row['value'];
        }

        $stats = [];
        foreach (self::receivedIn($orders, $range) as $order) {
            foreach ($order['lines'] as $line) {
                $stats[$line['service_id']] ??= ['id' => $line['service_id'], 'name' => $line['service_name'], 'orders' => 0, 'kilos' => 0, 'pieces' => 0, 'billed' => 0];
                $row = &$stats[$line['service_id']];
                $row['orders']++;
                $row['kilos'] += $line['kilos'];
                $row['pieces'] += $line['pieces'];
                $row['billed'] += $line['subtotal_cents'];
                unset($row);
            }
        }
        foreach (array_keys($revenue) as $id) {
            if (! isset($stats[$id])) {
                $name = 'Service';
                foreach ($orders as $o) {
                    foreach ($o['lines'] as $l) {
                        if ($l['service_id'] === $id) {
                            $name = $l['service_name'];
                            break 2;
                        }
                    }
                }
                $stats[$id] = ['id' => $id, 'name' => $name, 'orders' => 0, 'kilos' => 0, 'pieces' => 0, 'billed' => 0];
            }
        }

        $list = array_map(fn ($row) => array_merge($row, [
            'kilos' => self::round1($row['kilos']),
            'revenue' => $revenue[$row['id']] ?? 0,
            'average' => $row['orders'] ? Js::round($row['billed'] / $row['orders']) : 0,
        ]), array_values($stats));
        usort($list, fn ($a, $b) => ($b['revenue'] <=> $a['revenue']) ?: ($b['orders'] <=> $a['orders']));

        return $list;
    }

    /** Orders using each service, per week of the range. */
    public static function serviceOrdersByWeek(array $orders, array $range): array
    {
        $weeks = [];
        foreach (ManilaTime::eachDay($range) as $day) {
            $start = ManilaTime::weekStart($day);
            $weeks[$start] ??= ['key' => $day, 'label' => 'Week of '.ManilaTime::formatDayShort($day), 'values' => []];
        }
        foreach (self::receivedIn($orders, $range) as $order) {
            $start = ManilaTime::weekStart(ManilaTime::day($order['received_at']));
            if (! isset($weeks[$start])) {
                continue;
            }
            foreach ($order['lines'] as $line) {
                $key = (string) $line['service_id'];
                $weeks[$start]['values'][$key] = ($weeks[$start]['values'][$key] ?? 0) + 1;
            }
        }

        return array_values(array_map(fn ($w) => ['key' => $w['key'], 'label' => $w['label'], 'values' => (object) $w['values']], $weeks));
    }

    /** Orders received in the range, per wash type, most used first (with each one's share). */
    public static function ordersByWashType(array $orders, array $range): array
    {
        $by = [];
        foreach (self::receivedIn($orders, $range) as $order) {
            $by[$order['wash_type']] = ($by[$order['wash_type']] ?? 0) + 1;
        }

        $list = [];
        foreach ($by as $label => $value) {
            $list[] = ['key' => (string) $label, 'label' => (string) $label, 'value' => $value];
        }
        usort($list, fn ($a, $b) => ($b['value'] <=> $a['value']) ?: self::compare($a['label'], $b['label']));

        return self::withShares($list);
    }

    /**
     * Soap used by orders in the range. Per item: the amount by wash type (one chart per item, so
     * every bar shares a unit), the amount used by orders against manual stock-outs, and how many
     * orders used it (the top soaps).
     *
     * @return array{by_wash_type: list<array<string, mixed>>, by_source: list<array<string, mixed>>, top: list<array<string, mixed>>}
     */
    public static function soapUsage(array $movements, array $items, array $orders, array $range): array
    {
        $byOrder = array_column($orders, null, 'id');
        $inside = array_filter($movements, fn ($m) => ManilaTime::inRange($m['moved_at'], $range));
        $byWash = [];
        $bySource = [];
        $top = [];

        foreach ($items as $item) {
            $bySource[$item['id']] = ['item_id' => $item['id'], 'label' => $item['name'], 'unit' => $item['unit'], 'orders' => 0, 'manual' => 0];
        }
        foreach ($inside as $m) {
            $item = null;
            foreach ($items as $candidate) {
                if ($candidate['id'] === $m['item_id']) {
                    $item = $candidate;
                    break;
                }
            }
            if (! $item) {
                continue;
            }
            if ($m['type'] === 'out') {
                $bySource[$item['id']]['manual'] += $m['quantity'];
            } elseif ($m['type'] === 'usage') {
                $bySource[$item['id']]['orders'] += $m['quantity'];
                $wash = $byOrder[$m['order_id']]['wash_type'] ?? 'Unknown';
                $byWash[$item['id']]['item'] = $item;
                $byWash[$item['id']]['by'][$wash] = ($byWash[$item['id']]['by'][$wash] ?? 0) + $m['quantity'];
                $top[$item['id']]['item'] = $item;
                $top[$item['id']]['amount'] = ($top[$item['id']]['amount'] ?? 0) + $m['quantity'];
                $top[$item['id']]['orders'][$m['order_id']] = true;
            }
        }

        $byWashList = [];
        foreach ($byWash as $row) {
            $points = [];
            foreach ($row['by'] as $label => $value) {
                $points[] = ['key' => (string) $label, 'label' => (string) $label, 'value' => Js::roundTo($value, 3)];
            }
            usort($points, fn ($a, $b) => ($b['value'] <=> $a['value']) ?: self::compare($a['label'], $b['label']));
            $byWashList[] = ['item_id' => $row['item']['id'], 'label' => $row['item']['name'], 'unit' => $row['item']['unit'], 'total' => Js::roundTo(array_sum(array_column($points, 'value')), 3), 'points' => self::withShares($points)];
        }

        $topList = [];
        foreach ($top as $row) {
            $topList[] = ['key' => (string) $row['item']['id'], 'label' => $row['item']['name'], 'unit' => $row['item']['unit'], 'value' => count($row['orders']), 'amount' => Js::roundTo($row['amount'], 3)];
        }
        usort($topList, fn ($a, $b) => ($b['value'] <=> $a['value']) ?: (($b['amount'] <=> $a['amount']) ?: self::compare($a['label'], $b['label'])));

        return [
            'by_wash_type' => $byWashList,
            'by_source' => array_values(array_map(fn ($r) => array_merge($r, ['orders' => Js::roundTo($r['orders'], 3), 'manual' => Js::roundTo($r['manual'], 3)]), $bySource)),
            'top' => array_slice($topList, 0, 5),
        ];
    }

    // Staff and stock --------------------------------------------------------------------------

    /** Per staff member: status updates made and orders taken at the counter, in the range. */
    public static function staffActivity(array $staff, array $changes, array $orders, array $range): array
    {
        $inside = self::receivedIn($orders, $range);
        $rows = [];
        foreach ($staff as $member) {
            $mine = array_filter($changes, fn ($c) => $c['changed_by'] === $member['id'] && $c['to_status'] !== 'received' && ManilaTime::inRange($c['changed_at'], $range));
            $days = [];
            foreach ($mine as $c) {
                $days[ManilaTime::day($c['changed_at'])] = true;
            }
            $row = [
                'id' => $member['id'],
                'name' => $member['name'],
                'status_updates' => count($mine),
                'orders_created' => count(array_filter($inside, fn ($o) => $o['received_by'] === $member['id'])),
                'completed' => count(array_filter($mine, fn ($c) => $c['to_status'] === 'released')),
                'active_days' => count($days),
            ];
            if ($row['status_updates'] + $row['orders_created'] > 0) {
                $rows[] = $row;
            }
        }
        usort($rows, fn ($a, $b) => ($b['status_updates'] <=> $a['status_updates']) ?: self::compare($a['name'], $b['name']));

        return $rows;
    }

    /** @return array<int, list<array{date: string, value: int|float}>> item id => daily units used */
    public static function stockUsageByDay(array $movements, array $items, array $range): array
    {
        $usage = [];
        foreach ($items as $item) {
            $usage[$item['id']] = array_map(
                fn ($p) => ['date' => $p['date'], 'value' => Js::roundTo($p['value'], 3)],
                self::sumByDay(
                    array_filter($movements, fn ($m) => $m['item_id'] === $item['id'] && in_array($m['type'], ['out', 'usage'], true)),
                    $range,
                    fn ($m) => $m['moved_at'],
                    fn ($m) => $m['quantity'],
                ),
            );
        }

        return $usage;
    }

    /** Days of stock left at the average daily use of the range; null when nothing was used. */
    public static function daysOfStockLeft(array $item, array $usage): ?int
    {
        $used = self::total($usage);
        if ($used <= 0) {
            return null;
        }

        return (int) floor($item['on_hand'] / ($used / count($usage)));
    }
}
