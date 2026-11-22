<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** The shop profile and its branding: a single row with id 1. */
#[Fillable([
    'id', 'name', 'address', 'contact_number', 'opening_hours', 'receipt_footer', 'claim_policy_days', 'block_orders_on_low_soap',
    'system_name', 'short_name', 'tagline', 'logo_path', 'logo_dark_path', 'icon_path', 'icons',
    'primary_color', 'accent_color', 'sidebar_color', 'contact_email', 'show_contact_email',
    'login_message', 'portal_message', 'report_footer', 'status_labels', 'basket_prefix',
    'basket_label_footer', 'basket_label_show_shop_name', 'pay_at_pickup_enabled', 'show_powered_by', 'setup_checklist',
])]
class ShopSetting extends Model
{
    public $incrementing = false;

    protected function casts(): array
    {
        return [
            'claim_policy_days' => 'integer',
            'block_orders_on_low_soap' => 'boolean',
            'icons' => 'array',
            'status_labels' => 'array',
            'setup_checklist' => 'array',
            'show_contact_email' => 'boolean',
            'basket_label_show_shop_name' => 'boolean',
            'pay_at_pickup_enabled' => 'boolean',
            'show_powered_by' => 'boolean',
        ];
    }

    public static function current(): self
    {
        return static::query()->findOrFail(1);
    }
}
