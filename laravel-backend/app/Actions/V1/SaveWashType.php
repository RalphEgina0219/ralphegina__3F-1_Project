<?php

namespace App\Actions\V1;

use App\Models\User;
use App\Models\WashType;
use App\Support\Audit;
use App\Support\Money;
use App\Support\WashRules;
use Illuminate\Support\Facades\DB;

/**
 * Creates or changes a wash type and its supplies in one transaction. Every change writes its own
 * audit row with the old and the new value, for example
 * "Regular washing · Detergent powder: 25 g/kg → 50 g/kg".
 */
final class SaveWashType
{
    /**
     * @param  array<string, mixed>  $attributes  columns to write
     * @param  list<array{inventory_item_id: int, usage: float}>|null  $supplies  the full new list, or null to leave it
     */
    public function __invoke(?WashType $washType, array $attributes, ?array $supplies, User $staff): WashType
    {
        return DB::transaction(function () use ($washType, $attributes, $supplies, $staff) {
            $isNew = $washType === null;
            $oldSupplies = $isNew ? [] : $this->usageByItem($washType->load('supplies.item.unit'));
            $old = [];

            if ($isNew) {
                $washType = WashType::query()->create($attributes + ['sort_order' => (int) WashType::query()->max('sort_order') + 1]);
            } else {
                $old = $washType->only(['name', 'description', 'surcharge_per_kg_cents', 'sort_order', 'is_active']);
                $washType->update($attributes);
            }

            if ($supplies !== null) {
                $washType->supplies()->whereNotIn('inventory_item_id', array_column($supplies, 'inventory_item_id'))->delete();
                foreach ($supplies as $row) {
                    $washType->supplies()->updateOrCreate(
                        ['inventory_item_id' => $row['inventory_item_id']],
                        ['usage_per_kg_small_unit' => $row['usage']],
                    );
                }
            }

            $washType->load('supplies.item.unit');
            $name = $washType->name;

            if ($isNew) {
                $this->log($staff, $washType, "added wash type {$name}", null, ['name' => $name]);
            } else {
                foreach ($this->fieldChanges($old, $washType) as [$summary, $oldValues, $newValues]) {
                    $this->log($staff, $washType, $summary, $oldValues, $newValues);
                }
            }

            $newSupplies = $this->usageByItem($washType);
            foreach (array_keys($newSupplies + $oldSupplies) as $itemId) {
                $was = $oldSupplies[$itemId] ?? null;
                $now = $newSupplies[$itemId] ?? null;
                if ($was !== null && $now !== null && $was['usage'] === $now['usage']) {
                    continue;
                }
                $label = ($now ?? $was)['name'];
                $summary = match (true) {
                    $was === null => "{$name} · added {$label}: ".WashRules::formatUsage($now['unit'], $now['usage']),
                    $now === null => "{$name} · removed {$label}: ".WashRules::formatUsage($was['unit'], $was['usage']),
                    default => "{$name} · {$label}: ".WashRules::formatUsage($was['unit'], $was['usage']).' → '.WashRules::formatUsage($now['unit'], $now['usage']),
                };
                $this->log($staff, $washType, $summary,
                    $was ? ['item' => $label, 'usage_per_kg_small_unit' => $was['usage']] : null,
                    $now ? ['item' => $label, 'usage_per_kg_small_unit' => $now['usage']] : null);
            }

            return $washType;
        });
    }

    /**
     * @param  array<string, mixed>  $old
     * @return list<array{0: string, 1: array<string, mixed>, 2: array<string, mixed>}>
     */
    private function fieldChanges(array $old, WashType $washType): array
    {
        $name = $washType->name;
        $changes = [];

        if ($old['name'] !== $washType->name) {
            $changes[] = ["renamed wash type {$old['name']} → {$name}", ['name' => $old['name']], ['name' => $name]];
        }
        if ($old['description'] !== $washType->description) {
            $changes[] = ["{$name} · description changed", ['description' => $old['description']], ['description' => $washType->description]];
        }
        if ((int) $old['surcharge_per_kg_cents'] !== (int) $washType->surcharge_per_kg_cents) {
            $changes[] = [
                "{$name} · surcharge: ".Money::format((int) $old['surcharge_per_kg_cents']).'/kg → '.Money::format((int) $washType->surcharge_per_kg_cents).'/kg',
                ['surcharge_per_kg_cents' => (int) $old['surcharge_per_kg_cents']],
                ['surcharge_per_kg_cents' => (int) $washType->surcharge_per_kg_cents],
            ];
        }
        if ((int) $old['sort_order'] !== (int) $washType->sort_order) {
            $changes[] = ["{$name} · order: {$old['sort_order']} → {$washType->sort_order}", ['sort_order' => (int) $old['sort_order']], ['sort_order' => (int) $washType->sort_order]];
        }
        if ((bool) $old['is_active'] !== (bool) $washType->is_active) {
            $changes[] = ["{$name} · ".($washType->is_active ? 'activated' : 'deactivated'), ['is_active' => (bool) $old['is_active']], ['is_active' => (bool) $washType->is_active]];
        }

        return $changes;
    }

    /** @return array<int, array{name: string, unit: string, usage: float}> */
    private function usageByItem(WashType $washType): array
    {
        $rows = [];
        foreach ($washType->supplies as $supply) {
            $rows[(int) $supply->inventory_item_id] = [
                'name' => $supply->item?->name ?? '',
                'unit' => $supply->item?->unit?->code ?? '',
                'usage' => (float) $supply->usage_per_kg_small_unit,
            ];
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>|null  $old
     * @param  array<string, mixed>|null  $new
     */
    private function log(User $staff, WashType $washType, string $summary, ?array $old, ?array $new): void
    {
        Audit::record($staff->id, 'wash_type.updated', 'wash_type', $washType->id, ['summary' => $summary, 'wash_type' => $washType->name] + ($new ?? []), $old);
    }
}
