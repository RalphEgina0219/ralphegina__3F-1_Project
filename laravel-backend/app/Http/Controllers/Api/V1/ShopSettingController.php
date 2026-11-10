<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\ShopSettingsResource;
use App\Models\ShopSetting;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;

/**
 * @group Settings
 *
 * The shop profile: a single record, replaced as a whole (PUT).
 */
class ShopSettingController extends APIController
{
    /** Shop profile */
    public function show()
    {
        $settings = ShopSetting::current();
        if (! $this->isAble('view', $settings)) {
            return $this->notAuthorized('You are not authorized to view the shop profile.');
        }

        return new ShopSettingsResource($settings);
    }

    /**
     * Replace the shop profile
     *
     * @bodyParam data.attributes.name string required Example: LaundryFlow
     * @bodyParam data.attributes.address string required Example: Brgy. Poblacion, Bongabong, Oriental Mindoro
     * @bodyParam data.attributes.contactNumber string Example: 0917 555 0101
     * @bodyParam data.attributes.openingHours string Example: Open daily 7:00 AM – 7:00 PM
     * @bodyParam data.attributes.receiptFooter string The closing note of every order summary. Example: Salamat po!
     * @bodyParam data.attributes.claimPolicyDays integer required Example: 30
     */
    public function replace()
    {
        $settings = ShopSetting::current();
        if (! $this->isAble('replace', $settings)) {
            return $this->notAuthorized('You are not authorized to update the shop profile.');
        }

        $validated = request()->validate([
            'data.attributes.name' => ['required', 'string', 'max:255'],
            'data.attributes.address' => ['required', 'string', 'max:255'],
            'data.attributes.contactNumber' => ['present', 'nullable', 'string', 'max:50'],
            'data.attributes.openingHours' => ['present', 'nullable', 'string', 'max:255'],
            'data.attributes.receiptFooter' => ['present', 'nullable', 'string', 'max:500'],
            'data.attributes.claimPolicyDays' => ['required', 'integer', 'min:0', 'max:3650'],
        ], [
            'data.attributes.name.required' => 'Enter the shop name.',
            'data.attributes.address.required' => 'Enter the address.',
            'data.attributes.claimPolicyDays.required' => 'Enter a whole number of days.',
            'data.attributes.claimPolicyDays.integer' => 'Enter a whole number of days.',
            'data.attributes.claimPolicyDays.min' => 'Enter a whole number of days.',
        ])['data']['attributes'];

        DB::transaction(function () use ($settings, $validated) {
            $before = $settings->only(['name', 'address', 'contact_number', 'opening_hours', 'receipt_footer', 'claim_policy_days']);
            $settings->update([
                'name' => trim($validated['name']),
                'address' => trim($validated['address']),
                'contact_number' => trim((string) $validated['contactNumber']),
                'opening_hours' => trim((string) $validated['openingHours']),
                'receipt_footer' => trim((string) $validated['receiptFooter']),
                'claim_policy_days' => (int) $validated['claimPolicyDays'],
            ]);
            Audit::record(request()->user()->id, 'settings.updated', 'shop_settings', 1,
                $settings->only(['name', 'address', 'contact_number', 'opening_hours', 'receipt_footer', 'claim_policy_days']), $before);
        });

        return new ShopSettingsResource($settings->fresh());
    }
}
