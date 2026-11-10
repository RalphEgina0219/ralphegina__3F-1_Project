<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\InventoryItemResource;
use App\Http\Resources\V1\OrderResource;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\Payment;
use App\Permissions\V1\Abilities;
use App\Support\InventoryRules;
use App\Support\StatusRules;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * @group Dashboard
 */
class DashboardController extends APIController
{
    /**
     * Today at a glance
     *
     * Today's work for the counter: KPIs, the flow per stage, recent orders, low stock and what
     * needs action. Sales figures are added only for users who may see them (sales.view): staff
     * responses contain no money from payments.
     */
    public function summary()
    {
        if (! $this->isAble(Abilities::DashboardView)) {
            return $this->notAuthorized('You are not authorized to view the dashboard.');
        }

        $now = CarbonImmutable::now();
        $today = $now->startOfDay();
        $orders = Order::query()->withMoney()->with(Order::eagerLoadsFor(Order::LIST_INCLUDES));

        $counts = [];
        $rows = Order::query()->select('current_status_id', DB::raw('COUNT(*) AS total'))->groupBy('current_status_id')->pluck('total', 'current_status_id');
        foreach (StatusRules::ORDER as $code) {
            $counts[$code] = (int) ($rows[OrderStatus::idFor($code)] ?? 0);
        }

        $readyId = OrderStatus::idFor('ready_for_pickup');
        $ordersToday = Order::query()->where('received_at', '>=', $today)->count();
        $lastWeek = $today->subDays(7);
        $ordersLastWeek = Order::query()->where('received_at', '>=', $lastWeek)->where('received_at', '<', $lastWeek->addDay())->count();
        $unpaid = DB::query()->fromSub(Order::query()->select(DB::raw(Order::BALANCE_SQL.' AS balance')), 'b')
            ->where('balance', '>', 0)->selectRaw('COALESCE(SUM(balance), 0) AS cents, COUNT(*) AS orders')->first();

        // Ready orders waiting more than two calendar days (Manila) since they became ready.
        $readyOver = (clone $orders)->where('current_status_id', $readyId)
            ->whereRaw('DATE('.Order::STATUS_SINCE_SQL.') < ?', [$today->subDays(2)->toDateString()])
            ->get()->sortBy(fn (Order $o) => $o->statusSince())->values();

        $summary = [
            'kpis' => [
                'ordersToday' => $ordersToday,
                'ordersVsLastWeek' => $ordersToday - $ordersLastWeek,
                'inProcess' => $counts['washing'] + $counts['drying'] + $counts['folding'],
                'readyForPickup' => $counts['ready_for_pickup'],
                'readyOver2Days' => $readyOver->count(),
                'unpaidCents' => (int) $unpaid->cents,
                'unpaidOrders' => (int) $unpaid->orders,
            ],
            'flowCounts' => $counts + [
                'released_today' => Order::query()->where('released_at', '>=', $today)->count(),
            ],
            'recentOrders' => OrderResource::collection((clone $orders)->orderByDesc('received_at')->orderByDesc('id')->limit(6)->get()),
            'lowStock' => InventoryItemResource::collection(
                InventoryItem::query()->withOnHand()->where('is_active', true)->orderBy('id')->get()
                    ->filter(fn (InventoryItem $item) => $item->stockStatus() !== 'ok')
                    ->sortBy(fn (InventoryItem $item) => InventoryRules::levelPercent($item->onHand(), (float) $item->reorder_level))
                    ->values()
            ),
        ];

        if ($this->isAble(Abilities::SalesView)) {
            $sales = Payment::query()->whereNull('voided_at')->where('paid_at', '>=', $today->subDays(6))
                ->join('payment_methods', 'payment_methods.id', '=', 'payments.payment_method_id')
                ->selectRaw('DATE(paid_at) AS day, payment_methods.code AS method, SUM(amount_cents) AS total')
                ->groupBy('day', 'method')->get();
            $todayKey = $today->toDateString();
            $sum = fn (?string $method = null, ?string $day = null) => (int) $sales
                ->filter(fn ($row) => ($method === null || $row->method === $method) && ($day === null || $row->day === $day))
                ->sum('total');

            $summary['kpis']['salesTodayCents'] = $sum(null, $todayKey);
            $summary['kpis']['salesTodayCashCents'] = $sum('cash', $todayKey);
            $summary['kpis']['salesTodayGcashCents'] = $sum('gcash', $todayKey);
            $summary['weeklySales'] = collect(range(6, 0))->map(fn (int $back) => [
                'date' => $today->subDays($back)->toDateString(),
                'salesCents' => $sum(null, $today->subDays($back)->toDateString()),
            ])->values();
        }

        // Both roles see what needs doing next: the oldest order in each working stage, then
        // ready orders nobody has collected for more than two days.
        $needsAction = [];
        foreach (array_diff(StatusRules::BOARD, ['ready_for_pickup']) as $code) {
            $oldest = (clone $orders)->where('current_status_id', OrderStatus::idFor($code))
                ->orderByRaw(Order::STATUS_SINCE_SQL)->orderBy('id')->first();
            if ($oldest) {
                $needsAction[] = [
                    'order' => new OrderResource($oldest),
                    'kind' => 'waiting',
                    'reason' => StatusRules::label($code).' '.self::elapsed($oldest->statusSince(), $now),
                ];
            }
        }
        foreach ($readyOver as $order) {
            $needsAction[] = [
                'order' => new OrderResource($order),
                'kind' => 'unclaimed',
                'reason' => 'Ready '.self::elapsed($order->statusSince(), $now).', not claimed',
            ];
        }
        $summary['needsAction'] = $needsAction;

        return $this->ok('Dashboard', $summary);
    }

    /** "45 min", "3 hr", "2 days" (lib/dates.ts formatElapsed). */
    public static function elapsed(string $from, CarbonImmutable $now): string
    {
        $minutes = max(0, (int) floor(($now->getTimestamp() - CarbonImmutable::parse($from)->getTimestamp()) / 60));
        if ($minutes < 60) {
            return "{$minutes} min";
        }
        if ($minutes < 60 * 24) {
            return intdiv($minutes, 60).' hr';
        }
        $days = intdiv($minutes, 60 * 24);

        return $days === 1 ? '1 day' : "{$days} days";
    }
}
