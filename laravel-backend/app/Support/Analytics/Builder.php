<?php

namespace App\Support\Analytics;

use App\Support\Js;
use App\Support\StatusRules;

/**
 * The dashboard and report documents, assembled from facts. A port of
 * react-frontend/src/lib/analytics/build.ts: the same envelope, series, tables and insights, so the
 * frontend renders Laravel's answers exactly like the mock's.
 *
 * Envelope: { range, compare_range, generated_at, kpis, series, table, insights } (snake_case).
 */
final class Builder
{
    public const TURNAROUND_TARGET_HOURS = 24;

    public const REPORT_KINDS = ['sales', 'orders', 'payments', 'services', 'customers', 'inventory', 'staff'];

    /**
     * @param  array{range: array{from: string, to: string}, compare: bool, now: int}  $query
     */
    public function __construct(private readonly array $facts, private readonly array $query) {}

    private static function kpi(string $key, string $label, string $format, int|float|null $value, int|float|null $previous, array $extra = []): array
    {
        return ['key' => $key, 'label' => $label, 'format' => $format, 'value' => $value, 'previous' => $previous, 'delta_pct' => Series::deltaPct($value, $previous)] + $extra;
    }

    /** Sparklines show at least a week, so a one-day range still has a trend. */
    private static function sparkRange(array $range): array
    {
        return ManilaTime::rangeLength($range) >= 7 ? $range : ['from' => ManilaTime::addDays($range['to'], -6), 'to' => $range['to']];
    }

    private function maybe(mixed $value): mixed
    {
        return $this->query['compare'] ? $value : null;
    }

    private function envelope(array $kpis, array $series, ?array $table, array $insights): array
    {
        return [
            'range' => $this->query['range'],
            'compare_range' => $this->query['compare'] ? ManilaTime::previousRange($this->query['range']) : null,
            'generated_at' => ManilaTime::iso($this->query['now']),
            'kpis' => $kpis,
            'series' => $series,
            'table' => $table,
            'insights' => array_slice(array_values(array_filter($insights, fn ($line) => is_string($line) && $line !== '')), 0, 4),
        ];
    }

    private static function round1Total(array $points): float|int
    {
        return Js::roundTo(Series::total($points), 1);
    }

    // Dashboard --------------------------------------------------------------------------------

    public function adminDashboard(): array
    {
        ['orders' => $orders, 'payments' => $payments] = $this->facts;
        $range = $this->query['range'];
        $before = ManilaTime::previousRange($range);
        $spark = self::sparkRange($range);

        $sales = Series::salesByDay($payments, $range);
        $salesNow = Series::total($sales);
        $salesBefore = Series::salesTotal($payments, $before);
        $owedSeries = Series::outstandingByDay($orders, $payments, $spark);
        $owedNow = end($owedSeries)['value'] ?? 0;
        $owedBefore = Series::total(Series::outstandingByDay($orders, $payments, ['from' => $before['to'], 'to' => $before['to']]));
        $unpaidOrders = count(array_filter($orders, fn ($o) => $o['paid_cents'] < $o['total_cents'] && ManilaTime::day($o['received_at']) <= $range['to']));
        $aovSpark = array_map(fn ($day) => Series::averageOrderValue($orders, ['from' => $day, 'to' => $day]) ?? 0, ManilaTime::eachDay($spark));

        $kpis = [
            self::kpi('sales', 'Sales', 'money', $salesNow, $this->maybe($salesBefore), [
                'spark' => Series::values(Series::salesByDay($payments, $spark)),
                'hint' => 'Payments collected',
            ]),
            self::kpi('orders', 'Orders', 'count', Series::total(Series::ordersByDay($orders, $range)), $this->maybe(Series::total(Series::ordersByDay($orders, $before))), [
                'spark' => Series::values(Series::ordersByDay($orders, $spark)),
                'hint' => 'Received in this period',
            ]),
            self::kpi('kilos', 'Kilos processed', 'kg', self::round1Total(Series::kilosByDay($orders, $range)), $this->maybe(self::round1Total(Series::kilosByDay($orders, $before))), [
                'spark' => Series::values(Series::kilosByDay($orders, $spark)),
                'hint' => 'Wash-Dry-Fold and Wash only',
            ]),
            self::kpi('aov', 'Average order value', 'money', Series::averageOrderValue($orders, $range), $this->maybe(Series::averageOrderValue($orders, $before)), [
                'spark' => $aovSpark,
                'hint' => 'Billed per order',
            ]),
            self::kpi('unpaid', 'Unpaid balances', 'money', $owedNow, $this->maybe($owedBefore), [
                'spark' => Series::values($owedSeries),
                'tone' => 'warn',
                'inverse' => true,
                'hint' => "Across {$unpaidOrders} ".($unpaidOrders === 1 ? 'order' : 'orders'),
            ]),
        ];

        $revenue = Series::revenueByService($orders, $payments, $range);
        $heatmap = Series::dropoffHeatmap($orders, $range);
        $series = [
            'role' => 'admin',
            'sales' => $this->query['compare'] ? Series::withPrevious($sales, Series::salesByDay($payments, $before)) : $sales,
            'revenue_by_service' => $revenue,
            'pipeline' => Series::statusPipeline($orders),
            'payment_mix' => Series::paymentMix($payments, $range),
            'heatmap' => $heatmap,
            'turnaround' => Series::turnaroundByDay($orders, $range),
            'turnaround_target' => self::TURNAROUND_TARGET_HOURS,
            'new_vs_returning' => Series::newVsReturningByWeek($orders, $range),
            'collected' => Series::collectedVsOutstanding($orders, $range),
        ];

        return $this->envelope($kpis, $series, null, [
            Insights::trendSentence('Sales', Series::deltaPct($salesNow, $salesBefore), ManilaTime::rangeLength($range)),
            Insights::topShare($revenue, 'revenue'),
            Insights::peakHour($heatmap),
        ]);
    }

    /** Staff see the work, never peso amounts: none of these fields carries money. */
    public function staffDashboard(): array
    {
        ['orders' => $orders, 'changes' => $changes, 'baskets' => $baskets] = $this->facts;
        $range = $this->query['range'];
        $now = $this->query['now'];
        $before = ManilaTime::previousRange($range);
        $today = ManilaTime::day($now);
        $spark = self::sparkRange($range);
        $active = array_filter($orders, fn ($o) => $o['status'] !== 'released');
        $overdue = count(array_filter($active, fn ($o) => $o['status'] === 'ready_for_pickup' && $now - $o['status_since'] > 2 * ManilaTime::DAY_MS));
        $hour = ManilaTime::hour($now);

        $kpis = [
            self::kpi('orders', 'Orders', 'count', Series::total(Series::ordersByDay($orders, $range)), $this->maybe(Series::total(Series::ordersByDay($orders, $before))), [
                'spark' => Series::values(Series::ordersByDay($orders, $spark)),
                'hint' => 'Received in this period',
            ]),
            self::kpi('in_process', 'In process', 'count', count(array_filter($active, fn ($o) => in_array($o['status'], ['washing', 'drying', 'folding'], true))), null, [
                'hint' => 'Washing, drying, folding',
            ]),
            self::kpi('ready', 'Ready for pickup', 'count', count(array_filter($active, fn ($o) => $o['status'] === 'ready_for_pickup')), null, [
                'tone' => 'ok',
                'hint' => 'Waiting for the customer',
            ]),
            self::kpi('overdue_pickups', 'Overdue pickups', 'count', $overdue, null, [
                'tone' => $overdue > 0 ? 'warn' : 'default',
                'inverse' => true,
                'hint' => 'Ready over 2 days',
            ]),
            self::kpi('baskets', 'Baskets in use', 'count', $baskets['in_use'], null, [
                'progress' => ['value' => $baskets['in_use'], 'max' => $baskets['usable']],
                'hint' => "{$baskets['in_use']} of {$baskets['usable']} usable baskets",
            ]),
        ];

        $series = [
            'role' => 'staff',
            'pipeline' => Series::statusPipeline($orders),
            'dropoffs_today' => Series::dropoffsByHour($orders, $today),
            'current_hour' => $hour >= 7 && $hour < 19 ? $hour : null,
            'ready_aging' => Series::readyAging($orders, $now),
            'due' => Series::workloadDue($orders, $now, 3),
            'handled' => Series::ordersHandledByDay($changes, ['from' => ManilaTime::addDays($today, -6), 'to' => $today]),
        ];

        return $this->envelope($kpis, $series, null, []);
    }

    // Reports ----------------------------------------------------------------------------------

    /**
     * Applies the filters every report understands; unknown or empty ones are ignored.
     *
     * @param  array{service?: ?int, method?: ?string, status?: ?string, staff?: ?int, barangay?: ?string, item?: ?int}  $filters
     */
    public static function filterFacts(array $facts, array $filters): array
    {
        ['orders' => $orders, 'payments' => $payments, 'changes' => $changes, 'movements' => $movements, 'items' => $items] = $facts;

        if (! empty($filters['service'])) {
            $id = $filters['service'];
            $lines = array_column($orders, 'lines', 'id');
            $narrowed = [];
            foreach ($payments as $payment) {
                $orderLines = $lines[$payment['order_id']] ?? [];
                $index = array_search($id, array_column($orderLines, 'service_id'), true);
                if ($index === false) {
                    continue;
                }
                $parts = Series::allocate($payment['amount_cents'], array_column($orderLines, 'subtotal_cents'));
                $narrowed[] = ['amount_cents' => $parts[$index] ?? 0] + $payment;
            }
            $payments = $narrowed;
            $orders = array_values(array_filter($orders, fn ($o) => in_array($id, array_column($o['lines'], 'service_id'), true)));
        }
        if (! empty($filters['status'])) {
            $orders = array_values(array_filter($orders, fn ($o) => $o['status'] === $filters['status']));
        }
        if (! empty($filters['barangay'])) {
            $orders = array_values(array_filter($orders, fn ($o) => $o['barangay'] === $filters['barangay']));
        }
        if (! empty($filters['staff'])) {
            $id = $filters['staff'];
            $orders = array_values(array_filter($orders, fn ($o) => $o['received_by'] === $id));
            $payments = array_values(array_filter($payments, fn ($p) => $p['received_by'] === $id));
            $changes = array_values(array_filter($changes, fn ($c) => $c['changed_by'] === $id));
            $movements = array_values(array_filter($movements, fn ($m) => $m['user_id'] === $id));
        }
        if (! empty($filters['method'])) {
            $payments = array_values(array_filter($payments, fn ($p) => $p['method'] === $filters['method']));
        }
        if (! empty($filters['item'])) {
            $items = array_values(array_filter($items, fn ($i) => $i['id'] === $filters['item']));
            $movements = array_values(array_filter($movements, fn ($m) => $m['item_id'] === $filters['item']));
        }
        if (! empty($filters['status']) || ! empty($filters['barangay']) || ! empty($filters['service'])) {
            $ids = array_flip(array_column($orders, 'id'));
            $payments = array_values(array_filter($payments, fn ($p) => isset($ids[$p['order_id']])));
            $changes = array_values(array_filter($changes, fn ($c) => isset($ids[$c['order_id']])));
        }

        return array_merge($facts, compact('orders', 'payments', 'changes', 'movements', 'items'));
    }

    public function report(string $kind): array
    {
        return match ($kind) {
            'sales' => $this->salesReport(),
            'orders' => $this->ordersReport(),
            'payments' => $this->paymentsReport(),
            'services' => $this->servicesReport(),
            'customers' => $this->customersReport(),
            'inventory' => $this->inventoryReport(),
            'staff' => $this->staffReport(),
        };
    }

    private function dailyByMethod(array $payments, array $range, string $method): array
    {
        return Series::sumByDay(
            array_filter($payments, fn ($p) => ! $p['voided'] && $p['method'] === $method),
            $range,
            fn ($p) => $p['paid_at'],
            fn ($p) => $p['amount_cents'],
        );
    }

    private function salesReport(): array
    {
        ['orders' => $orders, 'payments' => $payments] = $this->facts;
        $range = $this->query['range'];
        $before = ManilaTime::previousRange($range);
        $sales = Series::salesByDay($payments, $range);
        $salesNow = Series::total($sales);
        $salesBefore = Series::salesTotal($payments, $before);
        $daily = Series::ordersByDay($orders, $range);
        $kilos = Series::kilosByDay($orders, $range);
        $revenue = Series::revenueByService($orders, $payments, $range);
        $mix = Series::paymentMix($payments, $range);
        $cash = $this->dailyByMethod($payments, $range, 'cash');
        $gcash = $this->dailyByMethod($payments, $range, 'gcash');
        $maya = $this->dailyByMethod($payments, $range, 'maya');

        $kpis = [
            self::kpi('sales', 'Sales', 'money', $salesNow, $this->maybe($salesBefore), ['spark' => Series::values($sales), 'hint' => 'Payments collected']),
            self::kpi('orders', 'Orders', 'count', Series::total($daily), $this->maybe(Series::total(Series::ordersByDay($orders, $before))), ['spark' => Series::values($daily)]),
            self::kpi('aov', 'Average order value', 'money', Series::averageOrderValue($orders, $range), $this->maybe(Series::averageOrderValue($orders, $before)), ['hint' => 'Billed per order']),
            self::kpi('kilos', 'Kilos processed', 'kg', self::round1Total($kilos), $this->maybe(self::round1Total(Series::kilosByDay($orders, $before))), ['spark' => Series::values($kilos)]),
        ];

        $rows = [];
        foreach ($sales as $index => $point) {
            $rows[] = [
                'date' => $point['date'],
                'orders' => $daily[$index]['value'] ?? 0,
                'kilos' => $kilos[$index]['value'] ?? 0,
                'cash' => $cash[$index]['value'] ?? 0,
                'gcash' => $gcash[$index]['value'] ?? 0,
                'maya' => $maya[$index]['value'] ?? 0,
                'sales' => $point['value'],
            ];
        }
        $table = [
            'columns' => [
                ['key' => 'date', 'label' => 'Date', 'format' => 'date'],
                ['key' => 'orders', 'label' => 'Orders', 'format' => 'count'],
                ['key' => 'kilos', 'label' => 'Kilos', 'format' => 'kg'],
                ['key' => 'cash', 'label' => 'Cash', 'format' => 'money', 'optional' => true],
                ['key' => 'gcash', 'label' => 'GCash', 'format' => 'money', 'optional' => true],
                ['key' => 'maya', 'label' => 'Maya', 'format' => 'money', 'optional' => true],
                ['key' => 'sales', 'label' => 'Sales', 'format' => 'money'],
            ],
            'rows' => array_reverse($rows),
            'totals' => [
                'date' => 'Total',
                'orders' => Series::total($daily),
                'kilos' => self::round1Total($kilos),
                'cash' => Series::total($cash),
                'gcash' => Series::total($gcash),
                'maya' => Series::total($maya),
                'sales' => $salesNow,
            ],
        ];
        $series = [
            'sales' => $this->query['compare'] ? Series::withPrevious($sales, Series::salesByDay($payments, $before)) : $sales,
            'revenue_by_service' => $revenue,
            'payment_mix' => $mix,
        ];

        return $this->envelope($kpis, $series, $table, [
            Insights::trendSentence('Sales', Series::deltaPct($salesNow, $salesBefore), ManilaTime::rangeLength($range)),
            Insights::topShare($revenue, 'revenue'),
            Insights::peakDay($sales, 'money'),
            Insights::digitalShare($mix),
        ]);
    }

    private function ordersReport(): array
    {
        $orders = $this->facts['orders'];
        $range = $this->query['range'];
        $before = ManilaTime::previousRange($range);
        $daily = Series::ordersByDay($orders, $range);
        $inside = Series::receivedIn($orders, $range);
        $insideBefore = Series::receivedIn($orders, $before);
        $express = count(array_filter($inside, fn ($o) => $o['express']));
        $expressBefore = count(array_filter($insideBefore, fn ($o) => $o['express']));
        $summary = Series::turnaroundSummary($orders, $range, self::TURNAROUND_TARGET_HOURS);
        $summaryBefore = Series::turnaroundSummary($orders, $before, self::TURNAROUND_TARGET_HOURS);
        $completed = count(array_filter($inside, fn ($o) => $o['status'] === 'released'));
        $share = fn (int $part, int $all) => $all ? Js::round(($part / $all) * 1000) / 10 : null;

        $kpis = [
            self::kpi('orders', 'Orders', 'count', count($inside), $this->maybe(count($insideBefore)), ['spark' => Series::values($daily)]),
            self::kpi('completed', 'Completed', 'count', $completed, $this->maybe(count(array_filter($insideBefore, fn ($o) => $o['status'] === 'released'))), ['hint' => 'Of the orders received']),
            self::kpi('turnaround', 'Average turnaround', 'hours', $summary['average'], $this->maybe($summaryBefore['average']), ['inverse' => true, 'hint' => 'Received to ready']),
            self::kpi('express', 'Express share', 'percent', $share($express, count($inside)), $this->maybe($share($expressBefore, count($insideBefore))), ['hint' => "{$express} Express orders"]),
        ];

        $sorted = $inside;
        usort($sorted, fn ($a, $b) => $b['received_at'] <=> $a['received_at']);
        $table = [
            'columns' => [
                ['key' => 'order_number', 'label' => 'Order no.', 'format' => 'order'],
                ['key' => 'customer', 'label' => 'Customer', 'format' => 'text'],
                ['key' => 'received_at', 'label' => 'Received', 'format' => 'datetime'],
                ['key' => 'status', 'label' => 'Status', 'format' => 'text'],
                ['key' => 'services', 'label' => 'Services', 'format' => 'text', 'optional' => true],
                ['key' => 'wash_type', 'label' => 'Wash type', 'format' => 'text', 'optional' => true],
                ['key' => 'kilos', 'label' => 'Kilos', 'format' => 'kg'],
                ['key' => 'turnaround', 'label' => 'Turnaround', 'format' => 'hours', 'optional' => true],
                ['key' => 'total', 'label' => 'Total', 'format' => 'money'],
            ],
            'rows' => array_map(function ($o) {
                $hours = Series::turnaroundHours($o);

                return [
                    'id' => $o['id'],
                    'order_number' => $o['order_number'],
                    'customer' => $o['customer_name'],
                    'received_at' => $o['received_at_iso'],
                    'status' => StatusRules::label($o['status']),
                    'services' => implode(', ', array_column(array_filter($o['lines'], fn ($l) => empty($l['surcharge'])), 'service_name')),
                    'wash_type' => $o['wash_type'],
                    'kilos' => $o['kilos'],
                    'turnaround' => $hours === null ? null : Js::roundTo($hours, 1),
                    'total' => $o['total_cents'],
                ];
            }, $sorted),
            'totals' => [
                'order_number' => count($inside).' orders',
                'kilos' => Js::roundTo(array_sum(array_column($inside, 'kilos')), 1),
                'turnaround' => $summary['average'],
                'total' => (int) array_sum(array_column($inside, 'total_cents')),
            ],
        ];
        $series = [
            'orders' => $this->query['compare'] ? Series::withPrevious($daily, Series::ordersByDay($orders, $before)) : $daily,
            'status' => Series::statusDistribution($orders, $range),
            'turnaround' => Series::turnaroundByDay($orders, $range),
            'turnaround_target' => self::TURNAROUND_TARGET_HOURS,
            'express' => Series::sumByDay(array_filter($orders, fn ($o) => $o['express']), $range, fn ($o) => $o['received_at']),
            'by_wash_type' => Series::ordersByWashType($orders, $range),
        ];

        return $this->envelope($kpis, $series, $table, [
            Insights::busiestWeekday($daily),
            Insights::turnaroundSentence($summary),
            Insights::expressShare($express, count($inside)),
            Insights::trendSentence('Orders', Series::deltaPct(count($inside), count($insideBefore)), ManilaTime::rangeLength($range)),
        ]);
    }

    private function paymentsReport(): array
    {
        ['orders' => $orders, 'payments' => $payments] = $this->facts;
        $range = $this->query['range'];
        $now = $this->query['now'];
        $before = ManilaTime::previousRange($range);
        $live = array_filter($payments, fn ($p) => ! $p['voided']);
        $collectedNow = Series::salesTotal($payments, $range);
        $collectedBefore = Series::salesTotal($payments, $before);
        $voided = array_filter($payments, fn ($p) => $p['voided'] && ManilaTime::inRange($p['paid_at'], $range));
        $outstandingNow = 0;
        foreach ($orders as $o) {
            $outstandingNow += max(0, $o['total_cents'] - $o['paid_cents']);
        }
        $aging = Series::unpaidAging($orders, $now);
        $mix = Series::paymentMix($payments, $range);
        $cash = $this->dailyByMethod($payments, $range, 'cash');
        $gcash = $this->dailyByMethod($payments, $range, 'gcash');
        $maya = $this->dailyByMethod($payments, $range, 'maya');
        $inRangePayments = array_filter($payments, fn ($p) => ManilaTime::inRange($p['paid_at'], $range));
        $split = Series::collectedVsOutstanding($orders, $range);
        $liveInRange = count(array_filter($live, fn ($p) => ManilaTime::inRange($p['paid_at'], $range)));
        $owing = count(array_filter($orders, fn ($o) => $o['paid_cents'] < $o['total_cents']));
        $voidedCount = count($voided);

        $kpis = [
            self::kpi('collected', 'Collected', 'money', $collectedNow, $this->maybe($collectedBefore), ['spark' => Series::values(Series::salesByDay($payments, $range))]),
            self::kpi('outstanding', 'Outstanding now', 'money', $outstandingNow, null, ['tone' => 'warn', 'inverse' => true, 'hint' => "{$owing} orders owe a balance"]),
            self::kpi('payments', 'Payments', 'count', $liveInRange, $this->maybe(count(array_filter($live, fn ($p) => ManilaTime::inRange($p['paid_at'], $before))))),
            self::kpi('voided', 'Voided', 'money', (int) array_sum(array_column($voided, 'amount_cents')), null, [
                'inverse' => true,
                'hint' => "{$voidedCount} ".($voidedCount === 1 ? 'payment' : 'payments'),
            ]),
        ];

        $byOrder = array_column($orders, null, 'id');
        $receipts = $this->facts['paymentLog'] ?? [];
        $sorted = array_values($inRangePayments);
        usort($sorted, fn ($a, $b) => $b['paid_at'] <=> $a['paid_at']);
        $table = [
            'columns' => [
                ['key' => 'paid_at', 'label' => 'Paid', 'format' => 'datetime'],
                ['key' => 'receipt', 'label' => 'Reference', 'format' => 'text', 'optional' => true],
                ['key' => 'order_number', 'label' => 'Order no.', 'format' => 'order'],
                ['key' => 'customer', 'label' => 'Customer', 'format' => 'text'],
                ['key' => 'method', 'label' => 'Method', 'format' => 'text'],
                ['key' => 'status', 'label' => 'Status', 'format' => 'text', 'optional' => true],
                ['key' => 'amount', 'label' => 'Amount', 'format' => 'money'],
            ],
            'rows' => array_map(fn ($p) => [
                'id' => $p['order_id'],
                'paid_at' => $p['paid_at_iso'],
                'receipt' => $receipts[$p['id']] ?? null,
                'order_number' => $byOrder[$p['order_id']]['order_number'] ?? '',
                'customer' => $byOrder[$p['order_id']]['customer_name'] ?? '',
                'method' => Series::METHOD_LABELS[$p['method']],
                'status' => $p['voided'] ? 'Voided' : 'Recorded',
                'amount' => $p['amount_cents'],
            ], $sorted),
            'totals' => [
                'paid_at' => "{$liveInRange} payments, voided excluded",
                'amount' => $collectedNow,
            ],
        ];
        $series = [
            'collections' => array_map(fn ($date, $index) => [
                'key' => $date,
                'label' => $date,
                'values' => ['cash' => $cash[$index]['value'] ?? 0, 'gcash' => $gcash[$index]['value'] ?? 0, 'maya' => $maya[$index]['value'] ?? 0],
            ], ManilaTime::eachDay($range), array_keys(ManilaTime::eachDay($range))),
            'collected' => $split,
            'unpaid_aging' => $aging,
            'payment_mix' => $mix,
        ];

        return $this->envelope($kpis, $series, $table, [
            Insights::digitalShare($mix),
            Insights::oldUnpaid($aging),
            $split['billed'] > 0
                ? Js::round(($split['collected'] / $split['billed']) * 100)."% of what was billed for this period's orders is already paid."
                : null,
            Insights::trendSentence('Collections', Series::deltaPct($collectedNow, $collectedBefore), ManilaTime::rangeLength($range)),
        ]);
    }

    private function servicesReport(): array
    {
        ['orders' => $orders, 'payments' => $payments] = $this->facts;
        $range = $this->query['range'];
        $before = ManilaTime::previousRange($range);
        $stats = Series::serviceStats($orders, $payments, $range);
        $statsBefore = array_column(Series::serviceStats($orders, $payments, $before), null, 'id');
        $revenue = Series::revenueByService($orders, $payments, $range);
        $revenueTotal = Series::total($revenue);
        $inside = Series::receivedIn($orders, $range);
        $totalKilos = array_sum(array_column($stats, 'kilos'));
        $totalPieces = array_sum(array_column($stats, 'pieces'));

        $growth = null;
        foreach ($stats as $s) {
            $change = Series::deltaPct($s['orders'], $statsBefore[$s['id']]['orders'] ?? null);
            if ($change !== null && $s['orders'] >= 10 && ($growth === null || $change > $growth['change'])) {
                $growth = ['name' => $s['name'], 'change' => $change];
            }
        }

        $kpis = [
            self::kpi('revenue', 'Revenue', 'money', $revenueTotal, $this->maybe(Series::total(Series::revenueByService($orders, $payments, $before))), ['hint' => 'Payments collected']),
            self::kpi('services', 'Services used', 'count', count(array_filter($stats, fn ($s) => $s['orders'] > 0 && $s['id'] !== Facts::SURCHARGE_ID)), null),
            self::kpi('kilos', 'Kilos processed', 'kg', Js::roundTo($totalKilos, 1), $this->maybe(Js::roundTo(array_sum(array_column($statsBefore, 'kilos')), 1))),
            self::kpi('pieces', 'Pieces processed', 'count', $totalPieces, $this->maybe(array_sum(array_column($statsBefore, 'pieces'))), ['hint' => 'Comforters and ironing']),
        ];
        $table = [
            'columns' => [
                ['key' => 'service', 'label' => 'Service', 'format' => 'text'],
                ['key' => 'orders', 'label' => 'Orders', 'format' => 'count'],
                ['key' => 'kilos', 'label' => 'Kilos', 'format' => 'kg'],
                ['key' => 'pieces', 'label' => 'Pieces', 'format' => 'count'],
                ['key' => 'average', 'label' => 'Billed per order', 'format' => 'money', 'optional' => true],
                ['key' => 'share', 'label' => 'Share of revenue', 'format' => 'percent', 'optional' => true],
                ['key' => 'revenue', 'label' => 'Revenue', 'format' => 'money'],
            ],
            'rows' => array_map(fn ($s) => [
                'service' => $s['name'],
                'orders' => $s['orders'],
                'kilos' => $s['kilos'],
                'pieces' => $s['pieces'],
                'average' => $s['average'],
                'share' => $revenueTotal ? Js::round(($s['revenue'] / $revenueTotal) * 1000) / 10 : 0,
                'revenue' => $s['revenue'],
            ], $stats),
            'totals' => [
                'service' => 'Total',
                'orders' => count($inside),
                'kilos' => Js::roundTo($totalKilos, 1),
                'pieces' => $totalPieces,
                'share' => 100,
                'revenue' => $revenueTotal,
            ],
        ];
        $average = array_values(array_map(
            fn ($s) => ['key' => (string) $s['id'], 'label' => $s['name'], 'value' => $s['average'], 'share' => 0],
            array_filter($stats, fn ($s) => $s['orders'] > 0),
        ));
        usort($average, fn ($a, $b) => $b['value'] <=> $a['value']);
        $series = [
            'revenue_by_service' => $revenue,
            'weekly' => Series::serviceOrdersByWeek($orders, $range),
            'services' => array_map(fn ($s) => ['key' => (string) $s['id'], 'label' => $s['name']], $stats),
            'average' => $average,
        ];

        return $this->envelope($kpis, $series, $table, [
            Insights::topShare($revenue, 'revenue'),
            Insights::expressShare(count(array_filter($inside, fn ($o) => $o['express'])), count($inside)),
            $growth && abs($growth['change']) >= 1
                ? "{$growth['name']} ".($growth['change'] > 0 ? 'grew' : 'shrank').' the most: '.number_format(abs($growth['change']), 1, '.', '').'% '
                    .($growth['change'] > 0 ? 'more' : 'fewer').' orders than '.Insights::previousLabel(ManilaTime::rangeLength($range)).'.'
                : null,
        ]);
    }

    private function customersReport(): array
    {
        ['orders' => $orders, 'payments' => $payments] = $this->facts;
        $range = $this->query['range'];
        $before = ManilaTime::previousRange($range);
        $split = Series::customerSplit($orders, $range);
        $splitBefore = Series::customerSplit($orders, $before);
        $top = Series::topCustomers($orders, $payments, $range, 10);
        $everyone = Series::topCustomers($orders, $payments, $range, PHP_INT_MAX);
        $barangays = Series::customersByBarangay($orders, $range);
        $spend = Series::salesTotal($payments, $range);
        $lastVisit = [];
        $firstVisit = [];
        foreach ($orders as $o) {
            if (! isset($lastVisit[$o['customer_id']]) || $o['received_at'] > $lastVisit[$o['customer_id']]) {
                $lastVisit[$o['customer_id']] = $o['received_at'];
            }
            if (! isset($firstVisit[$o['customer_id']]) || $o['received_at'] < $firstVisit[$o['customer_id']]) {
                $firstVisit[$o['customer_id']] = $o['received_at'];
            }
        }
        $share = fn (int $part, int $all) => $all ? Js::round(($part / $all) * 1000) / 10 : null;

        $kpis = [
            self::kpi('customers', 'Customers served', 'count', $split['customers'], $this->maybe($splitBefore['customers'])),
            self::kpi('new', 'New customers', 'count', $split['new'], $this->maybe($splitBefore['new']), ['hint' => 'First order in this period']),
            self::kpi('returning', 'Returning share', 'percent', $share($split['returning'], $split['customers']), $this->maybe($share($splitBefore['returning'], $splitBefore['customers']))),
            self::kpi('spend', 'Spend per customer', 'money',
                $split['customers'] ? Js::round($spend / $split['customers']) : null,
                $this->maybe($splitBefore['customers'] ? Js::round(Series::salesTotal($payments, $before) / $splitBefore['customers']) : null)),
        ];

        $rows = array_values(array_map(fn ($c) => [
            'id' => $c['id'],
            'customer' => $c['name'],
            'barangay' => $c['barangay'],
            'orders' => $c['orders'],
            'first_visit' => ManilaTime::iso($firstVisit[$c['id']] ?? null),
            'last_visit' => ManilaTime::iso($lastVisit[$c['id']] ?? null),
            'spend' => $c['spend'],
        ], array_filter($everyone, fn ($c) => $c['orders'] > 0 || $c['spend'] > 0)));
        $table = [
            'columns' => [
                ['key' => 'customer', 'label' => 'Customer', 'format' => 'text'],
                ['key' => 'barangay', 'label' => 'Barangay', 'format' => 'text'],
                ['key' => 'orders', 'label' => 'Orders', 'format' => 'count'],
                ['key' => 'first_visit', 'label' => 'Customer since', 'format' => 'date', 'optional' => true],
                ['key' => 'last_visit', 'label' => 'Last visit', 'format' => 'date', 'optional' => true],
                ['key' => 'spend', 'label' => 'Spend', 'format' => 'money'],
            ],
            'rows' => $rows,
            'totals' => [
                'customer' => count($rows).' customers',
                'orders' => array_sum(array_column($rows, 'orders')),
                'spend' => array_sum(array_column($rows, 'spend')),
            ],
        ];
        $series = [
            'new_vs_returning' => Series::newVsReturningByWeek($orders, $range),
            'top_customers' => array_map(fn ($c) => [
                'key' => (string) $c['id'],
                'label' => $c['name'],
                'value' => $c['spend'],
                'share' => $spend ? $c['spend'] / $spend : 0,
                'extra' => ['orders' => $c['orders']],
            ], $top),
            'by_barangay' => $barangays,
        ];

        return $this->envelope($kpis, $series, $table, [
            Insights::returningShare($split),
            Insights::topCustomerSentence($top[0] ?? null),
            Insights::topBarangay($barangays),
        ]);
    }

    private function inventoryReport(): array
    {
        ['items' => $items, 'movements' => $movements, 'staff' => $staff, 'orders' => $orders] = $this->facts;
        $range = $this->query['range'];
        $before = ManilaTime::previousRange($range);
        $usage = Series::stockUsageByDay($movements, $items, $range);
        $usageBefore = Series::stockUsageByDay($movements, $items, $before);
        $inside = array_values(array_filter($movements, fn ($m) => ManilaTime::inRange($m['moved_at'], $range)));
        $restocks = count(array_filter($inside, fn ($m) => $m['type'] === 'in'));
        $orderNumbers = array_column($orders, 'order_number', 'id');
        $soap = Series::soapUsage($movements, $items, $orders, $range);
        $byOrders = count(array_filter($inside, fn ($m) => $m['type'] === 'usage'));
        $manual = count(array_filter($inside, fn ($m) => $m['type'] === 'out'));
        $daysLeft = [];
        foreach ($items as $item) {
            $daysLeft[$item['id']] = Series::daysOfStockLeft($item, $usage[$item['id']] ?? []);
        }
        $names = array_column($staff, 'name', 'id');
        $itemById = array_column($items, null, 'id');
        $critical = count(array_filter($items, fn ($i) => $i['stock_status'] === 'critical'));

        $kpis = [
            self::kpi('items', 'Items tracked', 'count', count($items), null),
            self::kpi('critical', 'Critical', 'count', $critical, null, ['tone' => $critical > 0 ? 'warn' : 'default', 'inverse' => true]),
            self::kpi('low', 'Low', 'count', count(array_filter($items, fn ($i) => $i['stock_status'] === 'low')), null, ['inverse' => true]),
            self::kpi('restocks', 'Restocks', 'count', $restocks, $this->maybe(count(array_filter($movements, fn ($m) => $m['type'] === 'in' && ManilaTime::inRange($m['moved_at'], $before)))), ['hint' => 'Deliveries recorded']),
            self::kpi('used_by_orders', 'Used by orders', 'count', $byOrders, null, ['hint' => 'Soap deducted per order']),
            self::kpi('manual_out', 'Manual stock-outs', 'count', $manual, null, ['hint' => 'Recorded by hand']),
        ];

        $sorted = $inside;
        usort($sorted, fn ($a, $b) => $b['moved_at'] <=> $a['moved_at']);
        $table = [
            'columns' => [
                ['key' => 'moved_at', 'label' => 'Date', 'format' => 'datetime'],
                ['key' => 'item', 'label' => 'Item', 'format' => 'text'],
                ['key' => 'type', 'label' => 'Movement', 'format' => 'text'],
                ['key' => 'quantity', 'label' => 'Quantity', 'format' => 'number'],
                ['key' => 'order_number', 'label' => 'Order', 'format' => 'order', 'optional' => true],
                ['key' => 'unit', 'label' => 'Unit', 'format' => 'text', 'optional' => true],
                ['key' => 'by', 'label' => 'Recorded by', 'format' => 'text', 'optional' => true],
            ],
            'rows' => array_map(fn ($m) => [
                'moved_at' => $m['moved_at_iso'],
                'item' => $itemById[$m['item_id']]['name'] ?? '',
                'type' => ['in' => 'Stock in', 'out' => 'Stock-out', 'usage' => 'Used by order', 'adjust' => 'Adjustment'][$m['type']],
                'quantity' => in_array($m['type'], ['out', 'usage'], true) ? -$m['quantity'] : $m['quantity'],
                'order_number' => $m['order_id'] !== null ? ($orderNumbers[$m['order_id']] ?? null) : null,
                'unit' => $itemById[$m['item_id']]['unit'] ?? '',
                'by' => $names[$m['user_id']] ?? '',
            ], $sorted),
            'totals' => ['moved_at' => count($inside).' movements'],
        ];
        $series = [
            'soap_by_wash_type' => $soap['by_wash_type'],
            'soap_by_source' => $soap['by_source'],
            'top_soaps' => $soap['top'],
            'levels' => array_map(fn ($i) => [
                'key' => (string) $i['id'],
                'label' => $i['name'],
                'unit' => $i['unit'],
                'on_hand' => $i['on_hand'],
                'reorder_level' => $i['reorder_level'],
                'status' => $i['stock_status'],
            ], $items),
            'usage' => array_map(fn ($i) => [
                'item_id' => $i['id'],
                'label' => $i['name'],
                'unit' => $i['unit'],
                'points' => $this->query['compare']
                    ? Series::withPrevious($usage[$i['id']] ?? [], $usageBefore[$i['id']] ?? [])
                    : ($usage[$i['id']] ?? []),
            ], $items),
        ];

        return $this->envelope($kpis, $series, $table, Insights::stockWarnings($items, $daysLeft));
    }

    private function staffReport(): array
    {
        ['staff' => $staff, 'changes' => $changes, 'orders' => $orders] = $this->facts;
        $range = $this->query['range'];
        $before = ManilaTime::previousRange($range);
        $rows = Series::staffActivity($staff, $changes, $orders, $range);
        $rowsBefore = Series::staffActivity($staff, $changes, $orders, $before);
        $sum = fn (array $list, string $key) => array_sum(array_column($list, $key));
        $updatesOf = fn (array $r) => Series::sumByDay(array_filter($changes, fn ($c) => $c['to_status'] !== 'received'), $r, fn ($c) => $c['changed_at']);
        $updates = $updatesOf($range);

        $kpis = [
            self::kpi('staff', 'Staff active', 'count', count($rows), $this->maybe(count($rowsBefore))),
            self::kpi('updates', 'Status updates', 'count', $sum($rows, 'status_updates'), $this->maybe($sum($rowsBefore, 'status_updates')), ['spark' => Series::values($updates)]),
            self::kpi('created', 'Orders taken', 'count', $sum($rows, 'orders_created'), $this->maybe($sum($rowsBefore, 'orders_created'))),
            self::kpi('completed', 'Handed over', 'count', $sum($rows, 'completed'), $this->maybe($sum($rowsBefore, 'completed')), ['hint' => 'Marked as completed']),
        ];
        $table = [
            'columns' => [
                ['key' => 'name', 'label' => 'Staff member', 'format' => 'text'],
                ['key' => 'orders_created', 'label' => 'Orders taken', 'format' => 'count'],
                ['key' => 'status_updates', 'label' => 'Status updates', 'format' => 'count'],
                ['key' => 'completed', 'label' => 'Handed over', 'format' => 'count'],
                ['key' => 'active_days', 'label' => 'Days active', 'format' => 'count', 'optional' => true],
            ],
            'rows' => $rows,
            'totals' => [
                'name' => 'Total',
                'orders_created' => $sum($rows, 'orders_created'),
                'status_updates' => $sum($rows, 'status_updates'),
                'completed' => $sum($rows, 'completed'),
            ],
        ];
        $series = [
            'activity' => array_map(fn ($r) => [
                'key' => (string) $r['id'],
                'label' => $r['name'],
                'status_updates' => $r['status_updates'],
                'orders_created' => $r['orders_created'],
                'completed' => $r['completed'],
            ], $rows),
            'updates_by_day' => $this->query['compare'] ? Series::withPrevious($updates, $updatesOf($before)) : $updates,
        ];

        return $this->envelope($kpis, $series, $table, [
            Insights::staffLeader($rows),
            isset($rows[0]) && count($rows) > 1
                ? count($rows).' people recorded work in this period; '
                    .Insights::num(Js::round(($sum($rows, 'status_updates') / max(1, ManilaTime::rangeLength($range))) * 10) / 10)
                    .' status updates a day on average.'
                : null,
        ]);
    }
}
