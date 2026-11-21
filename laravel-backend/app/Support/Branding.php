<?php

namespace App\Support;

use App\Models\PaymentMethod;
use App\Models\ShopSetting;

/**
 * The shop's branding: what the public branding endpoint, the manifest and every label read.
 * The defaults are exactly today's LaundryFlow look. Colour math (WCAG contrast) is ported from
 * react-frontend/src/lib/color.ts and tested with the same cases (shared/color-cases.json).
 */
final class Branding
{
    public const STATUS_CODES = ['received', 'washing', 'drying', 'folding', 'ready_for_pickup', 'released'];

    public const DEFAULT_STATUS_LABELS = [
        'received' => 'Received',
        'washing' => 'Washing',
        'drying' => 'Drying',
        'folding' => 'Folding',
        'ready_for_pickup' => 'Ready for Pickup',
        'released' => 'Completed',
    ];

    /** The text colours on a brand colour: white, or the app's ink. */
    public const LIGHT_TEXT = '#ffffff';

    public const DARK_TEXT = '#10242e';

    /** @var array<string, mixed>|null */
    private static ?array $cache = null;

    public static function flush(): void
    {
        self::$cache = null;
    }

    public static function settings(): ShopSetting
    {
        return ShopSetting::current();
    }

    /** The label shown for a status code. */
    public static function statusLabel(string $code): string
    {
        self::$cache['labels'] ??= self::labelsOf(self::settings());

        return self::$cache['labels'][$code] ?? (self::DEFAULT_STATUS_LABELS[$code] ?? $code);
    }

    /** @return array<string, string> */
    public static function labelsOf(ShopSetting $settings): array
    {
        $saved = is_array($settings->status_labels) ? $settings->status_labels : [];

        return array_merge(self::DEFAULT_STATUS_LABELS, array_intersect_key(array_filter($saved, 'is_string'), self::DEFAULT_STATUS_LABELS));
    }

    /** "/storage/branding/logo-1a2b3c4d.png": served by Laravel, so it needs no symlink. */
    public static function url(?string $path): ?string
    {
        return $path ? '/storage/'.ltrim($path, '/') : null;
    }

    /**
     * Everything the screens need before sign-in. Nothing private: the contact email only when the
     * owner chose to show it.
     *
     * @return array<string, mixed>
     */
    public static function publicPayload(?ShopSetting $settings = null): array
    {
        $settings ??= self::settings();
        $icons = is_array($settings->icons) ? $settings->icons : [];
        $payload = [
            'systemName' => $settings->system_name,
            'shortName' => $settings->short_name,
            'tagline' => $settings->tagline,
            'logoUrl' => self::url($settings->logo_path),
            'logoDarkUrl' => self::url($settings->logo_dark_path),
            'iconUrls' => $icons === [] ? null : array_map(fn ($path) => self::url($path), $icons),
            'primaryColor' => $settings->primary_color,
            'accentColor' => $settings->accent_color,
            'sidebarColor' => $settings->sidebar_color,
            'buttonTextColor' => self::buttonText($settings->primary_color),
            'statusLabels' => self::labelsOf($settings),
            'basketPrefix' => $settings->basket_prefix,
            'basketLabelFooter' => $settings->basket_label_footer,
            'basketLabelShowShopName' => (bool) $settings->basket_label_show_shop_name,
            'payAtPickupEnabled' => (bool) $settings->pay_at_pickup_enabled,
            'paymentMethods' => PaymentMethod::query()->orderBy('id')->get()->map(fn (PaymentMethod $m) => [
                'code' => $m->code,
                'label' => $m->display_label ?: $m->label,
                'isActive' => (bool) $m->is_active,
            ])->all(),
            'loginMessage' => $settings->login_message,
            'portalMessage' => $settings->portal_message,
            'reportFooter' => $settings->report_footer,
            'showPoweredBy' => (bool) $settings->show_powered_by,
            'shop' => [
                'name' => $settings->name,
                'address' => $settings->address,
                'contactNumber' => $settings->contact_number,
                'openingHours' => $settings->opening_hours,
                'contactEmail' => $settings->show_contact_email ? $settings->contact_email : null,
            ],
        ];
        $payload['version'] = substr(sha1(json_encode($payload)), 0, 12);

        return $payload;
    }

    // Colour math --------------------------------------------------------------------------------

    public static function isHex(mixed $value): bool
    {
        return is_string($value) && preg_match('/^#[0-9a-fA-F]{6}$/', $value) === 1;
    }

    /** @return array{0: float, 1: float, 2: float} sRGB channels in 0..1 */
    private static function rgb(string $hex): array
    {
        return [hexdec(substr($hex, 1, 2)) / 255, hexdec(substr($hex, 3, 2)) / 255, hexdec(substr($hex, 5, 2)) / 255];
    }

    /** WCAG relative luminance. */
    public static function luminance(string $hex): float
    {
        [$r, $g, $b] = array_map(fn ($c) => $c <= 0.03928 ? $c / 12.92 : (($c + 0.055) / 1.055) ** 2.4, self::rgb($hex));

        return 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;
    }

    /** WCAG contrast ratio, 1 to 21. */
    public static function contrast(string $a, string $b): float
    {
        $la = self::luminance($a);
        $lb = self::luminance($b);

        return (max($la, $lb) + 0.05) / (min($la, $lb) + 0.05);
    }

    /** White or the app's dark ink, whichever reads better on this colour. */
    public static function buttonText(string $hex): string
    {
        return self::contrast($hex, self::LIGHT_TEXT) >= self::contrast($hex, self::DARK_TEXT) ? self::LIGHT_TEXT : self::DARK_TEXT;
    }

    /** Whether text on this colour reaches 4.5:1 (the better of white and ink). */
    public static function textReadableOn(string $hex): bool
    {
        return self::contrast($hex, self::buttonText($hex)) >= 4.5;
    }
}
