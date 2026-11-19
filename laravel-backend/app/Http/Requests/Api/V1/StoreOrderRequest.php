<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Basket;
use App\Models\Customer;
use App\Models\Service;
use App\Models\WashType;
use App\Support\Billing;
use App\Support\PaymentRules;
use App\Support\WashRules;
use Carbon\CarbonImmutable;
use Illuminate\Validation\Validator;

/**
 * Validates POST /orders. Every problem is reported at once, with the counter's wording:
 * the customer must have an account, each basket must exist and not be retired, each line must fit
 * its service, and an optional payment must fit the total. Whether a basket is free is decided
 * under a lock when the order is written (409 when it holds another order).
 *
 * Body:
 * { "data": { "attributes": { "items": [{ "serviceId": 1, "weightKg": 6.5 }], "promisedAt": "…",
 *   "notes": "…", "payment": { "amountCents": 20000, "paymentMethod": "cash" } },
 *   "relationships": { "customer": { "data": { "id": 1 } }, "baskets": { "data": [{ "id": 7 }] } } } }
 */
class StoreOrderRequest extends BaseApiRequest
{
    /** The priced lines, worked out while validating (service id, weight, quantity, price, subtotal). */
    private array $lines = [];

    /** The chosen wash type (the first active one when none is sent), and its surcharge at this moment. */
    private ?WashType $washType = null;

    protected function attributeMap(): array
    {
        return [
            'data.attributes.promisedAt' => 'promised_at',
            'data.attributes.notes' => 'notes',
            'data.relationships.customer.data.id' => 'customer_id',
        ];
    }

    public function rules(): array
    {
        return [
            'data' => 'required|array',
            'data.attributes' => 'required|array',
            'data.attributes.items' => 'present',
            'data.attributes.promisedAt' => 'present',
            'data.attributes.notes' => 'sometimes|nullable|string|max:2000',
            'data.attributes.payment' => 'sometimes|nullable|array',
        ];
    }

    public function messages(): array
    {
        return [
            'data.attributes.items.present' => 'Add at least one service.',
            'data.attributes.promisedAt.present' => 'Choose the estimated completion date and time.',
        ];
    }

    /** The business checks, all reported together. */
    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $errors = array_merge(
                $this->customerErrors(),
                $this->basketErrors(),
                $this->washTypeErrors(),
                $this->itemErrors(),
                $this->promiseErrors(),
                $this->paymentErrors(),
            );

            foreach ($errors as $key => $message) {
                $validator->errors()->add($key, $message);
            }
        }];
    }

    /** @return array<string, string> */
    private function customerErrors(): array
    {
        $key = 'data.relationships.customer.data.id';
        $customer = ($id = $this->relationshipId('customer')) ? Customer::query()->withExists('account')->find($id) : null;

        if (! $customer) {
            return [$key => 'Choose a customer.'];
        }

        // The account is the only place the customer sees the order, so it must exist first.
        return $customer->account_exists ? [] : [$key => 'This customer has no account yet. Create one first.'];
    }

    /** @return array<string, string> */
    private function basketErrors(): array
    {
        $key = 'data.relationships.baskets.data';
        $raw = $this->input($key);

        if (! is_array($raw) || $raw === []) {
            return [$key => 'Add at least one basket.'];
        }
        foreach ($raw as $row) {
            if (! is_array($row) || ! isset($row['id']) || filter_var($row['id'], FILTER_VALIDATE_INT) === false) {
                return [$key => 'Choose baskets from the list.'];
            }
        }

        $ids = $this->relationshipIds('baskets');
        $baskets = Basket::query()->whereIn('id', $ids)->get()->keyBy('id');
        foreach ($ids as $id) {
            $basket = $baskets->get($id);
            if (! $basket) {
                return [$key => 'One of the baskets does not exist.'];
            }
            if ($basket->status === 'retired') {
                return [$key => "{$basket->basket_number} is retired and cannot be used."];
            }
            // A basket that holds another order is a conflict of state (409), not invalid input:
            // CreateOrder checks it under the basket lock, where two counters cannot both pass.
        }

        return [];
    }

    /** @return array<string, string> */
    private function washTypeErrors(): array
    {
        $key = 'data.relationships.washType.data.id';
        $id = $this->relationshipId('washType') ?? WashType::defaultId();
        $washType = $id ? WashType::query()->find($id) : null;

        if (! $washType || ! $washType->is_active) {
            return [$key => 'Choose an active wash type.'];
        }
        $this->washType = $washType;

        return [];
    }

    /** @return array<string, string> */
    private function itemErrors(): array
    {
        $items = $this->input('data.attributes.items');
        if (! is_array($items) || $items === []) {
            return ['data.attributes.items' => 'Add at least one service.'];
        }

        $services = Service::query()->whereIn('id', array_filter(array_map(fn ($i) => is_array($i) ? ($i['serviceId'] ?? null) : null, $items), 'is_numeric'))->get()->keyBy('id');
        $errors = [];
        $flatSeen = [];
        $this->lines = [];

        foreach (array_values($items) as $index => $item) {
            $prefix = "data.attributes.items.{$index}";
            $service = is_array($item) && is_numeric($item['serviceId'] ?? null) ? $services->get((int) $item['serviceId']) : null;

            if (! $service || ! $service->is_active) {
                $errors["{$prefix}.serviceId"] = 'Choose an active service.';

                continue;
            }

            $weight = is_numeric($item['weightKg'] ?? null) ? (float) $item['weightKg'] : null;
            $quantity = is_numeric($item['quantity'] ?? null) ? $item['quantity'] + 0 : null;

            if ($service->pricing_type === 'per_kg') {
                if ($weight === null || $weight <= 0) {
                    $errors["{$prefix}.weightKg"] = 'Enter a weight above zero.';

                    continue;
                }
                if (abs(Billing::kgToTenths($weight) / 10 - $weight) > 1e-9) {
                    $errors["{$prefix}.weightKg"] = 'Weight goes in 0.1 kg steps.';

                    continue;
                }
            }

            if ($service->pricing_type === 'per_piece' && ($quantity === null || ! is_int($quantity) || $quantity < 1)) {
                $errors["{$prefix}.quantity"] = 'Enter a whole quantity of at least 1.';

                continue;
            }

            if ($service->pricing_type === 'flat') {
                if (isset($flatSeen[$service->id])) {
                    $errors["{$prefix}.serviceId"] = "{$service->name} applies once per order.";

                    continue;
                }
                $flatSeen[$service->id] = true;
            }

            $line = [
                'service_id' => $service->id,
                'weight_kg' => $service->pricing_type === 'per_kg' ? $weight : null,
                'quantity' => match ($service->pricing_type) {
                    'per_piece' => $quantity,
                    'flat' => 1,
                    default => null,
                },
                // Frozen now: a later rate change never alters this order.
                'unit_price_cents' => (int) $service->rate_cents,
            ];
            $line['subtotal_cents'] = Billing::lineSubtotalCents([
                'pricing_type' => $service->pricing_type,
                'rate_cents' => (int) $service->rate_cents,
                'minimum_qty' => $service->minimum_qty,
                'weight_kg' => $line['weight_kg'],
                'quantity' => $line['quantity'],
            ]);
            $this->lines[] = $line;
        }

        return $errors;
    }

    /** @return array<string, string> */
    private function promiseErrors(): array
    {
        $key = 'data.attributes.promisedAt';
        $value = $this->input($key);

        try {
            $promised = is_string($value) && trim($value) !== '' ? CarbonImmutable::parse($value) : null;
        } catch (\Throwable) {
            $promised = null;
        }

        if (! $promised) {
            return [$key => 'Choose the estimated completion date and time.'];
        }

        return $promised->lessThan(now()->subMinute()) ? [$key => 'Estimated completion cannot be in the past.'] : [];
    }

    /** @return array<string, string> */
    private function paymentErrors(): array
    {
        $payment = $this->input('data.attributes.payment');
        if (! is_array($payment)) {
            return [];
        }

        $total = $this->totalCents();
        $errors = [];
        foreach (PaymentRules::check($payment, $total)['errors'] as $field => $message) {
            $errors["data.attributes.payment.{$field}"] = $message;
        }

        return $errors;
    }

    /** The wash type's surcharge per kilo, frozen on the order. */
    public function washSurchargePerKgCents(): int
    {
        return (int) ($this->washType?->surcharge_per_kg_cents ?? 0);
    }

    public function washTypeId(): int
    {
        return (int) $this->washType?->id;
    }

    /** The lines plus the wash type surcharge. */
    public function totalCents(): int
    {
        $perKgTenths = WashRules::perKgTenths(array_map(fn ($line) => [
            'pricing_type' => $line['weight_kg'] === null ? 'other' : 'per_kg',
            'weight_kg' => $line['weight_kg'],
        ], $this->lines));

        return array_sum(array_column($this->lines, 'subtotal_cents')) + WashRules::surchargeCents($perKgTenths, $this->washSurchargePerKgCents());
    }

    /** Whether a payment came with the order (it needs payments.record). */
    public function hasPayment(): bool
    {
        return is_array($this->input('data.attributes.payment'));
    }

    /** @return list<array<string, mixed>> */
    public function lines(): array
    {
        return $this->lines;
    }

    /** @return array{amount_cents: int, method: string, reference_number: ?string}|null */
    public function payment(): ?array
    {
        $payment = $this->input('data.attributes.payment');

        return is_array($payment)
            ? PaymentRules::check($payment, $this->totalCents())['values']
            : null;
    }

    public function bodyParameters(): array
    {
        return [
            'data.attributes.items' => ['description' => 'The service lines: serviceId plus weightKg (per kg) or quantity (per piece).', 'example' => [['serviceId' => 1, 'weightKg' => 6.5], ['serviceId' => 4, 'quantity' => 6]]],
            'data.attributes.promisedAt' => ['description' => 'Estimated completion, ISO-8601.', 'example' => '2026-11-09T09:00:00.000Z'],
            'data.attributes.notes' => ['description' => 'Notes for the shop.', 'example' => 'Separate white uniforms.'],
            'data.attributes.payment' => ['description' => 'Optional payment at drop-off (needs payments.record).', 'example' => ['amountCents' => 20000, 'paymentMethod' => 'cash']],
            'data.relationships.customer.data.id' => ['description' => 'The customer (must have an account).', 'example' => 1],
            'data.relationships.washType.data.id' => ['description' => 'The wash type. Optional: the first active one when left out. Applies to the per-kg laundry.', 'example' => 1],
            'data.relationships.baskets.data' => ['description' => 'One or more available baskets.', 'example' => [['id' => 7]]],
        ];
    }
}
