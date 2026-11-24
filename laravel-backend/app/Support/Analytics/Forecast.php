<?php

namespace App\Support\Analytics;

use App\Support\WashRules;
use RuntimeException;

/**
 * Demand forecast: the shop's machine-learning feature, a line-for-line port of
 * react-frontend/src/lib/analytics/forecast.ts (both held to shared/forecast-cases.json).
 *
 * A ridge linear regression learns, from the last 8 weeks of orders, a steady trend plus how much
 * busier each weekday is than Monday, and extrapolates the next 7 days. Two models are trained per
 * request (well under a millisecond): orders per day and kilos per day. The kilos forecast times
 * the recent soap use per kilo gives the soap to have on hand. The model is retrained without the
 * last 7 days and scored on them, next to a naive guess (same weekday last week).
 *
 * Keep the order of operations identical to the TypeScript, so both sides give the same numbers.
 */
final class Forecast
{
    public const TRAINING_DAYS = 56;

    public const MIN_TRAINING_DAYS = 14;

    public const HOLDOUT_DAYS = 7;

    public const HORIZON_DAYS = 7;

    public const RIDGE_LAMBDA = 0.5;

    private const INTERVAL_Z = 1.2816;

    public const FEATURE_NAMES = ['intercept', 'trend (per week)', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    /** Math.floor(value * 10^digits + 0.5) / 10^digits, as the TypeScript rounds. */
    private static function round(float|int $value, int $digits): float
    {
        $factor = 10 ** $digits;

        return floor($value * $factor + 0.5) / $factor;
    }

    /** @return list<float> [1, weeks since start, Tue, Wed, Thu, Fri, Sat, Sun] */
    public static function features(int $index, int $weekday): array
    {
        $row = [1.0, $index / 7];
        for ($k = 1; $k < 7; $k++) {
            $row[] = $weekday === $k ? 1.0 : 0.0;
        }

        return $row;
    }

    /**
     * Solves a·x = b by Gaussian elimination with partial pivoting.
     *
     * @param  list<list<float>>  $a
     * @param  list<float>  $b
     * @return list<float>
     */
    public static function solve(array $a, array $b): array
    {
        $n = count($b);
        $m = [];
        foreach ($a as $i => $row) {
            $m[$i] = [...array_map('floatval', $row), (float) $b[$i]];
        }
        for ($col = 0; $col < $n; $col++) {
            $pivot = $col;
            for ($r = $col + 1; $r < $n; $r++) {
                if (abs($m[$r][$col]) > abs($m[$pivot][$col])) {
                    $pivot = $r;
                }
            }
            if (abs($m[$pivot][$col]) < 1e-12) {
                throw new RuntimeException('The system has no unique solution');
            }
            [$m[$col], $m[$pivot]] = [$m[$pivot], $m[$col]];
            for ($r = $col + 1; $r < $n; $r++) {
                $factor = $m[$r][$col] / $m[$col][$col];
                for ($c = $col; $c <= $n; $c++) {
                    $m[$r][$c] = $m[$r][$c] - $factor * $m[$col][$c];
                }
            }
        }
        $x = array_fill(0, $n, 0.0);
        for ($r = $n - 1; $r >= 0; $r--) {
            $sum = $m[$r][$n];
            for ($c = $r + 1; $c < $n; $c++) {
                $sum -= $m[$r][$c] * $x[$c];
            }
            $x[$r] = $sum / $m[$r][$r];
        }

        return $x;
    }

    private static function raw(array $model, string $date): float
    {
        $weeks = ManilaTime::diffDays($model['start'], $date) / 7;

        return $model['intercept'] + $model['trend_per_week'] * $weeks + ($model['weekday'][ManilaTime::weekdayOf($date)] ?? 0);
    }

    /** The prediction for any day: demand is never negative. */
    public static function predict(array $model, string $date): float
    {
        return max(0.0, self::raw($model, $date));
    }

    /**
     * Fits the trend + weekday model to consecutive days by ridge least squares (normal equations).
     *
     * @param  list<array{date: string, value: float|int}>  $points
     */
    public static function fitModel(array $points, float $lambda = self::RIDGE_LAMBDA): array
    {
        $p = count(self::FEATURE_NAMES);
        $xtx = array_fill(0, $p, array_fill(0, $p, 0.0));
        $xty = array_fill(0, $p, 0.0);
        foreach (array_values($points) as $i => $point) {
            $x = self::features($i, ManilaTime::weekdayOf($point['date']));
            for ($r = 0; $r < $p; $r++) {
                $xty[$r] = $xty[$r] + $x[$r] * $point['value'];
                for ($c = 0; $c < $p; $c++) {
                    $xtx[$r][$c] = $xtx[$r][$c] + $x[$r] * $x[$c];
                }
            }
        }
        for ($r = 1; $r < $p; $r++) {
            $xtx[$r][$r] = $xtx[$r][$r] + $lambda;
        }
        $beta = self::solve($xtx, $xty);

        $model = [
            'start' => $points[0]['date'] ?? '',
            'intercept' => $beta[0],
            'trend_per_week' => $beta[1],
            'weekday' => [0.0, ...array_slice($beta, 2)],
            'residual_sd' => 0.0,
            'r2' => null,
            'n' => count($points),
        ];
        $mean = 0.0;
        foreach ($points as $point) {
            $mean += $point['value'];
        }
        $mean /= max(1, count($points));
        $ssRes = 0.0;
        $ssTot = 0.0;
        foreach ($points as $point) {
            $residual = $point['value'] - self::raw($model, $point['date']);
            $ssRes += $residual * $residual;
            $ssTot += ($point['value'] - $mean) * ($point['value'] - $mean);
        }
        $model['residual_sd'] = sqrt($ssRes / max(1, count($points) - $p));
        $model['r2'] = $ssTot > 0 ? 1 - $ssRes / $ssTot : null;

        return $model;
    }

    /** Trains on all but the last HOLDOUT_DAYS and scores those days, next to the seasonal naive guess. */
    public static function evaluate(array $points, float $lambda = self::RIDGE_LAMBDA): ?array
    {
        $points = array_values($points);
        if (count($points) < self::MIN_TRAINING_DAYS + self::HOLDOUT_DAYS) {
            return null;
        }
        $cut = count($points) - self::HOLDOUT_DAYS;
        $model = self::fitModel(array_slice($points, 0, $cut), $lambda);
        $error = 0.0;
        $baselineError = 0.0;
        for ($i = $cut; $i < count($points); $i++) {
            $point = $points[$i];
            $error += abs(self::predict($model, $point['date']) - $point['value']);
            $baselineError += abs($points[$i - 7]['value'] - $point['value']);
        }

        return ['mae' => $error / self::HOLDOUT_DAYS, 'baseline_mae' => $baselineError / self::HOLDOUT_DAYS, 'days' => self::HOLDOUT_DAYS];
    }

    /** Trains a model on $points and forecasts the $horizon days, rounded for the response. */
    public static function forecastTarget(string $key, array $points, array $horizon): array
    {
        $digits = 1;
        $points = array_values($points);
        $model = self::fitModel($points);
        $evaluation = self::evaluate($points);
        $spread = self::INTERVAL_Z * $model['residual_sd'];
        $future = array_map(function ($date) use ($model, $spread, $digits) {
            $value = self::predict($model, $date);

            return [
                'date' => $date,
                'actual' => null,
                'predicted' => self::round($value, $digits),
                'low' => self::round(max(0.0, $value - $spread), $digits),
                'high' => self::round($value + $spread, $digits),
            ];
        }, $horizon);
        $sum = 0.0;
        foreach ($horizon as $date) {
            $sum += self::predict($model, $date);
        }
        $coefficients = [$model['intercept'], $model['trend_per_week'], ...array_slice($model['weekday'], 1)];

        return [
            'key' => $key,
            'label' => $key === 'orders' ? 'Orders' : 'Kilos',
            'format' => $key === 'orders' ? 'count' : 'kg',
            'coefficients' => array_map(fn ($value, $i) => ['name' => self::FEATURE_NAMES[$i], 'value' => self::round($value, 2)], $coefficients, array_keys($coefficients)),
            'r2' => $model['r2'] === null ? null : self::round($model['r2'], 3),
            'residual_sd' => self::round($model['residual_sd'], 2),
            'evaluation' => $evaluation === null ? null : [
                'mae' => self::round($evaluation['mae'], 2),
                'baseline_mae' => self::round($evaluation['baseline_mae'], 2),
                'days' => $evaluation['days'],
            ],
            'points' => [
                ...array_map(fn ($point) => [
                    'date' => $point['date'],
                    'actual' => $point['value'],
                    'predicted' => self::round(self::predict($model, $point['date']), $digits),
                    'low' => null,
                    'high' => null,
                ], $points),
                ...$future,
            ],
            'forecast_total' => self::round($sum, 1),
        ];
    }

    /** Builds the forecast from Facts::load(), as of $now (epoch ms). */
    public static function build(array $facts, int $now): array
    {
        $today = ManilaTime::day($now);
        $yesterday = ManilaTime::addDays($today, -1);
        $horizon = [];
        for ($i = 0; $i < self::HORIZON_DAYS; $i++) {
            $horizon[] = ManilaTime::addDays($today, $i);
        }

        // Days before the first order are days before the shop used the system, not days with no work.
        $first = null;
        $orders = [];
        $kilos = [];
        foreach ($facts['orders'] as $order) {
            $day = ManilaTime::day($order['received_at']);
            if ($first === null || $day < $first) {
                $first = $day;
            }
            $orders[$day] = ($orders[$day] ?? 0) + 1;
            $kilos[$day] = ($kilos[$day] ?? 0) + $order['kilos'];
        }
        $windowStart = ManilaTime::addDays($yesterday, 1 - self::TRAINING_DAYS);
        $from = $first === null ? null : ($first > $windowStart ? $first : $windowStart);
        $days = $from === null || $from > $yesterday ? 0 : ManilaTime::diffDays($from, $yesterday) + 1;
        $dates = [];
        for ($i = 0; $i < $days; $i++) {
            $dates[] = ManilaTime::addDays($from, $i);
        }

        $response = [
            'status' => $days >= self::MIN_TRAINING_DAYS ? 'ready' : 'insufficient_data',
            'generated_at' => ManilaTime::iso($now),
            'today' => $today,
            'training' => ['from' => $days > 0 ? $from : null, 'to' => $yesterday, 'days' => $days, 'min_days' => self::MIN_TRAINING_DAYS],
            'horizon' => ['from' => $today, 'to' => $horizon[self::HORIZON_DAYS - 1], 'days' => self::HORIZON_DAYS],
            'model' => [
                'algorithm' => 'Ridge linear regression (least squares)',
                'features' => self::FEATURE_NAMES,
                'lambda' => self::RIDGE_LAMBDA,
                'holdout_days' => self::HOLDOUT_DAYS,
                'interval' => '80% prediction interval',
            ],
            'targets' => [],
            'soap' => [],
        ];
        if ($response['status'] !== 'ready') {
            return $response;
        }

        $orderTarget = self::forecastTarget('orders', array_map(fn ($date) => ['date' => $date, 'value' => $orders[$date] ?? 0], $dates), $horizon);
        $kiloTarget = self::forecastTarget('kilos', array_map(fn ($date) => ['date' => $date, 'value' => self::round($kilos[$date] ?? 0, 1)], $dates), $horizon);
        $response['targets'] = [$orderTarget, $kiloTarget];
        $response['soap'] = self::soap($facts, $dates[0], $yesterday, $kiloTarget['forecast_total']);

        return $response;
    }

    /** Soap per kilo over the training days (from the first soap deduction on), times the forecast kilos. */
    private static function soap(array $facts, string $from, string $to, float $forecastKilos): array
    {
        $usageStart = null;
        foreach ($facts['movements'] as $m) {
            if ($m['type'] !== 'usage') {
                continue;
            }
            $day = ManilaTime::day($m['moved_at']);
            if ($usageStart === null || $day < $usageStart) {
                $usageStart = $day;
            }
        }
        if ($usageStart === null) {
            return [];
        }
        $start = $usageStart > $from ? $usageStart : $from;
        if ($start > $to) {
            return [];
        }

        $kilos = 0.0;
        foreach ($facts['orders'] as $order) {
            $day = ManilaTime::day($order['received_at']);
            if ($day >= $start && $day <= $to) {
                $kilos += $order['kilos'];
            }
        }
        if ($kilos <= 0) {
            return [];
        }

        $used = [];
        foreach ($facts['movements'] as $m) {
            if ($m['type'] !== 'usage') {
                continue;
            }
            $day = ManilaTime::day($m['moved_at']);
            if ($day >= $start && $day <= $to) {
                $used[$m['item_id']] = ($used[$m['item_id']] ?? 0) + $m['quantity'];
            }
        }
        $out = [];
        foreach ($facts['items'] as $item) {
            $amount = $used[$item['id']] ?? null;
            if ($amount === null || $amount <= 0) {
                continue;
            }
            $perKg = $amount / $kilos;
            // Pieces are bought whole; kg and L keep three decimals (1 g or 1 mL).
            $exact = self::round($perKg * $forecastKilos, 6);
            $needed = $item['unit'] === 'pcs' ? (float) ceil($exact) : self::round($exact, 3);
            $onHand = self::round($item['on_hand'], 3);
            $short = self::round(max(0, $needed - $onHand), 3);
            $out[] = [
                'item_id' => $item['id'],
                'label' => $item['name'],
                'unit' => $item['unit'],
                'per_kg' => self::round($perKg, 4),
                'needed' => $needed,
                'on_hand' => $onHand,
                'short_by' => $short,
                'needed_label' => WashRules::formatAmount($item['unit'], $needed),
                'on_hand_label' => WashRules::formatAmount($item['unit'], $onHand),
            ];
        }

        return $out;
    }
}
