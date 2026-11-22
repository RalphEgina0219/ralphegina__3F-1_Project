<?php

namespace App\Actions\V1;

use App\Models\PaymentMethod;
use App\Models\ShopSetting;
use App\Models\User;
use App\Models\WashTypeSupply;
use App\Support\Audit;
use App\Support\Branding;
use App\Support\ImageTools;
use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Branding writes, each in one transaction with its audit entry: the text and colour settings, the
 * logo, dark logo and app icon uploads (re-encoded, hashed names, old files deleted, PWA icons
 * generated), the setup checklist, and "reset to the LaundryFlow defaults".
 */
final class SaveBranding
{
    /** Request attribute => column. */
    private const FIELDS = [
        'systemName' => 'system_name', 'shortName' => 'short_name', 'tagline' => 'tagline',
        'primaryColor' => 'primary_color', 'accentColor' => 'accent_color', 'sidebarColor' => 'sidebar_color',
        'contactEmail' => 'contact_email', 'showContactEmail' => 'show_contact_email',
        'loginMessage' => 'login_message', 'portalMessage' => 'portal_message', 'reportFooter' => 'report_footer',
        'basketPrefix' => 'basket_prefix', 'basketLabelFooter' => 'basket_label_footer',
        'basketLabelShowShopName' => 'basket_label_show_shop_name', 'payAtPickupEnabled' => 'pay_at_pickup_enabled',
        'showPoweredBy' => 'show_powered_by',
    ];

    private const NAMES = [
        'system_name' => 'system name', 'short_name' => 'short name', 'tagline' => 'tagline',
        'primary_color' => 'primary color', 'accent_color' => 'accent color', 'sidebar_color' => 'sidebar color',
        'contact_email' => 'contact email', 'show_contact_email' => 'show contact email', 'login_message' => 'login message',
        'portal_message' => 'portal message', 'report_footer' => 'report footer', 'basket_prefix' => 'basket prefix',
        'basket_label_footer' => 'basket label footer', 'basket_label_show_shop_name' => 'shop name on basket labels',
        'pay_at_pickup_enabled' => 'Pay at pickup', 'show_powered_by' => 'powered-by line', 'status_labels' => 'status labels',
    ];

    /** The defaults "Reset" returns to: today's LaundryFlow look. */
    public const DEFAULTS = [
        'system_name' => 'LaundryFlow', 'short_name' => 'LaundryFlow', 'tagline' => null,
        'logo_path' => null, 'logo_dark_path' => null, 'icon_path' => null, 'icons' => null,
        'primary_color' => '#0e7490', 'accent_color' => '#3dd6e8', 'sidebar_color' => '#0b2e3f',
        'contact_email' => null, 'show_contact_email' => false, 'login_message' => null, 'portal_message' => null,
        'report_footer' => null, 'status_labels' => null, 'basket_prefix' => 'BSK', 'basket_label_footer' => 'Staff scan only',
        'basket_label_show_shop_name' => true, 'pay_at_pickup_enabled' => true, 'show_powered_by' => false,
    ];

    /**
     * @param  array<string, mixed>  $attributes  the validated request attributes (camelCase)
     */
    public function update(array $attributes, User $user): ShopSetting
    {
        return DB::transaction(function () use ($attributes, $user) {
            $settings = ShopSetting::query()->lockForUpdate()->findOrFail(1);
            $before = $settings->only([...array_values(self::FIELDS), 'status_labels']);
            $colorBefore = $settings->primary_color;

            $changes = [];
            foreach (self::FIELDS as $attribute => $column) {
                if (array_key_exists($attribute, $attributes)) {
                    $value = $attributes[$attribute];
                    $changes[$column] = is_string($value) ? (trim($value) === '' && ! in_array($column, ['system_name', 'short_name', 'basket_prefix'], true) ? null : trim($value)) : $value;
                }
            }
            if (isset($changes['primary_color'])) {
                $changes['primary_color'] = strtolower($changes['primary_color']);
            }
            foreach (['accent_color', 'sidebar_color'] as $column) {
                if (isset($changes[$column])) {
                    $changes[$column] = strtolower($changes[$column]);
                }
            }
            if (isset($changes['basket_prefix'])) {
                $changes['basket_prefix'] = strtoupper($changes['basket_prefix']);
            }
            if (array_key_exists('statusLabels', $attributes)) {
                $labels = array_map('trim', array_intersect_key((array) $attributes['statusLabels'], Branding::DEFAULT_STATUS_LABELS));
                $changes['status_labels'] = $labels === Branding::DEFAULT_STATUS_LABELS ? null : $labels;
            }
            $settings->update($changes);

            if (array_key_exists('paymentMethods', $attributes)) {
                foreach ((array) $attributes['paymentMethods'] as $row) {
                    PaymentMethod::query()->where('code', $row['code'])->update([
                        'is_active' => (bool) ($row['isActive'] ?? true),
                        'display_label' => ($label = trim((string) ($row['label'] ?? ''))) === '' ? null : $label,
                    ]);
                }
            }

            if ($settings->primary_color !== $colorBefore) {
                $this->regenerateIcons($settings);
            }

            $changed = array_keys(array_filter($changes, fn ($v, $k) => $before[$k] !== $v, ARRAY_FILTER_USE_BOTH));
            if (array_key_exists('paymentMethods', $attributes)) {
                $changed[] = 'payment methods';
            }
            if ($changed !== []) {
                $names = array_map(fn ($c) => self::NAMES[$c] ?? $c, $changed);
                Audit::record($user->id, 'branding.updated', 'shop_settings', 1, [
                    'summary' => 'updated branding: '.implode(', ', $names).' ('.self::describe($before, $changes).')',
                ] + array_intersect_key($changes, array_flip($changed)), array_intersect_key($before, array_flip($changed)));
            }
            Branding::flush();

            return $settings->refresh();
        });
    }

    /** "primary color #0e7490 → #7c3aed". */
    private static function describe(array $before, array $changes): string
    {
        $parts = [];
        foreach ($changes as $column => $value) {
            if ($before[$column] === $value || is_array($value) || is_array($before[$column] ?? null) || ! is_scalar($value ?? '')) {
                continue;
            }
            $parts[] = (self::NAMES[$column] ?? $column).' '.var_export($before[$column] ?? null, true).' → '.var_export($value, true);
        }

        return implode('; ', $parts) ?: 'labels or options';
    }

    /** Replaces the logo, the dark logo or the app icon; `kind` is logo, logo-dark or icon. */
    public function upload(string $kind, UploadedFile $file, User $user): ShopSetting
    {
        $square = $kind === 'icon';
        $read = ImageTools::read($file, $square ? ImageTools::MIN_ICON : ImageTools::MIN_SHORT_SIDE, $square);
        if ($read['error'] !== null) {
            throw ValidationException::withMessages(['file' => $read['error']]);
        }
        /** @var GdImage $image */
        $image = ImageTools::limit($read['image'], ImageTools::MAX_LOGO_SIDE);
        $column = ['logo' => 'logo_path', 'logo-dark' => 'logo_dark_path', 'icon' => 'icon_path'][$kind];

        return DB::transaction(function () use ($kind, $column, $image, $user) {
            $settings = ShopSetting::query()->lockForUpdate()->findOrFail(1);
            $old = $settings->{$column};
            $new = ImageTools::store($image, $kind === 'icon' ? 'icon-source' : str_replace('-', '', $kind));
            $settings->update([$column => $new]);
            // File names are content hashes: the same picture again is the same file, so keep it.
            if ($old !== $new) {
                ImageTools::delete($old);
            }
            if ($kind !== 'logo-dark') {
                $this->regenerateIcons($settings);
            }
            Audit::record($user->id, 'branding.updated', 'shop_settings', 1, ['summary' => "uploaded a new {$kind}"], ['summary' => $old ? "replaced the {$kind}" : "no {$kind} before"]);
            Branding::flush();

            return $settings->refresh();
        });
    }

    public function remove(string $kind, User $user): ShopSetting
    {
        $column = ['logo' => 'logo_path', 'logo-dark' => 'logo_dark_path', 'icon' => 'icon_path'][$kind];

        return DB::transaction(function () use ($kind, $column, $user) {
            $settings = ShopSetting::query()->lockForUpdate()->findOrFail(1);
            ImageTools::delete($settings->{$column});
            $settings->update([$column => null]);
            if ($kind !== 'logo-dark') {
                $this->regenerateIcons($settings);
            }
            Audit::record($user->id, 'branding.updated', 'shop_settings', 1, ['summary' => "removed the {$kind}"]);
            Branding::flush();

            return $settings->refresh();
        });
    }

    /** Back to the LaundryFlow defaults: values, files, status labels and payment method switches. */
    public function reset(User $user): ShopSetting
    {
        return DB::transaction(function () use ($user) {
            $settings = ShopSetting::query()->lockForUpdate()->findOrFail(1);
            foreach ([$settings->logo_path, $settings->logo_dark_path, $settings->icon_path, ...array_values((array) $settings->icons)] as $path) {
                ImageTools::delete($path);
            }
            $settings->update(self::DEFAULTS);
            PaymentMethod::query()->update(['is_active' => true, 'display_label' => null]);
            Audit::record($user->id, 'branding.reset', 'shop_settings', 1, ['summary' => 'reset the branding to the LaundryFlow defaults']);
            Branding::flush();

            return $settings->refresh();
        });
    }

    public function checklist(string $key, bool $done, User $user): ShopSetting
    {
        return DB::transaction(function () use ($key, $done) {
            $settings = ShopSetting::query()->lockForUpdate()->findOrFail(1);
            $list = (array) $settings->setup_checklist;
            $list[$key] = $done;
            $settings->update(['setup_checklist' => $list]);

            return $settings->refresh();
        });
    }

    /** Rebuilds the PWA icons from the app icon (or, without one, the logo) on the primary colour. */
    private function regenerateIcons(ShopSetting $settings): void
    {
        $oldPaths = array_values((array) $settings->icons);
        $source = $settings->icon_path ?: $settings->logo_path;
        $image = $source && Storage::disk(ImageTools::DISK)->exists($source) ? @imagecreatefromstring(Storage::disk(ImageTools::DISK)->get($source)) : false;
        if (! $image instanceof GdImage) {
            $settings->update(['icons' => null]);
            $this->deleteExcept($oldPaths, []);

            return;
        }
        imagealphablending($image, false);
        imagesavealpha($image, true);
        $icons = ImageTools::icons($image, $settings->primary_color);
        $settings->update(['icons' => $icons]);
        $this->deleteExcept($oldPaths, array_values($icons));
    }

    /**
     * Deletes old files that the new set no longer uses (a file name is a content hash, so an
     * unchanged icon keeps its name and must stay).
     *
     * @param  list<string>  $old
     * @param  list<string>  $keep
     */
    private function deleteExcept(array $old, array $keep): void
    {
        foreach (array_diff($old, $keep) as $path) {
            ImageTools::delete($path);
        }
    }

    /**
     * The first-login checklist: what is done by itself, and what the owner ticks.
     *
     * @return list<array{key: string, label: string, done: bool, auto: bool, link: string}>
     */
    public static function checklistFor(ShopSetting $settings): array
    {
        $ticked = (array) $settings->setup_checklist;
        $branded = $settings->logo_path !== null || $settings->icon_path !== null || $settings->system_name !== 'LaundryFlow'
            || $settings->primary_color !== self::DEFAULTS['primary_color'];
        $contactSet = trim((string) $settings->contact_number) !== '' && ! str_starts_with((string) $settings->contact_number, '[');

        return [
            ['key' => 'branding', 'label' => 'Upload your logo and choose your colors', 'done' => $branded || ! empty($ticked['branding']), 'auto' => true, 'link' => '/settings/branding'],
            ['key' => 'shop', 'label' => 'Fill in the shop details', 'done' => $contactSet || ! empty($ticked['shop']), 'auto' => true, 'link' => '/settings/shop'],
            ['key' => 'rates', 'label' => 'Set your service rates', 'done' => ! empty($ticked['rates']), 'auto' => false, 'link' => '/settings/pricing'],
            ['key' => 'soaps', 'label' => 'Assign soaps to wash types', 'done' => WashTypeSupply::query()->exists() || ! empty($ticked['soaps']), 'auto' => true, 'link' => '/settings/pricing'],
            ['key' => 'staff', 'label' => 'Add your staff', 'done' => ! empty($ticked['staff']), 'auto' => false, 'link' => '/settings/users'],
            ['key' => 'labels', 'label' => 'Print the basket labels', 'done' => ! empty($ticked['labels']), 'auto' => false, 'link' => '/settings/baskets'],
        ];
    }
}
