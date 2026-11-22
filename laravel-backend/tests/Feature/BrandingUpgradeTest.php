<?php

use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\ShopSetting;
use App\Support\Branding;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The live site runs 5551f58, before wash types and branding. This builds that schema (the four new
 * migrations undone) with real rows, runs only the new migrations, and checks the site looks and
 * counts exactly as before: the branding defaults are today's LaundryFlow look and nothing in
 * orders, payments, totals or the shop profile changed.
 *
 * Migrations change the schema (DDL commits in MySQL), so the test leaves its own transaction and
 * rebuilds a clean database at the end.
 */
it('upgrades the live version (5551f58) with wash types and branding without changing what the shop sees', function () {
    DB::rollBack();

    try {
        Artisan::call('migrate:fresh', ['--seed' => true, '--seeder' => ReferenceDataSeeder::class, '--force' => true]);
        OrderStatus::flushCache();
        $orderId = $this->createOrder([['serviceId' => 1, 'weightKg' => 6.5], ['serviceId' => 4, 'quantity' => 6]], ['amountCents' => 20000, 'paymentMethod' => 'gcash', 'referenceNumber' => '5012345678901']);
        $before = $this->asStaff()->getJson("/api/v1/orders/{$orderId}")->json('data.attributes');
        $shopBefore = DB::table('shop_settings')->first(['name', 'address', 'contact_number', 'opening_hours', 'receipt_footer', 'claim_policy_days']);
        $methodsBefore = DB::table('payment_methods')->pluck('label', 'code')->all();
        $baskets = DB::table('baskets')->pluck('basket_number')->all();

        // The live schema: the three wash type migrations and the branding one undone.
        Artisan::call('migrate:rollback', ['--step' => 4, '--force' => true]);
        expect(Schema::hasColumn('shop_settings', 'system_name'))->toBeFalse();
        expect(Schema::hasColumn('payment_methods', 'is_active'))->toBeFalse();
        expect(Schema::hasTable('wash_types'))->toBeFalse();

        // The update: only migrate --force.
        Artisan::call('migrate', ['--force' => true]);
        Branding::flush();

        $settings = ShopSetting::current();
        expect($settings->system_name)->toBe('LaundryFlow')->and($settings->short_name)->toBe('LaundryFlow')
            ->and($settings->primary_color)->toBe('#0e7490')->and($settings->accent_color)->toBe('#3dd6e8')->and($settings->sidebar_color)->toBe('#0b2e3f')
            ->and($settings->logo_path)->toBeNull()->and($settings->icons)->toBeNull()->and($settings->status_labels)->toBeNull()
            ->and($settings->basket_prefix)->toBe('BSK')->and($settings->basket_label_footer)->toBe('Staff scan only')
            ->and($settings->pay_at_pickup_enabled)->toBeTrue()->and($settings->show_powered_by)->toBeFalse();
        $public = $this->asGuest()->getJson('/api/v1/branding')->assertOk()->json('data.attributes');
        expect($public['statusLabels'])->toBe(Branding::DEFAULT_STATUS_LABELS);
        expect(collect($public['paymentMethods'])->pluck('isActive')->unique()->all())->toBe([true]);
        // The manifest is today's: the same name, colors and icon files.
        $this->get('/manifest.webmanifest')->assertOk()->assertJsonPath('name', 'LaundryFlow')->assertJsonPath('theme_color', '#0b2e3f')->assertJsonPath('icons.1.src', '/pwa-512x512.png');

        // Orders, payments, totals and the shop profile are exactly as before.
        $after = $this->asStaff()->getJson("/api/v1/orders/{$orderId}")->assertOk();
        foreach (['totalCents', 'paidCents', 'balanceCents', 'paymentStatus', 'status', 'statusLabel'] as $key) {
            expect($after->json("data.attributes.{$key}"))->toBe($before[$key]);
        }
        expect(DB::table('shop_settings')->first(['name', 'address', 'contact_number', 'opening_hours', 'receipt_footer', 'claim_policy_days']))->toEqual($shopBefore);
        expect(DB::table('payment_methods')->pluck('label', 'code')->only(array_keys($methodsBefore))->all())->toBe($methodsBefore);
        expect(DB::table('baskets')->pluck('basket_number')->all())->toBe($baskets);
        expect(Order::query()->count())->toBe(1);

        // Running the migrations again changes nothing.
        Artisan::call('migrate', ['--force' => true]);
        expect(ShopSetting::current()->system_name)->toBe('LaundryFlow');
    } finally {
        Artisan::call('migrate:fresh', ['--force' => true]);
    }
});
