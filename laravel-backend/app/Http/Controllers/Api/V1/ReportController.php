<?php

namespace App\Http\Controllers\Api\V1;

use App\Permissions\V1\Abilities;
use App\Support\Analytics\Builder;
use App\Support\Analytics\Facts;
use App\Support\StatusRules;

/**
 * @group Reports
 */
class ReportController extends APIController
{
    /**
     * A report
     *
     * One of seven reports (owner only): sales, orders, payments, services, customers, inventory or
     * staff. Same envelope as the dashboard analytics, plus a full table. For the same range the
     * sales total equals the dashboard KPI and GET /payments meta.collectedCents.
     *
     * @urlParam kind string required sales, orders, payments, services, customers, inventory or staff. Example: sales
     *
     * @queryParam from string First Manila day (Y-m-d). Example: 2026-10-10
     * @queryParam to string Last Manila day, inclusive. Example: 2026-11-08
     * @queryParam compare string previous (default) or none. Example: previous
     * @queryParam service integer One service (payments split by allocation). Example: 1
     * @queryParam method string cash, gcash or maya. Example: maya
     * @queryParam status string One status code. Example: ready_for_pickup
     * @queryParam staff integer One staff member. Example: 2
     * @queryParam barangay string One barangay by name. Example: Poblacion
     * @queryParam item integer One supply item. Example: 1
     */
    public function show(string $kind)
    {
        if (! $this->isAble(Abilities::ReportsView)) {
            return $this->notAuthorized('You are not authorized to view reports.');
        }
        if (! in_array($kind, Builder::REPORT_KINDS, true)) {
            abort(404, 'There is no such report.');
        }

        $facts = Builder::filterFacts(Facts::load(), $this->filters());

        return $this->ok('Report', (new Builder($facts, AnalyticsController::query()))->report($kind));
    }

    private function filters(): array
    {
        $request = request();
        $positive = fn ($value) => is_numeric($value) && (int) $value > 0 ? (int) $value : null;
        $method = $request->query('method');
        $status = $request->query('status');
        $barangay = $request->query('barangay');

        return [
            'service' => is_numeric($request->query('service')) && (int) $request->query('service') >= 0 ? (int) $request->query('service') : null,
            'method' => in_array($method, ['cash', 'gcash', 'maya'], true) ? $method : null,
            'status' => in_array($status, StatusRules::ORDER, true) ? $status : null,
            'staff' => $positive($request->query('staff')),
            'barangay' => is_string($barangay) && trim($barangay) !== '' ? trim($barangay) : null,
            'item' => $positive($request->query('item')),
        ];
    }
}
