<?php

namespace App\Http\Resources\V1;

use App\Models\Order;
use App\Models\ShopSetting;
use App\Support\WashRules;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\MissingValue;

/**
 * An order for the staff screens. Totals, balance and payment status are computed, never stored.
 * Related data comes with ?include= (course L11):
 * customer, baskets, items, receivedBy, payments, statusHistory, basketHistory, shop.
 *
 * @mixin Order
 */
class OrderResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return $this->withIncludes([
            'type' => 'order',
            'id' => $this->id,
            'attributes' => [
                'orderNumber' => $this->order_number,
                'status' => $this->statusCode(),
                'statusLabel' => $this->statusLabel(),
                'statusSince' => $this->statusSince(),
                'receivedAt' => $this->iso($this->received_at),
                'promisedAt' => $this->iso($this->promised_at),
                'releasedAt' => $this->iso($this->released_at),
                'notes' => $this->notes,
                'washSurchargePerKgCents' => (int) $this->wash_surcharge_per_kg_cents,
                'washSurchargeCents' => $this->washSurchargeCents(),
                'perKgWeightKg' => $this->perKgTenths() / 10,
                'totalCents' => $this->totalCents(),
                'paidCents' => $this->paidCents(),
                'balanceCents' => $this->balanceCents(),
                'paymentStatus' => $this->paymentStatus(),
                'isOverdue' => $this->isOverdue(),
                'createdAt' => $this->iso($this->created_at),
                'updatedAt' => $this->iso($this->updated_at),
            ],
            'relationships' => [
                'customer' => $this->ref('customer', $this->customer_id, 'customers.show', ['customer' => $this->customer_id]),
                'receivedBy' => $this->ref('user', $this->received_by, 'users.show', ['user' => $this->received_by]),
                'washType' => $this->ref('washType', $this->wash_type_id),
            ],
            'links' => [
                'self' => route('orders.show', ['order' => $this->id]),
            ],
        ], [
            'customer' => $this->loadedOne('customer', CustomerResource::class),
            'baskets' => $this->loadedMany('baskets', BasketResource::class),
            'items' => $this->loadedMany('items', OrderItemResource::class),
            'receivedBy' => $this->loadedOne('receivedBy', UserResource::class),
            'washType' => $this->loadedOne('washType', WashTypeResource::class),
            'soapUsage' => $this->resource->relationLoaded('usageMovements') ? $this->resource->usageMovements->map(fn ($m) => [
                'itemName' => $m->item?->name ?? '',
                'unitCode' => $m->item?->unit?->code ?? '',
                'quantity' => (float) $m->quantity,
                'requiredQuantity' => (float) ($m->required_quantity ?? $m->quantity),
                'label' => ($m->item?->name ?? '').' '.WashRules::formatAmount($m->item?->unit?->code ?? '', (float) ($m->required_quantity ?? $m->quantity)),
            ])->values() : new MissingValue,
            'payments' => $this->loadedMany('payments', PaymentResource::class),
            'statusHistory' => $this->loadedMany('statusHistory', StatusHistoryResource::class),
            'basketHistory' => $this->loadedMany('basketAssignments', BasketAssignmentResource::class),
            'shop' => $this->wantsShop($request) ? new ShopSettingsResource(self::shop($request)) : new MissingValue,
        ]);
    }

    /** The shop block goes with full order details (the order summary prints it). */
    private function wantsShop(Request $request): bool
    {
        return $this->resource->relationLoaded('statusHistory') || in_array('shop', explode(',', (string) $request->query('include')), true);
    }

    /** Read once per request, however many orders the response holds. */
    private static function shop(Request $request): ShopSetting
    {
        if (! $request->attributes->has('shop_settings')) {
            $request->attributes->set('shop_settings', ShopSetting::current());
        }

        return $request->attributes->get('shop_settings');
    }
}
