<?php

namespace App\Http\Controllers\Api\V1\Portal;

use App\Http\Controllers\Api\V1\APIController;
use App\Http\Requests\Api\RegisterCustomerRequest;
use App\Http\Resources\V1\CustomerSelfResource;
use App\Models\CustomerAccount;
use App\Support\AccountRules;

/**
 * @group Customer portal
 */
class PortalAccountController extends APIController
{
    /**
     * Update my details
     *
     * Only the phone number, barangay and street address. The name, email and the shop's notes
     * stay with the shop.
     *
     * @bodyParam data.attributes.contactNumber string Example: 0917 845 2210
     * @bodyParam data.attributes.streetAddress string Example: Purok 2
     * @bodyParam data.relationships.barangay.data.id integer Example: 28
     */
    public function update()
    {
        /** @var CustomerAccount $account */
        $account = auth('customer')->user()->load('customer.barangay');
        $customer = $account->customer;

        $request = request();
        if ($request->has('data.attributes.contactNumber')) {
            $data = (array) $request->input('data');
            $data['attributes']['contactNumber'] = AccountRules::normalizePhone($request->input('data.attributes.contactNumber'));
            $request->merge(['data' => $data]);
        }

        $request->validate([
            'data.attributes.contactNumber' => ['sometimes', 'bail', 'string', 'regex:/^09\d{9}$/', RegisterCustomerRequest::phoneRule($customer->id)],
            'data.attributes.streetAddress' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.relationships.barangay.data.id' => ['sometimes', 'integer', 'exists:barangays,id'],
        ], [
            'data.attributes.contactNumber.regex' => 'Use a PH mobile number: 09XX XXX XXXX.',
            'data.relationships.barangay.data.id.exists' => 'Choose your barangay.',
            'data.relationships.barangay.data.id.integer' => 'Choose your barangay.',
        ]);

        $changes = [];
        if ($request->has('data.attributes.contactNumber')) {
            $changes['contact_number'] = $request->input('data.attributes.contactNumber');
        }
        if ($request->has('data.relationships.barangay.data.id')) {
            $changes['barangay_id'] = (int) $request->input('data.relationships.barangay.data.id');
        }
        if ($request->has('data.attributes.streetAddress')) {
            $street = $request->input('data.attributes.streetAddress');
            $changes['street_address'] = is_string($street) && trim($street) !== '' ? trim($street) : null;
        }
        $customer->update($changes);

        return $this->ok('Account updated', ['customer' => new CustomerSelfResource($account->fresh('customer.barangay'))]);
    }
}
