<?php

namespace App\Http\Controllers\Api\V1;

use App\Permissions\V1\Abilities;
use App\Support\Analytics\Builder;
use App\Support\Analytics\Facts;
use App\Support\Analytics\Forecast;
use App\Support\Analytics\ManilaTime;

/**
 * @group Dashboard
 */
class AnalyticsController extends APIController
{
    /**
     * Dashboard analytics
     *
     * The dashboard's KPIs and charts for a Manila date range, compared with the range of the same
     * length just before it. Users with sales.view get the admin document; everyone else gets the
     * staff document, which is built without a single peso field (not hidden: never sent).
     *
     * The document is not a model resource: it is the analytics envelope
     * { range, compare_range, generated_at, kpis, series, table, insights }, inside ok().
     *
     * @queryParam from string First Manila day (Y-m-d). Defaults to 29 days ago. Example: 2026-10-10
     * @queryParam to string Last Manila day, inclusive. Defaults to today. Example: 2026-11-08
     * @queryParam compare string previous (default) or none. Example: previous
     */
    public function dashboard()
    {
        if (! $this->isAble(Abilities::DashboardView)) {
            return $this->notAuthorized('You are not authorized to view the dashboard.');
        }

        $builder = new Builder(Facts::load(), self::query());

        return $this->ok('Dashboard analytics', $this->isAble(Abilities::SalesView) ? $builder->adminDashboard() : $builder->staffDashboard());
    }

    /**
     * Demand forecast
     *
     * Orders and kilos for today and the next 6 days, predicted by a ridge linear regression
     * (trend + weekday) trained on the last 8 weeks, with its error on the 7 held-back days next
     * to a naive "same weekday last week" guess, and the soap the forecast kilos will need. Fewer
     * than 14 days of history give status insufficient_data and no targets. No peso fields, so
     * staff get the same document.
     */
    public function forecast()
    {
        if (! $this->isAble(Abilities::DashboardView)) {
            return $this->notAuthorized('You are not authorized to view the dashboard.');
        }

        return $this->ok('Demand forecast', Forecast::build(Facts::load(), (int) floor(microtime(true) * 1000)));
    }

    /** @return array{range: array{from: string, to: string}, compare: bool, now: int} */
    public static function query(): array
    {
        $now = (int) floor(microtime(true) * 1000);
        $request = request();

        return [
            'range' => ManilaTime::parseRange($request->query('from'), $request->query('to'), ManilaTime::presetRange('30d', $now)),
            // Compare is on unless asked off: compare=none.
            'compare' => $request->query('compare') !== 'none',
            'now' => $now,
        ];
    }
}
