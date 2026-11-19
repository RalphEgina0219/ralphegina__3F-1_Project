<?php

use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\WashType;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The live shop already has orders, payments and stock when this update arrives. This test builds
 * that situation (the schema as it was, with real rows), runs only the new migrations, and checks
 * that nothing the shop had changes: totals, payments, stock, and every old order is "Regular
 * washing" with no extra charge.
 *
 * Migrations change the schema (DDL commits in MySQL), so the test leaves its own transaction,
 * works on a committed database and rebuilds a clean one at the end.
 */
it('upgrades a database that already has orders, payments and stock without changing any of them', function () {
    DB::rollBack();

    try {
        Artisan::call('migrate:fresh', ['--seed' => true, '--seeder' => ReferenceDataSeeder::class, '--force' => true]);
        OrderStatus::flushCache();

        // Yesterday's shop: an order with a GCash payment, and a manual stock-out.
        $orderId = $this->createOrder([['serviceId' => 1, 'weightKg' => 6.5], ['serviceId' => 4, 'quantity' => 6]], ['amountCents' => 20000, 'paymentMethod' => 'gcash', 'referenceNumber' => '5012345678901']);
        InventoryMovement::query()->create(['item_id' => 1, 'user_id' => 1, 'type' => 'in', 'quantity' => 10, 'moved_at' => now()]);
        InventoryMovement::query()->create(['item_id' => 1, 'user_id' => 1, 'type' => 'out', 'quantity' => 2, 'remarks' => 'Used today', 'moved_at' => now()]);
        $before = $this->asStaff()->getJson("/api/v1/orders/{$orderId}")->json('data.attributes');
        $customerId = Order::query()->findOrFail($orderId)->customer_id;

        // Back to the schema the live database has (the three new migrations undone), then one more
        // order that was taken in before this update: it has no wash type column at all.
        Artisan::call('migrate:rollback', ['--step' => 3, '--force' => true]);
        expect(Schema::hasColumn('orders', 'wash_type_id'))->toBeFalse();
        expect(Schema::hasTable('wash_types'))->toBeFalse();
        expect(Schema::hasColumn('inventory_movements', 'order_id'))->toBeFalse();
        $oldId = DB::table('orders')->insertGetId([
            'order_number' => 'LF-261101-0099', 'customer_id' => $customerId, 'current_status_id' => 1, 'received_by' => 2,
            'received_at' => '2026-11-01 09:00:00', 'promised_at' => '2026-11-02 09:00:00', 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('order_items')->insert(['order_id' => $oldId, 'service_id' => 1, 'weight_kg' => 5.0, 'quantity' => null, 'unit_price_cents' => 3500, 'subtotal_cents' => 17500]);
        $paymentsBefore = DB::table('payments')->get()->map(fn ($p) => (array) $p)->all();
        $movementsBefore = DB::table('inventory_movements')->count();
        DB::table('payment_methods')->where('code', 'gcash')->update(['label' => 'GCash (edited by the owner)']);

        // The update: only migrate --force.
        Artisan::call('migrate', ['--force' => true]);

        $regular = WashType::query()->where('name', 'Regular washing')->value('id');
        expect(DB::table('orders')->pluck('wash_type_id')->unique()->all())->toBe([$regular]);
        expect(DB::table('orders')->sum('wash_surcharge_per_kg_cents'))->toEqual(0);

        // Totals, payments and stock are exactly as before.
        $after = $this->asStaff()->getJson("/api/v1/orders/{$orderId}")->assertOk();
        foreach (['totalCents', 'paidCents', 'balanceCents', 'paymentStatus'] as $key) {
            expect($after->json("data.attributes.{$key}"))->toBe($before[$key]);
        }
        $after->assertJsonPath('data.includes.washType.attributes.name', 'Regular washing')
            ->assertJsonPath('data.attributes.washSurchargeCents', 0);
        $old = $this->asStaff()->getJson("/api/v1/orders/{$oldId}")->assertOk();
        $old->assertJsonPath('data.attributes.totalCents', 17500)->assertJsonPath('data.includes.washType.attributes.name', 'Regular washing');
        expect(DB::table('payments')->get()->map(fn ($p) => (array) $p)->all())->toBe($paymentsBefore);
        expect(DB::table('inventory_movements')->count())->toBe($movementsBefore);
        expect(DB::table('inventory_movements')->where('type', 'usage')->count())->toBe(0);
        expect(DB::table('inventory_movements')->whereNotNull('order_id')->count())->toBe(0);

        // Reference data was added, and nothing the owner edited was touched. No soap was invented.
        expect(WashType::query()->orderBy('sort_order')->pluck('name')->all())->toBe(['Regular washing', 'Colored clothes', 'Softness and fragrance', 'Stain removal', 'Tough stains']);
        expect(DB::table('payment_methods')->pluck('code')->all())->toContain('cash', 'gcash', 'maya');
        expect(DB::table('payment_methods')->where('code', 'gcash')->value('label'))->toBe('GCash (edited by the owner)');
        expect(DB::table('wash_type_supplies')->count())->toBe(0);
        expect(DB::table('shop_settings')->value('block_orders_on_low_soap'))->toEqual(0);
        expect(DB::table('units')->whereIn('code', ['L', 'kg', 'pcs'])->count())->toBe(3);

        // A wash type is required from now on, and new orders work, with soap.
        expect(fn () => DB::table('orders')->insert([
            'order_number' => 'LF-261101-0100', 'customer_id' => $customerId, 'current_status_id' => 1, 'received_by' => 2,
            'received_at' => now(), 'promised_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]))->toThrow(QueryException::class);
        $this->asStaff()->patchJson('/api/v1/wash-types/'.$regular, ['data' => ['attributes' => ['supplies' => [['inventoryItemId' => 1, 'usagePerKgSmallUnit' => 25]]]]])->assertOk();
        $new = $this->orderWith(null, [['serviceId' => 1, 'weightKg' => 4]])->assertCreated();
        $new->assertJsonPath('data.includes.washType.attributes.name', 'Regular washing');
        expect((float) InventoryMovement::query()->where('order_id', $new->json('data.id'))->value('quantity'))->toBe(0.1);

        // Running the migrations again changes nothing.
        $rows = DB::table('wash_types')->count();
        Artisan::call('migrate', ['--force' => true]);
        expect(DB::table('wash_types')->count())->toBe($rows);
    } finally {
        Artisan::call('migrate:fresh', ['--force' => true]);
    }
});

it('can undo the three migrations on a database without usage, and refuses once soap was used', function () {
    DB::rollBack();

    try {
        Artisan::call('migrate:fresh', ['--seed' => true, '--seeder' => ReferenceDataSeeder::class, '--force' => true]);
        OrderStatus::flushCache();
        $this->saveWashType($this->washType('Regular washing'), ['supplies' => [['inventoryItemId' => 1, 'usagePerKgSmallUnit' => 25]]])->assertOk();
        InventoryMovement::query()->create(['item_id' => 1, 'user_id' => 1, 'type' => 'in', 'quantity' => 10, 'moved_at' => now()]);
        $this->orderWith(null, [['serviceId' => 1, 'weightKg' => 4]])->assertCreated();

        // Soap was used: the rollback stops instead of losing the order link.
        expect(fn () => Artisan::call('migrate:rollback', ['--step' => 3, '--force' => true]))->toThrow(RuntimeException::class);
        expect(Schema::hasColumn('inventory_movements', 'order_id'))->toBeTrue();
    } finally {
        Artisan::call('migrate:fresh', ['--force' => true]);
    }
});
