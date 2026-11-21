<?php

namespace App\Http\Resources\V1;

use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\ShopSetting;
use App\Support\StatusRules;
use Illuminate\Http\Request;

/**
 * An order as its customer sees it. Built field by field, so nothing internal reaches a customer:
 * no staff names, no notes, no voided payments, no basket tokens, and the order number as its id.
 *
 * @mixin Order
 */
class PortalOrderResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        $detail = $this->relationLoaded('statusHistory');

        return $this->withIncludes([
            'type' => 'portalOrder',
            'id' => $this->order_number,
            'attributes' => [
                'orderNumber' => $this->order_number,
                'receivedAt' => $this->iso($this->received_at),
                'promisedAt' => $this->iso($this->promised_at),
                'releasedAt' => $this->iso($this->released_at),
                'status' => $this->statusCode(),
                'statusLabel' => $this->statusLabel(),
                'totalCents' => $this->totalCents(),
                'paidCents' => $this->paidCents(),
                'balanceCents' => $this->balanceCents(),
                'paymentStatus' => $this->paymentStatus(),
                // The wash type and what it costs, as frozen on the order. Never soap quantities.
                'washTypeName' => $this->relationLoaded('washType') ? $this->washType?->name : null,
                'washSurchargePerKgCents' => (int) $this->wash_surcharge_per_kg_cents,
                'washSurchargeCents' => $this->washSurchargeCents(),
                'perKgWeightKg' => $this->perKgTenths() / 10,
                $this->mergeWhen($detail, fn () => [
                    'customer' => [
                        'fullName' => $this->customer->full_name,
                        'contactNumber' => $this->customer->contact_number,
                    ],
                    'timeline' => $this->timeline(),
                ]),
            ],
            'links' => [
                'self' => route('customer.orders.show', ['orderNumber' => $this->order_number]),
            ],
        ], [
            'baskets' => $this->whenLoaded('baskets', fn () => $this->baskets->map(fn ($basket) => [
                'type' => 'basket',
                'id' => $basket->id,
                'attributes' => ['basketNumber' => $basket->basket_number],
            ])->values()),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'type' => 'orderItem',
                'id' => $item->id,
                'attributes' => [
                    'weightKg' => $item->weight_kg === null ? null : (float) $item->weight_kg,
                    'quantity' => $item->quantity === null ? null : (int) $item->quantity,
                    'unitPriceCents' => (int) $item->unit_price_cents,
                    'subtotalCents' => (int) $item->subtotal_cents,
                    'serviceName' => $item->service?->name ?? 'Service',
                    'pricingType' => $item->service?->pricing_type ?? 'flat',
                ],
                'relationships' => ['service' => ['data' => ['type' => 'service', 'id' => $item->service_id]]],
            ])->values()),
            // What the customer actually paid: voided payments and staff names are left out.
            'payments' => $this->when($detail && $this->relationLoaded('payments'), fn () => $this->payments
                ->whereNull('voided_at')
                ->sortBy(fn ($p) => [$p->paid_at, $p->id])
                ->map(fn ($payment) => [
                    'type' => 'payment',
                    'id' => $payment->id,
                    'attributes' => [
                        'paidAt' => $this->iso($payment->paid_at),
                        'methodLabel' => $payment->method?->shownLabel() ?? '',
                        'amountCents' => (int) $payment->amount_cents,
                        'referenceNumber' => $payment->reference_number,
                        'receiptNumber' => $payment->receipt_number,
                    ],
                ])->values()),
            'shop' => $this->when($detail, fn () => new ShopSettingsResource(ShopSetting::current())),
        ]);
    }

    /**
     * The six stages with when the order last entered each. After an admin moved an order back,
     * the later stages show as not reached yet.
     *
     * @return list<array{status: string, label: string, at: ?string}>
     */
    private function timeline(): array
    {
        $current = StatusRules::index($this->statusCode());
        $reached = [];
        foreach ($this->statusHistory as $row) {
            $code = OrderStatus::codeFor($row->to_status_id);
            $at = $this->iso($row->changed_at);
            if ($code !== null && ($reached[$code] ?? '') < $at) {
                $reached[$code] = $at;
            }
        }

        $steps = [];
        foreach (StatusRules::ORDER as $index => $status) {
            $steps[] = [
                'status' => $status,
                'label' => StatusRules::label($status),
                'at' => $index > $current ? null : ($reached[$status] ?? null),
            ];
        }

        return $steps;
    }
}
