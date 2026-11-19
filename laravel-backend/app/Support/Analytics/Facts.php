<?php

namespace App\Support\Analytics;

use App\Models\InventoryItem;
use App\Support\InventoryRules;
use App\Support\Js;
use App\Support\WashRules;
use Illuminate\Support\Facades\DB;

/**
 * The facts every analytics endpoint reads, from a handful of SQL queries (the frontend's
 * mocks/analytics.ts builds the same rows from its tables). Per-order sums, first-ready and
 * last-change times are SQL aggregates (GROUP BY); instants come back as epoch milliseconds,
 * so the Manila-day grouping in Series is exact whatever the server time zone.
 */
final class Facts
{
    /** The pseudo service id and name under which wash type surcharges are reported. */
    public const SURCHARGE_ID = 0;

    public const SURCHARGE_NAME = 'Wash type surcharges';

    public static function load(): array
    {
        $paid = DB::table('payments')->whereNull('voided_at')
            ->select('order_id', DB::raw('SUM(amount_cents) AS paid'))->groupBy('order_id')
            ->pluck('paid', 'order_id');

        // First time each order reached Ready for pickup, and when it entered its current status.
        $history = DB::table('order_status_history')
            ->select('order_id',
                DB::raw("MIN(CASE WHEN to_status_id = (SELECT id FROM order_statuses WHERE code = 'ready_for_pickup') THEN UNIX_TIMESTAMP(changed_at) END) * 1000 AS ready_at"),
                DB::raw('MAX(UNIX_TIMESTAMP(changed_at)) * 1000 AS status_since'))
            ->groupBy('order_id')->get()->keyBy('order_id');

        $lines = [];
        foreach (DB::table('order_items as oi')->join('services as s', 's.id', '=', 'oi.service_id')
            ->orderBy('oi.order_id')->orderBy('oi.id')
            ->get(['oi.order_id', 'oi.service_id', 's.name', 's.pricing_type', 'oi.weight_kg', 'oi.quantity', 'oi.subtotal_cents']) as $row) {
            $lines[$row->order_id][] = [
                'service_id' => (int) $row->service_id,
                'service_name' => $row->name,
                'subtotal_cents' => (int) $row->subtotal_cents,
                'kilos' => $row->weight_kg === null ? 0 : (float) $row->weight_kg,
                'pieces' => $row->pricing_type === 'per_piece' ? (int) ($row->quantity ?? 0) : 0,
                'flat' => $row->pricing_type === 'flat',
            ];
        }

        $orders = [];
        foreach (DB::table('orders as o')
            ->join('customers as c', 'c.id', '=', 'o.customer_id')
            ->join('barangays as b', 'b.id', '=', 'c.barangay_id')
            ->join('order_statuses as st', 'st.id', '=', 'o.current_status_id')
            ->join('wash_types as w', 'w.id', '=', 'o.wash_type_id')
            ->orderBy('o.id')
            ->get([
                'o.id', 'o.order_number', 'o.customer_id', 'c.full_name', 'b.name as barangay', 'o.received_by', 'st.code as status', 'o.wash_type_id', 'w.name as wash_type', 'o.wash_surcharge_per_kg_cents',
                DB::raw('UNIX_TIMESTAMP(o.received_at) * 1000 AS received_ms'),
                DB::raw('UNIX_TIMESTAMP(o.promised_at) * 1000 AS promised_ms'),
                DB::raw('UNIX_TIMESTAMP(o.released_at) * 1000 AS released_ms'),
            ]) as $row) {
            $orderLines = $lines[$row->id] ?? [];
            $kilos = Js::roundTo(array_sum(array_column($orderLines, 'kilos')), 1);
            // The wash type surcharge is its own revenue category, so totals still reconcile.
            $surcharge = WashRules::surchargeCents(Js::round($kilos * 10), (int) $row->wash_surcharge_per_kg_cents);
            if ($surcharge > 0) {
                $orderLines[] = ['service_id' => self::SURCHARGE_ID, 'service_name' => self::SURCHARGE_NAME, 'subtotal_cents' => $surcharge, 'kilos' => 0, 'pieces' => 0, 'flat' => false, 'surcharge' => true];
            }
            $received = (int) $row->received_ms;
            $since = $history[$row->id]->status_since ?? null;
            $ready = $history[$row->id]->ready_at ?? null;
            $orders[] = [
                'id' => (int) $row->id,
                'order_number' => $row->order_number,
                'customer_id' => (int) $row->customer_id,
                'customer_name' => $row->full_name,
                'barangay' => $row->barangay,
                'received_at' => $received,
                'received_at_iso' => ManilaTime::iso($received),
                'received_by' => (int) $row->received_by,
                'promised_at' => (int) $row->promised_ms,
                'ready_at' => $ready !== null ? (int) $ready : null,
                'released_at' => $row->released_ms !== null ? (int) $row->released_ms : null,
                'status' => $row->status,
                'wash_type_id' => (int) $row->wash_type_id,
                'wash_type' => $row->wash_type,
                'status_since' => $since !== null ? (int) $since : $received,
                'total_cents' => (int) array_sum(array_column($orderLines, 'subtotal_cents')),
                'paid_cents' => (int) ($paid[$row->id] ?? 0),
                'kilos' => $kilos,
                'pieces' => (int) array_sum(array_column($orderLines, 'pieces')),
                'express' => in_array(true, array_column($orderLines, 'flat'), true),
                'lines' => $orderLines,
            ];
        }

        $payments = [];
        $paymentLog = [];
        foreach (DB::table('payments as p')->join('payment_methods as m', 'm.id', '=', 'p.payment_method_id')->orderBy('p.id')
            ->get(['p.id', 'p.order_id', 'p.amount_cents', 'm.code', 'p.received_by', 'p.receipt_number', 'p.voided_at', DB::raw('UNIX_TIMESTAMP(p.paid_at) * 1000 AS paid_ms')]) as $row) {
            $payments[] = [
                'id' => (int) $row->id,
                'order_id' => (int) $row->order_id,
                'amount_cents' => (int) $row->amount_cents,
                'method' => $row->code,
                'paid_at' => (int) $row->paid_ms,
                'paid_at_iso' => ManilaTime::iso((int) $row->paid_ms),
                'received_by' => (int) $row->received_by,
                'voided' => $row->voided_at !== null,
            ];
            $paymentLog[(int) $row->id] = $row->receipt_number;
        }

        $changes = DB::table('order_status_history as h')->join('order_statuses as s', 's.id', '=', 'h.to_status_id')
            ->orderBy('h.id')
            ->get(['h.order_id', 's.code', 'h.changed_by', DB::raw('UNIX_TIMESTAMP(h.changed_at) * 1000 AS changed_ms')])
            ->map(fn ($row) => [
                'order_id' => (int) $row->order_id,
                'to_status' => $row->code,
                'changed_by' => (int) $row->changed_by,
                'changed_at' => (int) $row->changed_ms,
            ])->all();

        $movements = DB::table('inventory_movements')->orderBy('id')
            ->get(['item_id', 'order_id', 'type', 'quantity', 'user_id', DB::raw('UNIX_TIMESTAMP(moved_at) * 1000 AS moved_ms')])
            ->map(fn ($row) => [
                'item_id' => (int) $row->item_id,
                'order_id' => $row->order_id === null ? null : (int) $row->order_id,
                'type' => $row->type,
                'quantity' => (float) $row->quantity,
                'moved_at' => (int) $row->moved_ms,
                'moved_at_iso' => ManilaTime::iso((int) $row->moved_ms),
                'user_id' => (int) $row->user_id,
            ])->all();

        $items = DB::table('inventory_items as i')->join('units as u', 'u.id', '=', 'i.unit_id')
            ->where('i.is_active', true)->orderBy('i.id')
            ->get(['i.id', 'i.name', 'u.code', 'i.reorder_level', DB::raw(str_replace('inventory_items.id', 'i.id', InventoryItem::ON_HAND_SQL).' AS on_hand')])
            ->map(function ($row) {
                $onHand = InventoryRules::round((float) $row->on_hand);
                $reorder = (float) $row->reorder_level;

                return [
                    'id' => (int) $row->id,
                    'name' => $row->name,
                    'unit' => $row->code,
                    'on_hand' => $onHand,
                    'reorder_level' => $reorder,
                    'stock_status' => InventoryRules::stockStatus($onHand, $reorder),
                ];
            })->all();

        $staff = DB::table('users')->orderBy('id')->get(['id', 'name'])
            ->map(fn ($row) => ['id' => (int) $row->id, 'name' => $row->name])->all();

        $baskets = DB::table('baskets')->selectRaw("SUM(status = 'in_use') AS in_use, SUM(status <> 'retired') AS usable")->first();

        return [
            'orders' => $orders,
            'payments' => $payments,
            'changes' => $changes,
            'movements' => $movements,
            'items' => $items,
            'staff' => $staff,
            'baskets' => ['in_use' => (int) $baskets->in_use, 'usable' => (int) $baskets->usable],
            'paymentLog' => $paymentLog,
        ];
    }
}
