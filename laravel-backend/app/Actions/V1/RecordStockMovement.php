<?php

namespace App\Actions\V1;

use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\User;
use App\Support\Audit;
use App\Support\InventoryRules;
use App\Support\Notifier;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Records stock in, stock out or an adjustment, with the item row locked so two stock-outs cannot
 * both take the last unit. A stock-out cannot exceed what is on hand; an adjustment cannot leave
 * less than zero. When the level drops into Low or Critical, the staff bell says so.
 */
final class RecordStockMovement
{
    public function __invoke(int $itemId, string $type, float $quantity, ?string $remarks, User $staff): InventoryMovement
    {
        return DB::transaction(function () use ($itemId, $type, $quantity, $remarks, $staff) {
            $item = InventoryItem::query()->with('unit')->lockForUpdate()->findOrFail($itemId);
            $current = $item->onHand();

            $check = InventoryRules::checkMovement($type, $quantity, $current);
            if (! $check['ok']) {
                throw ValidationException::withMessages(['data.attributes.quantity' => $check['message']]);
            }

            $movement = InventoryMovement::query()->create([
                'item_id' => $item->id,
                'user_id' => $staff->id,
                'type' => $type,
                'quantity' => $quantity,
                'remarks' => $remarks,
                'moved_at' => now(),
            ]);

            $after = InventoryRules::round($current + InventoryRules::signedQuantity($type, $quantity));
            $before = InventoryRules::stockStatus($current, (float) $item->reorder_level);
            $now = InventoryRules::stockStatus($after, (float) $item->reorder_level);
            if ($now !== 'ok' && $now !== $before) {
                $level = $now === 'critical' ? 'critically low' : 'below its reorder level';
                Notifier::staff('low_stock', "{$item->name} is {$level} (".InventoryRules::format($after).' '.($item->unit?->code ?? '').' left).');
            }

            Audit::record($staff->id, 'inventory.movement', 'inventory_item', $item->id, [
                'item_name' => $item->name,
                'type' => $type,
                'quantity' => $quantity,
                'remarks' => $remarks,
            ]);

            return $movement;
        });
    }
}
