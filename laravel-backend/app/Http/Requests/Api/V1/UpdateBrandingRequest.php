<?php

namespace App\Http\Requests\Api\V1;

use App\Models\PaymentMethod;
use App\Models\ShopSetting;
use App\Support\Branding;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

/**
 * PUT /settings/branding: the fields sent are changed. Colours are #RRGGBB hex; a brand colour must
 * leave button text readable (4.5:1); status labels are non-empty, unique and at most 24
 * characters; at least one way to pay stays on.
 */
class UpdateBrandingRequest extends BaseApiRequest
{
    protected function attributeMap(): array
    {
        return [];
    }

    /**
     * The status codes are snake_case (ready_for_pickup) but a camelCasing client sends
     * readyForPickup: take either, and keep the codes as the one source of truth.
     */
    protected function prepareForValidation(): void
    {
        $labels = $this->input('data.attributes.statusLabels');
        if (! is_array($labels)) {
            return;
        }
        $fixed = [];
        foreach ($labels as $key => $label) {
            $fixed[is_string($key) ? Str::snake($key) : $key] = $label;
        }
        $data = $this->input('data');
        $data['attributes']['statusLabels'] = $fixed;
        $this->merge(['data' => $data]);
    }

    public function rules(): array
    {
        $hex = ['sometimes', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'];

        return [
            'data' => 'required|array',
            'data.attributes' => 'required|array',
            'data.attributes.systemName' => ['sometimes', 'string', 'min:1', 'max:60'],
            'data.attributes.shortName' => ['sometimes', 'string', 'min:1', 'max:12'],
            'data.attributes.tagline' => ['sometimes', 'nullable', 'string', 'max:120'],
            'data.attributes.primaryColor' => $hex,
            'data.attributes.accentColor' => $hex,
            'data.attributes.sidebarColor' => $hex,
            'data.attributes.contactEmail' => ['sometimes', 'nullable', 'email', 'max:255'],
            'data.attributes.showContactEmail' => ['sometimes', 'boolean'],
            'data.attributes.loginMessage' => ['sometimes', 'nullable', 'string', 'max:300'],
            'data.attributes.portalMessage' => ['sometimes', 'nullable', 'string', 'max:300'],
            'data.attributes.reportFooter' => ['sometimes', 'nullable', 'string', 'max:300'],
            'data.attributes.statusLabels' => ['sometimes', 'array'],
            'data.attributes.basketPrefix' => ['sometimes', 'string', 'regex:/^[A-Za-z]{2,8}$/'],
            'data.attributes.basketLabelFooter' => ['sometimes', 'nullable', 'string', 'max:80'],
            'data.attributes.basketLabelShowShopName' => ['sometimes', 'boolean'],
            'data.attributes.payAtPickupEnabled' => ['sometimes', 'boolean'],
            'data.attributes.showPoweredBy' => ['sometimes', 'boolean'],
            'data.attributes.paymentMethods' => ['sometimes', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'data.attributes.primaryColor.regex' => 'Use a color like #0e7490.',
            'data.attributes.accentColor.regex' => 'Use a color like #3dd6e8.',
            'data.attributes.sidebarColor.regex' => 'Use a color like #0b2e3f.',
            'data.attributes.shortName.max' => 'The short name is at most 12 characters.',
            'data.attributes.basketPrefix.regex' => 'Use 2 to 8 letters, like BSK.',
            'data.attributes.contactEmail.email' => 'Enter a valid email address.',
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            $a = (array) $this->input('data.attributes');

            foreach (['primaryColor' => 'primary', 'sidebarColor' => 'sidebar'] as $key => $name) {
                if (isset($a[$key]) && ! Branding::textReadableOn($a[$key])) {
                    $validator->errors()->add("data.attributes.{$key}", "Text on the {$name} color would be hard to read. Choose a darker or lighter color.");
                }
            }

            if (isset($a['statusLabels'])) {
                $labels = $a['statusLabels'];
                $seen = [];
                foreach (Branding::STATUS_CODES as $code) {
                    $label = is_string($labels[$code] ?? null) ? trim($labels[$code]) : '';
                    $key = "data.attributes.statusLabels.{$code}";
                    if ($label === '') {
                        $validator->errors()->add($key, 'Enter a label.');
                    } elseif (mb_strlen($label) > 24) {
                        $validator->errors()->add($key, 'Use at most 24 characters.');
                    } elseif (isset($seen[mb_strtolower($label)])) {
                        $validator->errors()->add($key, 'Each status needs its own label.');
                    }
                    $seen[mb_strtolower($label)] = true;
                }
            }

            if (isset($a['paymentMethods']) || isset($a['payAtPickupEnabled'])) {
                $codes = PaymentMethod::query()->pluck('is_active', 'code')->all();
                foreach ((array) ($a['paymentMethods'] ?? []) as $index => $row) {
                    if (! is_array($row) || ! array_key_exists($row['code'] ?? '', $codes)) {
                        $validator->errors()->add("data.attributes.paymentMethods.{$index}.code", 'Unknown payment method.');

                        continue;
                    }
                    $codes[$row['code']] = (bool) ($row['isActive'] ?? true);
                    if (isset($row['label']) && mb_strlen((string) $row['label']) > 50) {
                        $validator->errors()->add("data.attributes.paymentMethods.{$index}.label", 'Use at most 50 characters.');
                    }
                }
                $pickup = $a['payAtPickupEnabled'] ?? ShopSetting::current()->pay_at_pickup_enabled;
                if (! in_array(true, array_map('boolval', $codes), true) && ! $pickup) {
                    $validator->errors()->add('data.attributes.paymentMethods', 'At least one way to pay must stay on.');
                }
            }
        }];
    }

    /** @return array<string, mixed> */
    public function brandingAttributes(): array
    {
        return (array) $this->input('data.attributes');
    }
}
