<?php

namespace App\Http\Requests\Api\V1;

/**
 * Validates POST /orders/{order}/payments. The amount, method and reference rules depend on the
 * balance, so they are checked by the Payments action with the order row locked.
 * { "data": { "attributes": { "amountCents": 20000, "paymentMethod": "gcash", "referenceNumber": "5012…" } } }
 */
class StorePaymentRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return [
            'data.attributes.amountCents' => 'amount_cents',
            'data.attributes.paymentMethod' => 'payment_method',
            'data.attributes.referenceNumber' => 'reference_number',
        ];
    }

    public function rules(): array
    {
        return [
            'data' => 'required|array',
            'data.attributes' => 'required|array',
        ];
    }

    /** @return array<string, mixed> */
    public function payment(): array
    {
        return (array) $this->input('data.attributes', []);
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.amountCents' => ['description' => 'Centavos, at most the balance.', 'example' => 20000],
            'data.attributes.paymentMethod' => ['description' => 'cash or gcash.', 'example' => 'gcash'],
            'data.attributes.referenceNumber' => ['description' => 'Required for GCash.', 'example' => '5012345678901'],
        ];
    }
}
