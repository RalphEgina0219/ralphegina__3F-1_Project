<?php

namespace App\Http\Resources\V1;

use App\Models\ShopSetting;
use Illuminate\Http\Request;

/**
 * The shop profile. Inside an order only the parts printed on the order summary are sent.
 *
 * @mixin ShopSetting
 */
class ShopSettingsResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return [
            'type' => 'shopSettings',
            'id' => 1,
            'attributes' => [
                'name' => $this->name,
                'address' => $this->address,
                'contactNumber' => $this->contact_number,
                'receiptFooter' => $this->receipt_footer,
                $this->mergeWhen($request->routeIs('settings.*'), fn () => [
                    'openingHours' => $this->opening_hours,
                    'claimPolicyDays' => (int) $this->claim_policy_days,
                ]),
            ],
        ];
    }
}
