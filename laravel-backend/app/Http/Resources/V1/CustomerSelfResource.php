<?php

namespace App\Http\Resources\V1;

use App\Models\CustomerAccount;
use Illuminate\Http\Request;

/**
 * The signed-in customer, as the portal sees themselves. Built field by field from the account
 * and its profile, so nothing internal (notes, staff data) reaches a customer.
 *
 * @mixin CustomerAccount
 */
class CustomerSelfResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        $customer = $this->customer;

        return [
            'type' => 'customerAccount',
            'id' => $customer->id,
            'attributes' => [
                'fullName' => $customer->full_name,
                'email' => $this->email,
                'contactNumber' => $customer->contact_number,
                'barangayId' => $customer->barangay_id,
                'barangayName' => $customer->barangay?->name ?? '',
                'streetAddress' => $customer->street_address,
                'mustChangePassword' => $this->must_change_password,
            ],
            'links' => [
                'self' => route('customer.auth.me'),
            ],
        ];
    }
}
