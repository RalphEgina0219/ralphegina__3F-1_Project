<?php

namespace App\Support;

use App\Models\InventoryItem;

/**
 * The staff bell's low-stock notice: sent when a change moves an item into Low or Critical.
 * Shared by manual stock movements and the soap that orders use.
 */
final class StockAlerts
{
    public static function afterChange(InventoryItem $item, float $before, float $after): void
    {
        $was = InventoryRules::stockStatus($before, (float) $item->reorder_level);
        $now = InventoryRules::stockStatus($after, (float) $item->reorder_level);

        if ($now !== 'ok' && $now !== $was) {
            $level = $now === 'critical' ? 'critically low' : 'below its reorder level';
            Notifier::staff('low_stock', "{$item->name} is {$level} (".InventoryRules::format($after).' '.($item->unit?->code ?? '').' left).');
        }
    }
}
