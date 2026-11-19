<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\ShopSetting;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;

/**
 * @group Settings
 *
 * The soap stock rule: whether an order is refused (409) when its wash type needs more soap than
 * the stock records show. Off by default: the order is saved and the stock is clamped at zero.
 */
class StockRuleController extends APIController
{
    /**
     * Set the soap stock rule
     *
     * @bodyParam data.attributes.blockOrdersOnLowSoap boolean required Example: false
     */
    public function replace()
    {
        $settings = ShopSetting::current();
        if (! $this->isAble('replace', $settings)) {
            return $this->notAuthorized('You are not authorized to update the shop settings.');
        }

        $value = (bool) request()->validate([
            'data.attributes.blockOrdersOnLowSoap' => ['required', 'boolean'],
        ])['data']['attributes']['blockOrdersOnLowSoap'];

        DB::transaction(function () use ($settings, $value) {
            $before = (bool) $settings->block_orders_on_low_soap;
            $settings->update(['block_orders_on_low_soap' => $value]);
            if ($before !== $value) {
                Audit::record(request()->user()->id, 'settings.stock_rule_updated', 'shop_settings', 1, [
                    'summary' => 'turned '.($value ? 'on' : 'off').' "Block new orders when soap stock is insufficient"',
                    'block_orders_on_low_soap' => $value,
                ], ['block_orders_on_low_soap' => $before]);
            }
        });

        return $this->ok('Stock rule saved', ['blockOrdersOnLowSoap' => $value]);
    }
}
