<?php

namespace App\Actions\V1;

use App\Models\Basket;
use App\Models\OrderBasket;
use App\Models\ShopSetting;
use App\Models\User;
use App\Support\Audit;
use App\Support\BasketCodes;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Adding and retiring baskets. Numbers continue after the highest ever issued (retired ones
 * included), so none is reused; tokens are created once and never regenerated; a basket that
 * holds an order cannot be retired, and no basket is ever deleted.
 */
final class Baskets
{
    /** @return Collection<int, Basket> */
    public function create(User $staff, int $count, ?string $label): Collection
    {
        return DB::transaction(function () use ($staff, $count, $label) {
            // Lock the basket numbers so two admins adding at once cannot get the same one.
            $sequence = (int) DB::table('baskets')
                ->lockForUpdate()
                ->selectRaw("COALESCE(MAX(CAST(SUBSTRING_INDEX(basket_number, '-', -1) AS UNSIGNED)), 0) AS last")
                ->value('last');

            // The prefix applies to new baskets only: existing numbers stay as they are.
            $prefix = ShopSetting::current()->basket_prefix ?: 'BSK';
            $taken = Basket::query()->pluck('qr_token')->flip();
            $created = collect();

            for ($i = 0; $i < $count; $i++) {
                $sequence++;
                do {
                    $token = BasketCodes::generateToken();
                } while (isset($taken[$token]));
                $taken[$token] = true;

                $created->push(Basket::query()->create([
                    'basket_number' => BasketCodes::formatBasketNumber($sequence, $prefix),
                    'qr_token' => $token,
                    'label' => $label,
                    'status' => 'available',
                    'notes' => null,
                    'created_by' => $staff->id,
                ]));
            }

            Audit::record($staff->id, 'basket.created', 'basket', $created->first()?->id, [
                'count' => $count,
                'basket_number' => $created->first()?->basket_number,
            ]);

            return $created;
        });
    }

    /** @param  array<string, mixed>  $attributes  label and/or notes */
    public function update(User $staff, Basket $basket, array $attributes): Basket
    {
        return DB::transaction(function () use ($staff, $basket, $attributes) {
            $before = ['label' => $basket->label, 'notes' => $basket->notes];
            $basket->update($attributes);
            Audit::record($staff->id, 'basket.updated', 'basket', $basket->id, [
                'basket_number' => $basket->basket_number,
                'label' => $basket->label,
                'notes' => $basket->notes,
            ], $before);

            return $basket;
        });
    }

    public function retire(User $staff, Basket $basket, ?string $reason): Basket
    {
        return DB::transaction(function () use ($staff, $basket, $reason) {
            $locked = Basket::query()->lockForUpdate()->findOrFail($basket->id);

            if ($locked->status === 'retired') {
                abort(409, "{$locked->basket_number} is already retired.");
            }

            $active = OrderBasket::query()->with('order:id,order_number')->where('basket_id', $locked->id)->whereNull('released_at')->lockForUpdate()->first();
            if ($active) {
                $orderNumber = $active->order?->order_number ?? 'another order';
                abort(409, "{$locked->basket_number} is in use by {$orderNumber}. Complete that order first.");
            }

            $locked->forceFill(['status' => 'retired'] + ($reason ? ['notes' => $reason] : []))->save();
            Audit::record($staff->id, 'basket.retired', 'basket', $locked->id, [
                'basket_number' => $locked->basket_number,
                'reason' => $reason,
            ]);

            return $locked;
        });
    }
}
