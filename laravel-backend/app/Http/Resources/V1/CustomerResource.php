<?php

namespace App\Http\Resources\V1;

use App\Models\Customer;
use Illuminate\Http\Request;

/**
 * Transforms a Customer for the staff screens. The account part never includes the password hash.
 *
 * @mixin Customer
 */
class CustomerResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        $account = $this->relationLoaded('account') ? $this->account : null;

        return [
            'type' => 'customer',
            'id' => $this->id,
            'attributes' => [
                'fullName' => $this->full_name,
                'contactNumber' => $this->contact_number,
                'barangayName' => $this->whenLoaded('barangay', fn () => $this->barangay->name),
                'streetAddress' => $this->street_address,
                // Staff notes stay off the order screens' customer summary (L10)
                'notes' => $this->when(! $request->routeIs(['orders.*', 'scan.*', 'balances.*', 'dashboard.*']), $this->notes),
                $this->mergeWhen($this->relationLoaded('account'), fn () => [
                    'hasAccount' => $account !== null,
                    'account' => $account ? [
                        'email' => $account->email,
                        'isActive' => $account->is_active,
                        'mustChangePassword' => $account->must_change_password,
                        'lastLoginAt' => $this->iso($account->last_login_at),
                        'createdAt' => $this->iso($account->created_at),
                    ] : null,
                ]),
                'ordersCount' => $this->whenHas('orders_count', fn () => (int) $this->orders_count),
                'lastVisitAt' => $this->whenHas('last_visit_at', fn () => $this->iso($this->last_visit_at)),
                'totalSpentCents' => $this->whenHas('total_spent_cents', fn () => (int) $this->total_spent_cents),
                'balanceCents' => $this->whenHas('balance_cents', fn () => (int) $this->balance_cents),
                'createdAt' => $this->iso($this->created_at),
                'updatedAt' => $this->iso($this->updated_at),
            ],
            'relationships' => [
                'barangay' => $this->ref('barangay', $this->barangay_id),
            ],
            'links' => [
                'self' => route('customers.show', ['customer' => $this->id]),
            ],
        ];
    }
}
