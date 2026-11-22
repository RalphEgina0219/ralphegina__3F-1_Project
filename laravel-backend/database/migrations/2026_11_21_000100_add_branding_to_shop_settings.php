<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * White-label branding: the name, logo, colors, messages, status labels, basket label options and
 * payment method switches live in the shop's own settings, so a shop makes the system its own
 * without editing code.
 *
 * Additive and safe on a live database: every new column has a default or is nullable, and the
 * defaults are exactly today's LaundryFlow look, so the site is unchanged after migrating.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shop_settings', function (Blueprint $table) {
            $table->string('system_name', 60)->default('LaundryFlow');
            $table->string('short_name', 12)->default('LaundryFlow');
            $table->string('tagline', 120)->nullable();
            $table->string('logo_path')->nullable();
            $table->string('logo_dark_path')->nullable();
            $table->string('icon_path')->nullable();
            // The generated PWA icons: {"192": "branding/…png", "512": …, "maskable": …, "apple": …, "favicon32": …, "favicon16": …}
            $table->json('icons')->nullable();
            // Today's palette: flow, aqua and ink.
            $table->char('primary_color', 7)->default('#0e7490');
            $table->char('accent_color', 7)->default('#3dd6e8');
            $table->char('sidebar_color', 7)->default('#0b2e3f');
            $table->string('contact_email')->nullable();
            $table->boolean('show_contact_email')->default(false);
            $table->string('login_message', 300)->nullable();
            $table->string('portal_message', 300)->nullable();
            $table->string('report_footer', 300)->nullable();
            // {"received": "Received", …}: display labels only, the codes never change. Null = the defaults.
            $table->json('status_labels')->nullable();
            $table->string('basket_prefix', 8)->default('BSK');
            $table->string('basket_label_footer', 80)->default('Staff scan only');
            $table->boolean('basket_label_show_shop_name')->default(true);
            $table->boolean('pay_at_pickup_enabled')->default(true);
            $table->boolean('show_powered_by')->default(false);
            // Setup checklist items the owner ticked by hand: {"rates": true, …}.
            $table->json('setup_checklist')->nullable();
        });

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->boolean('is_active')->default(true);
            // An optional display name, for example "GCash (0917…)". Null = the label.
            $table->string('display_label', 50)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'display_label']);
        });

        Schema::table('shop_settings', function (Blueprint $table) {
            $table->dropColumn([
                'system_name', 'short_name', 'tagline', 'logo_path', 'logo_dark_path', 'icon_path', 'icons',
                'primary_color', 'accent_color', 'sidebar_color', 'contact_email', 'show_contact_email',
                'login_message', 'portal_message', 'report_footer', 'status_labels', 'basket_prefix',
                'basket_label_footer', 'basket_label_show_shop_name', 'pay_at_pickup_enabled', 'show_powered_by',
                'setup_checklist',
            ]);
        });
    }
};
