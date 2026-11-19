<?php

namespace App\Actions\V1;

use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\ShopSetting;
use App\Models\User;
use App\Models\WashType;
use App\Support\InventoryRules;
use App\Support\Notifier;
use App\Support\StockAlerts;
use App\Support\WashRules;

/**
 * The soap an order uses: amount = usage per kilo × the order's per-kg weight, converted to the
 * item's unit, deducted as inventory movements of type usage inside the order's transaction.
 *
 * The items are locked while the stock is read, so two orders cannot both take the last millilitre.
 * Stock never goes below zero: only what is recorded is deducted, and the shortfall is written
 * into the movement's remarks and the staff bell ("Record a stock-in for …"). With the shop's
 * "block orders when soap stock is insufficient" rule on, a shortage refuses the order (409).
 */
final class SoapUsage
{
    /**
     * What the order needs and what is recorded, one row per supply of the wash type.
     *
     * @return list<array{item: InventoryItem, needed: float, on_hand: float, short: float}>
     */
    public function plan(WashType $washType, int $perKgTenths): array
    {
        if ($perKgTenths <= 0) {
            return [];
        }

        $supplies = $washType->supplies()->orderBy('inventory_item_id')->get();
        if ($supplies->isEmpty()) {
            return [];
        }

        $items = InventoryItem::query()->with('unit')->whereIn('id', $supplies->pluck('inventory_item_id'))
            ->orderBy('id')->lockForUpdate()->get()->keyBy('id');

        $plan = [];
        foreach ($supplies as $supply) {
            $item = $items->get($supply->inventory_item_id);
            if (! $item) {
                continue;
            }
            $needed = WashRules::usageQuantity($item->unit->code, (float) $supply->usage_per_kg_small_unit, $perKgTenths);
            $onHand = max(0.0, $item->onHand());
            $plan[] = [
                'item' => $item,
                'needed' => $needed,
                'on_hand' => $onHand,
                'short' => InventoryRules::round(max(0.0, $needed - $onHand)),
            ];
        }

        return $plan;
    }

    /**
     * Refuses the order (409) when the shop blocks orders on a soap shortage and one item is short.
     *
     * @param  list<array{item: InventoryItem, needed: float, on_hand: float, short: float}>  $plan
     */
    public function guard(array $plan): void
    {
        if (! ShopSetting::current()->block_orders_on_low_soap) {
            return;
        }

        $messages = [];
        foreach ($plan as $row) {
            if ($row['short'] > 0) {
                $messages[] = WashRules::shortageMessage($row['item']->name, $row['item']->unit->code, $row['needed'], $row['on_hand']);
            }
        }
        if ($messages !== []) {
            abort(409, 'Not enough soap in stock. '.implode('; ', $messages).'.');
        }
    }

    /**
     * Writes one usage movement per item, by the staff member who took the order.
     *
     * @param  list<array{item: InventoryItem, needed: float, on_hand: float, short: float}>  $plan
     */
    public function deduct(Order $order, WashType $washType, int $perKgTenths, array $plan, User $staff): void
    {
        foreach ($plan as $row) {
            /** @var InventoryItem $item */
            $item = $row['item'];
            $deducted = InventoryRules::round(min($row['needed'], $row['on_hand']));

            $remarks = "Order {$order->order_number} · {$washType->name} · ".InventoryRules::format($perKgTenths / 10).' kg';
            if ($row['short'] > 0) {
                $remarks .= ' · short by '.WashRules::formatAmount($item->unit->code, $row['short']).', only '.WashRules::formatAmount($item->unit->code, $row['on_hand']).' was recorded';
            }

            InventoryMovement::query()->create([
                'item_id' => $item->id,
                'user_id' => $staff->id,
                'order_id' => $order->id,
                'type' => InventoryMovement::USAGE,
                'quantity' => $deducted,
                'required_quantity' => $row['needed'],
                'remarks' => $remarks,
                'moved_at' => now(),
            ]);

            if ($row['short'] > 0) {
                Notifier::staff('low_stock', "Record a stock-in for {$item->name}: order {$order->order_number} needed ".WashRules::formatAmount($item->unit->code, $row['needed']).' but only '.WashRules::formatAmount($item->unit->code, $row['on_hand']).' was recorded.', $order->id);
            }

            StockAlerts::afterChange($item, $row['on_hand'], InventoryRules::round($row['on_hand'] - $deducted));
        }
    }
}
