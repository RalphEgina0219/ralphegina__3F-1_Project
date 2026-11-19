<?php

use App\Actions\V1\CreateOrder;
use App\Models\AuditLog;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Notification;
use App\Models\Order;
use App\Models\User;
use App\Models\WashType;
use Database\Seeders\WashTypeReferenceSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

const KG = 1;
const LITER = 2;
const PIECE = 3;

describe('the reference data', function () {
    it('has the five wash types at no extra charge and the Maya payment method', function () {
        expect(WashType::query()->orderBy('sort_order')->pluck('name')->all())->toBe(['Regular washing', 'Colored clothes', 'Softness and fragrance', 'Stain removal', 'Tough stains']);
        expect(WashType::query()->sum('surcharge_per_kg_cents'))->toBe(0);
        expect(DB::table('payment_methods')->pluck('code')->all())->toBe(['cash', 'gcash', 'maya']);
        expect(DB::table('units')->whereIn('code', ['L', 'kg', 'pcs'])->count())->toBe(3);
    });

    it('can be run again on a live database without changing what the owner edited', function () {
        $this->washType('Tough stains')->update(['name' => 'Heavy stains', 'surcharge_per_kg_cents' => 800]);
        DB::table('payment_methods')->where('code', 'maya')->update(['label' => 'Maya (PayMaya)']);

        (new WashTypeReferenceSeeder)->run();

        // Renamed: the seeder adds the missing "Tough stains" beside it and leaves the edited row alone.
        expect(WashType::query()->where('name', 'Heavy stains')->value('surcharge_per_kg_cents'))->toBe(800);
        expect(DB::table('payment_methods')->where('code', 'maya')->value('label'))->toBe('Maya (PayMaya)');
        expect(DB::table('payment_methods')->count())->toBe(3);
        (new WashTypeReferenceSeeder)->run();
        expect(WashType::query()->count())->toBe(6);
    });
});

describe('the wash type charge', function () {
    it('defaults to Regular washing at no extra charge', function () {
        $response = $this->orderWith(null, [['serviceId' => 1, 'weightKg' => 6.5]])->assertCreated();

        $response->assertJsonPath('data.includes.washType.attributes.name', 'Regular washing')
            ->assertJsonPath('data.attributes.washSurchargePerKgCents', 0)
            ->assertJsonPath('data.attributes.washSurchargeCents', 0)
            ->assertJsonPath('data.attributes.totalCents', 22750);
    });

    it('charges the surcharge per kilo on the per-kg weight and freezes it on the order', function () {
        $this->saveWashType($this->washType('Tough stains'), ['surchargePerKgCents' => 500])->assertOk();

        $response = $this->orderWith($this->washType('Tough stains'), [['serviceId' => 1, 'weightKg' => 6.5], ['serviceId' => 4, 'quantity' => 6]])->assertCreated();
        $response->assertJsonPath('data.attributes.washSurchargePerKgCents', 500)
            ->assertJsonPath('data.attributes.washSurchargeCents', 3250)
            ->assertJsonPath('data.attributes.perKgWeightKg', 6.5)
            ->assertJsonPath('data.attributes.totalCents', 22750 + 9000 + 3250);
        $orderId = $response->json('data.id');

        // Changing the surcharge or the rate later never changes an existing order.
        $this->saveWashType($this->washType('Tough stains'), ['surchargePerKgCents' => 9900])->assertOk();
        DB::table('services')->where('id', 1)->update(['rate_cents' => 9999]);
        $this->asStaff()->getJson("/api/v1/orders/{$orderId}")->assertJsonPath('data.attributes.totalCents', 22750 + 9000 + 3250);
        $list = $this->asStaff()->getJson('/api/v1/orders?include=items,washType')->assertOk();
        expect($list->json('data.0.attributes.totalCents'))->toBe(22750 + 9000 + 3250);
    });

    it('adds no surcharge when the order has no per-kg laundry', function () {
        $this->saveWashType($this->washType('Tough stains'), ['surchargePerKgCents' => 500])->assertOk();

        $this->orderWith($this->washType('Tough stains'), [['serviceId' => 3, 'quantity' => 2]])->assertCreated()
            ->assertJsonPath('data.attributes.washSurchargeCents', 0)
            ->assertJsonPath('data.attributes.totalCents', 30000);
    });

    it('counts the surcharge in the balance a payment may take', function () {
        $this->saveWashType($this->washType('Tough stains'), ['surchargePerKgCents' => 500])->assertOk();
        // 6.5 kg: 22750 + 3250 = 26000. The first payment may not exceed it, the second takes the rest.
        $response = $this->orderWith($this->washType('Tough stains'), [['serviceId' => 1, 'weightKg' => 6.5]], ['amountCents' => 26001, 'paymentMethod' => 'cash'])->assertUnprocessable();
        expect($this->firstError($response))->toBe('The amount cannot be more than the balance.');

        $this->orderWith($this->washType('Tough stains'), [['serviceId' => 1, 'weightKg' => 6.5]], ['amountCents' => 26000, 'paymentMethod' => 'cash'])->assertCreated()
            ->assertJsonPath('data.attributes.paymentStatus', 'paid');
    });

    it('rounds the surcharge to the centavo', function () {
        $this->saveWashType($this->washType('Stain removal'), ['surchargePerKgCents' => 335])->assertOk();

        // 1.5 kg x 335 = 502.5 -> 503. The minimum billable weight does not apply to the surcharge.
        $this->orderWith($this->washType('Stain removal'), [['serviceId' => 1, 'weightKg' => 1.5]])->assertCreated()
            ->assertJsonPath('data.attributes.washSurchargeCents', 503);
    });

    it('refuses an inactive wash type for new orders but keeps it on old ones', function () {
        $old = $this->orderWith($this->washType('Colored clothes'), [['serviceId' => 1, 'weightKg' => 4]])->assertCreated();
        $this->saveWashType($this->washType('Colored clothes'), ['isActive' => false])->assertOk();

        $response = $this->orderWith($this->washType('Colored clothes'), [['serviceId' => 1, 'weightKg' => 4]])->assertUnprocessable();
        expect($this->errorSources($response))->toContain('data.relationships.washType.data.id');
        $this->asStaff()->getJson('/api/v1/orders/'.$old->json('data.id'))->assertJsonPath('data.includes.washType.attributes.name', 'Colored clothes');
        expect($this->asStaff()->getJson('/api/v1/wash-types?active=1')->json('data'))->toHaveCount(4);
    });

    it('shows the customer the wash type and its charge, never soap quantities', function () {
        $stain = $this->soap('Stain remover', LITER, 5);
        $this->saveWashType($this->washType('Tough stains'), ['surchargePerKgCents' => 500, 'supplies' => [['inventoryItemId' => $stain->id, 'usagePerKgSmallUnit' => 25]]])->assertOk();
        $customer = $this->customerWithAccount();
        $order = $this->orderWith($this->washType('Tough stains'), [['serviceId' => 1, 'weightKg' => 6.5]], null, 'kevin.m', $customer)->assertCreated();

        $account = $customer->account;
        $detail = $this->asCustomer($account)->getJson('/api/v1/customer/orders/'.$order->json('data.attributes.orderNumber'))->assertOk();
        $detail->assertJsonPath('data.attributes.washTypeName', 'Tough stains')
            ->assertJsonPath('data.attributes.washSurchargeCents', 3250);
        expect(json_encode($detail->json()))->not->toContain('soapUsage')->not->toContain('Stain remover')->not->toContain('usage');
        $list = $this->asCustomer($account)->getJson('/api/v1/customer/orders')->assertOk();
        expect($list->json('data.0.attributes.washTypeName'))->toBe('Tough stains');
    });
});

describe('soap deducted from stock', function () {
    it('deducts the usage of every soap of the wash type, linked to the order and the staff member', function () {
        $pods = $this->soap('Detergent pods', PIECE, 10, 3);
        $remover = $this->soap('Stain remover', LITER, 5, 1);
        $this->saveWashType($this->washType('Tough stains'), ['supplies' => [
            ['inventoryItemId' => $pods->id, 'usagePerKgSmallUnit' => 0.25],
            ['inventoryItemId' => $remover->id, 'usagePerKgSmallUnit' => 25],
        ]])->assertOk();

        $response = $this->orderWith($this->washType('Tough stains'), [['serviceId' => 1, 'weightKg' => 6.5]], null, 'kevin.m')->assertCreated();
        $order = Order::query()->findOrFail($response->json('data.id'));

        $movements = InventoryMovement::query()->where('order_id', $order->id)->orderBy('item_id')->get();
        expect($movements)->toHaveCount(2);
        $kevin = User::query()->where('username', 'kevin.m')->value('id');
        foreach ($movements as $movement) {
            expect($movement->type)->toBe('usage')->and($movement->user_id)->toBe($kevin);
        }
        // 0.25 pcs x 6.5 kg = 1.625 -> 2 pieces; 25 mL x 6.5 kg = 162.5 -> 163 mL.
        expect($movements[0]->quantity)->toBe(2.0)->and($movements[1]->quantity)->toBe(0.163);
        expect($movements[0]->remarks)->toBe("Order {$order->order_number} · Tough stains · 6.5 kg");
        expect($pods->fresh()->onHand())->toBe(8.0);
        expect($remover->fresh()->onHand())->toBe(4.837);

        $response->assertJsonPath('data.includes.soapUsage.0.itemName', 'Detergent pods')
            ->assertJsonPath('data.includes.soapUsage.1.label', 'Stain remover 163 mL');
    });

    it('shows the movement on the inventory list as used by its order', function () {
        $powder = $this->soap('Detergent powder 2', KG, 5);
        $this->saveWashType($this->washType('Regular washing'), ['supplies' => [['inventoryItemId' => $powder->id, 'usagePerKgSmallUnit' => 25]]])->assertOk();
        $order = $this->orderWith(null, [['serviceId' => 1, 'weightKg' => 4]])->assertCreated();

        $rows = $this->asStaff()->getJson('/api/v1/inventory/movements?type=usage')->assertOk();
        expect($rows->json('data'))->toHaveCount(1);
        $rows->assertJsonPath('data.0.attributes.orderNumber', $order->json('data.attributes.orderNumber'))
            ->assertJsonPath('data.0.attributes.signedQuantity', -0.1)
            ->assertJsonPath('data.0.attributes.type', 'usage');
    });

    it('deducts nothing when the order has no per-kg weight', function () {
        $remover = $this->soap('Stain remover', LITER, 5);
        $this->saveWashType($this->washType('Stain removal'), ['supplies' => [['inventoryItemId' => $remover->id, 'usagePerKgSmallUnit' => 15]]])->assertOk();

        $this->orderWith($this->washType('Stain removal'), [['serviceId' => 3, 'quantity' => 2]])->assertCreated();

        expect(InventoryMovement::query()->where('type', 'usage')->count())->toBe(0);
        expect($remover->fresh()->onHand())->toBe(5.0);
    });

    it('writes nothing when the order fails: the usage is in the same transaction', function () {
        $remover = $this->soap('Stain remover', LITER, 5);
        $this->saveWashType($this->washType('Stain removal'), ['supplies' => [['inventoryItemId' => $remover->id, 'usagePerKgSmallUnit' => 15]]])->assertOk();
        $customer = $this->customerWithAccount();
        $staff = User::query()->where('username', 'kevin.m')->firstOrFail();

        // The payment fails at the very end (unknown method), after the soap was already written.
        expect(fn () => app(CreateOrder::class)([
            'customer_id' => $customer->id,
            'basket_ids' => $this->baskets(),
            'lines' => [['service_id' => 1, 'weight_kg' => 5.0, 'quantity' => null, 'unit_price_cents' => 3500, 'subtotal_cents' => 17500]],
            'wash_type_id' => $this->washType('Stain removal')->id,
            'wash_surcharge_per_kg_cents' => 0,
            'promised_at' => now()->addDay()->toIso8601String(),
            'notes' => null,
            'payment' => ['amount_cents' => 1000, 'method' => 'bogus', 'reference_number' => null],
        ], $staff))->toThrow(QueryException::class);

        expect(Order::query()->count())->toBe(0);
        expect(InventoryMovement::query()->where('type', 'usage')->count())->toBe(0);
        expect($remover->fresh()->onHand())->toBe(5.0);
    });

    it('warns, clamps at zero and tells the owner to record a stock-in when the stock is short and orders are not blocked', function () {
        $conditioner = $this->soap('Fabric conditioner 2', LITER, 0.08, 0.05);
        $this->saveWashType($this->washType('Softness and fragrance'), ['supplies' => [['inventoryItemId' => $conditioner->id, 'usagePerKgSmallUnit' => 20]]])->assertOk();

        $response = $this->orderWith($this->washType('Softness and fragrance'), [['serviceId' => 1, 'weightKg' => 6.5]])->assertCreated();

        $movement = InventoryMovement::query()->where('order_id', $response->json('data.id'))->firstOrFail();
        expect($movement->quantity)->toBe(0.08)->and($movement->required_quantity)->toBe(0.13);
        expect($movement->remarks)->toContain('short by 50 mL');
        expect($conditioner->fresh()->onHand())->toBe(0.0);
        expect(Notification::query()->where('recipient_type', 'staff')->where('message', 'like', 'Record a stock-in for Fabric conditioner 2%')->count())->toBe(1);
        // The scan screen still says what the order needed.
        $response->assertJsonPath('data.includes.soapUsage.0.requiredQuantity', 0.13);
    });

    it('answers 409 with the same message and saves nothing when orders are blocked on a shortage', function () {
        $conditioner = $this->soap('Fabric conditioner', LITER, 0.08, 0.05);
        $this->saveWashType($this->washType('Softness and fragrance'), ['supplies' => [['inventoryItemId' => $conditioner->id, 'usagePerKgSmallUnit' => 20]]])->assertOk();
        $this->asStaff('kevin.m')->putJson('/api/v1/settings/stock-rule', ['data' => ['attributes' => ['blockOrdersOnLowSoap' => true]]])->assertForbidden();
        $this->asStaff()->putJson('/api/v1/settings/stock-rule', ['data' => ['attributes' => ['blockOrdersOnLowSoap' => true]]])->assertOk();

        $response = $this->orderWith($this->washType('Softness and fragrance'), [['serviceId' => 1, 'weightKg' => 6.5]])->assertStatus(409);

        expect($this->firstError($response))->toContain('Fabric conditioner: needs 130 mL, only 80 mL recorded');
        expect(Order::query()->count())->toBe(0);
        expect(InventoryMovement::query()->where('type', 'usage')->count())->toBe(0);
        expect($conditioner->fresh()->onHand())->toBe(0.08);

        // With enough stock the same order goes through, and the rule is in the audit log.
        InventoryMovement::query()->create(['item_id' => $conditioner->id, 'user_id' => 1, 'type' => 'in', 'quantity' => 1, 'moved_at' => now()]);
        $this->orderWith($this->washType('Softness and fragrance'), [['serviceId' => 1, 'weightKg' => 6.5]])->assertCreated();
        expect(AuditLog::query()->where('action', 'settings.stock_rule_updated')->count())->toBe(1);
    });

    it('lets the low-stock alert react to the usage', function () {
        $remover = $this->soap('Stain remover', LITER, 1.05, 1);
        $this->saveWashType($this->washType('Stain removal'), ['supplies' => [['inventoryItemId' => $remover->id, 'usagePerKgSmallUnit' => 15]]])->assertOk();

        $this->orderWith($this->washType('Stain removal'), [['serviceId' => 1, 'weightKg' => 6.5]])->assertCreated();

        expect(Notification::query()->where('type', 'low_stock')->where('message', 'like', 'Stain remover is below its reorder level%')->count())->toBe(1);
        $item = collect($this->asStaff()->getJson('/api/v1/inventory/items')->json('data'))->firstWhere('attributes.name', 'Stain remover');
        expect($item['attributes']['stockStatus'])->toBe('low');
    });
});

describe('Settings > Pricing & Usage', function () {
    it('lets the owner add, change and deactivate wash types, and keeps staff out with 403', function () {
        $body = ['data' => ['attributes' => ['name' => 'Delicates', 'surchargePerKgCents' => 300]]];
        $this->asStaff('kevin.m')->postJson('/api/v1/wash-types', $body)->assertForbidden();
        $this->saveWashType($this->washType('Regular washing'), ['surchargePerKgCents' => 100], 'kevin.m')->assertForbidden();
        $this->asStaff('kevin.m')->getJson('/api/v1/wash-types')->assertOk();

        $created = $this->asStaff()->postJson('/api/v1/wash-types', $body)->assertCreated();
        $created->assertJsonPath('data.attributes.name', 'Delicates')->assertJsonPath('data.attributes.sortOrder', 6)->assertJsonPath('data.attributes.isActive', true);
        $this->saveWashType(WashType::query()->findOrFail($created->json('data.id')), ['name' => 'Delicate wash', 'isActive' => false])->assertOk()
            ->assertJsonPath('data.attributes.name', 'Delicate wash')->assertJsonPath('data.attributes.isActive', false);
    });

    it('validates money, usage, duplicates and the units of the soaps', function () {
        $powder = $this->soap('Powder', KG, 5);
        $rolls = InventoryItem::query()->create(['name' => 'Receipt paper', 'unit_id' => 4, 'reorder_level' => 1, 'is_active' => true]);
        $retired = $this->soap('Old soap', LITER, 5);
        $retired->update(['is_active' => false]);
        $regular = $this->washType('Regular washing');

        $errors = fn (array $attributes) => $this->errorSources($this->saveWashType($regular, $attributes)->assertUnprocessable());

        expect($errors(['surchargePerKgCents' => -1]))->toContain('data.attributes.surchargePerKgCents');
        expect($errors(['surchargePerKgCents' => 12.5]))->toContain('data.attributes.surchargePerKgCents');
        expect($errors(['name' => 'Tough stains']))->toContain('data.attributes.name');
        expect($errors(['supplies' => [['inventoryItemId' => $powder->id, 'usagePerKgSmallUnit' => 0]]]))->toContain('data.attributes.supplies.0.usagePerKgSmallUnit');
        expect($errors(['supplies' => [['inventoryItemId' => $powder->id, 'usagePerKgSmallUnit' => 25], ['inventoryItemId' => $powder->id, 'usagePerKgSmallUnit' => 30]]]))->toContain('data.attributes.supplies.1.inventoryItemId');
        expect($errors(['supplies' => [['inventoryItemId' => $rolls->id, 'usagePerKgSmallUnit' => 1]]]))->toContain('data.attributes.supplies.0.inventoryItemId');
        expect($errors(['supplies' => [['inventoryItemId' => $retired->id, 'usagePerKgSmallUnit' => 1]]]))->toContain('data.attributes.supplies.0.inventoryItemId');
        expect(WashType::query()->where('is_active', true)->count())->toBe(5);

        // The last active wash type cannot be switched off.
        foreach (['Colored clothes', 'Softness and fragrance', 'Stain removal', 'Tough stains'] as $name) {
            $this->saveWashType($this->washType($name), ['isActive' => false])->assertOk();
        }
        $this->saveWashType($regular, ['isActive' => false])->assertUnprocessable();
    });

    it('writes one audit entry per change with the old and the new value', function () {
        $powder = $this->soap('Detergent powder', KG, 5);
        $this->saveWashType($this->washType('Regular washing'), ['supplies' => [['inventoryItemId' => $powder->id, 'usagePerKgSmallUnit' => 25]]])->assertOk();
        AuditLog::query()->delete();

        $this->saveWashType($this->washType('Regular washing'), ['supplies' => [['inventoryItemId' => $powder->id, 'usagePerKgSmallUnit' => 50]]])->assertOk();
        $this->saveWashType($this->washType('Tough stains'), ['surchargePerKgCents' => 500])->assertOk();

        $logs = AuditLog::query()->where('action', 'wash_type.updated')->orderBy('id')->get();
        expect($logs->pluck('new_values.summary')->all())->toBe([
            'Regular washing · Detergent powder: 25 g/kg → 50 g/kg',
            'Tough stains · surcharge: ₱0.00/kg → ₱5.00/kg',
        ]);
        expect($logs[0]->old_values['usage_per_kg_small_unit'])->toBe(25)->and($logs[0]->new_values['usage_per_kg_small_unit'])->toBe(50);
        $activity = $this->asStaff()->getJson('/api/v1/activity-logs')->assertOk();
        expect(collect($activity->json('data'))->pluck('attributes.summary')->all())->toContain('Regular washing · Detergent powder: 25 g/kg → 50 g/kg');
    });

    it('applies new usage to new orders only', function () {
        $powder = $this->soap('Detergent powder', KG, 5);
        $this->saveWashType($this->washType('Regular washing'), ['supplies' => [['inventoryItemId' => $powder->id, 'usagePerKgSmallUnit' => 25]]])->assertOk();
        $first = $this->orderWith(null, [['serviceId' => 1, 'weightKg' => 10]])->assertCreated();

        $this->saveWashType($this->washType('Regular washing'), ['supplies' => [['inventoryItemId' => $powder->id, 'usagePerKgSmallUnit' => 50]]])->assertOk();
        $second = $this->orderWith(null, [['serviceId' => 1, 'weightKg' => 10]])->assertCreated();

        $used = fn ($response) => (float) InventoryMovement::query()->where('order_id', $response->json('data.id'))->value('quantity');
        expect($used($first))->toBe(0.25)->and($used($second))->toBe(0.5);
        expect($powder->fresh()->onHand())->toBe(4.25);
    });

    it('lists only soap units on a wash type response and keeps customers out of the supplies', function () {
        $powder = $this->soap('Detergent powder', KG, 5);
        $this->saveWashType($this->washType('Regular washing'), ['supplies' => [['inventoryItemId' => $powder->id, 'usagePerKgSmallUnit' => 25]]])->assertOk();

        $row = collect($this->asStaff('kevin.m')->getJson('/api/v1/wash-types')->assertOk()->json('data'))->firstWhere('attributes.name', 'Regular washing');
        expect($row['attributes']['supplies'][0])->toMatchArray(['itemName' => 'Detergent powder', 'unitCode' => 'kg', 'usageLabel' => '25 g/kg', 'usagePerKgSmallUnit' => 25.0, 'onHand' => 5.0]);
        $this->asGuest()->getJson('/api/v1/wash-types')->assertUnauthorized();
    });
});

describe('Maya and Pay at pickup', function () {
    it('needs a reference number for Maya, like GCash', function () {
        $items = [['serviceId' => 1, 'weightKg' => 5]];
        $response = $this->orderWith(null, $items, ['amountCents' => 5000, 'paymentMethod' => 'maya'])->assertUnprocessable();
        expect($this->errorSources($response))->toContain('data.attributes.payment.referenceNumber');
        expect($this->firstError($response))->toBe('Enter the Maya reference number.');

        $paid = $this->orderWith(null, $items, ['amountCents' => 5000, 'paymentMethod' => 'maya', 'referenceNumber' => 'MY123456'])->assertCreated();
        $paid->assertJsonPath('data.includes.payments.0.attributes.method', 'maya')
            ->assertJsonPath('data.includes.payments.0.attributes.methodLabel', 'Maya')
            ->assertJsonPath('data.includes.payments.0.attributes.referenceNumber', 'MY123456');

        $this->asStaff()->postJson('/api/v1/orders/'.$paid->json('data.id').'/payments', ['data' => ['attributes' => ['amountCents' => 1000, 'paymentMethod' => 'maya']]])->assertUnprocessable();
        $this->asStaff()->postJson('/api/v1/orders/'.$paid->json('data.id').'/payments', ['data' => ['attributes' => ['amountCents' => 1000, 'paymentMethod' => 'maya', 'referenceNumber' => 'MY777']]])->assertCreated();
    });

    it('records no payment for an order paid at pickup, and its balance is the full total', function () {
        $order = $this->orderWith(null, [['serviceId' => 1, 'weightKg' => 5]])->assertCreated();

        $order->assertJsonPath('data.attributes.paidCents', 0)->assertJsonPath('data.attributes.balanceCents', 17500)->assertJsonPath('data.attributes.paymentStatus', 'unpaid');
        expect(DB::table('payments')->count())->toBe(0);
    });

    it('counts Maya in the payment log and its filter', function () {
        $id = $this->createOrder([['serviceId' => 1, 'weightKg' => 5]]);
        $this->asStaff()->postJson("/api/v1/orders/{$id}/payments", ['data' => ['attributes' => ['amountCents' => 4000, 'paymentMethod' => 'maya', 'referenceNumber' => 'MY1']]])->assertCreated();
        $this->asStaff()->postJson("/api/v1/orders/{$id}/payments", ['data' => ['attributes' => ['amountCents' => 1000, 'paymentMethod' => 'cash']]])->assertCreated();

        $log = $this->asStaff()->getJson('/api/v1/payments?method=maya')->assertOk();
        expect($log->json('data'))->toHaveCount(1);
        expect($log->json('meta.mayaCents'))->toBe(4000)->and($log->json('meta.collectedCents'))->toBe(4000);
        $all = $this->asStaff()->getJson('/api/v1/payments')->json('meta');
        expect([$all['cashCents'], $all['gcashCents'], $all['mayaCents']])->toBe([1000, 0, 4000]);
        $this->asStaff()->getJson('/api/v1/reports/payments?method=maya')->assertOk();
    });
});

describe('analytics with wash types (120 days of demo history)', function () {
    beforeEach(function () {
        $this->useDemoData();
    });

    it('still agrees to the centavo, with the wash type surcharge as its own revenue category and Maya in the mix', function () {
        $from = now()->subDays(29)->toDateString();
        $to = now()->toDateString();

        $dashboard = $this->asStaff()->getJson("/api/v1/analytics/dashboard?from={$from}&to={$to}")->assertOk();
        $sales = $this->asStaff()->getJson("/api/v1/reports/sales?from={$from}&to={$to}")->assertOk();
        $payments = $this->asStaff()->getJson("/api/v1/reports/payments?from={$from}&to={$to}")->assertOk();
        $services = $this->asStaff()->getJson("/api/v1/reports/services?from={$from}&to={$to}")->assertOk();
        $log = $this->asStaff()->getJson("/api/v1/payments?paidAt={$from},{$to}")->assertOk();

        $kpi = collect($dashboard->json('data.kpis'))->firstWhere('key', 'sales')['value'];
        expect($kpi)->toBeGreaterThan(0)->toBe($sales->json('data.table.totals.sales'))->toBe($payments->json('data.table.totals.amount'))->toBe($log->json('meta.collectedCents'));

        $labels = array_column($services->json('data.series.revenue_by_service'), 'label');
        expect($labels)->toContain('Wash type surcharges');
        expect(array_sum(array_column($services->json('data.series.revenue_by_service'), 'value')))->toBe($services->json('data.table.totals.revenue'))->toBe($kpi);
        expect(array_sum(array_column($dashboard->json('data.series.revenue_by_service'), 'value')))->toBe($kpi);

        $mix = collect($payments->json('data.series.payment_mix'))->pluck('value', 'key');
        expect($mix['maya'])->toBeGreaterThan(0);
        expect($mix['cash'] + $mix['gcash'] + $mix['maya'])->toBe($kpi);
        expect($sales->json('data.table.totals.maya'))->toBe($mix['maya']);
        $log->assertJsonPath('meta.mayaCents', $mix['maya']);
    });

    it('reports orders by wash type and soap usage, separating orders from manual stock-outs', function () {
        $orders = $this->asStaff()->getJson('/api/v1/reports/orders')->assertOk();
        $byWash = $orders->json('data.series.by_wash_type');
        expect(array_sum(array_column($byWash, 'value')))->toBe(collect($orders->json('data.kpis'))->firstWhere('key', 'orders')['value']);
        expect(array_column($byWash, 'label'))->toContain('Regular washing');

        $inventory = $this->asStaff()->getJson('/api/v1/reports/inventory')->assertOk();
        expect(collect($inventory->json('data.kpis'))->pluck('key')->all())->toContain('used_by_orders', 'manual_out');
        expect($inventory->json('data.series.soap_by_wash_type'))->not->toBeEmpty();
        expect($inventory->json('data.series.top_soaps'))->not->toBeEmpty();
        expect(collect($inventory->json('data.series.soap_by_source'))->sum('orders'))->toBeGreaterThan(0);
        expect(collect($inventory->json('data.table.rows'))->pluck('type')->unique()->all())->toContain('Used by order');
    });

    it('keeps stock levels believable: usage matches the orders and nothing ends below zero', function () {
        $items = $this->asStaff()->getJson('/api/v1/inventory/items')->assertOk()->json('data');
        foreach ($items as $item) {
            expect($item['attributes']['onHand'])->toBeGreaterThanOrEqual(0);
        }
        $statuses = collect($items)->pluck('attributes.stockStatus')->all();
        expect(array_diff($statuses, ['ok']))->not->toBeEmpty();
        // Every usage movement belongs to an order, and the tough-stains surcharge is on its orders.
        expect(InventoryMovement::query()->where('type', 'usage')->whereNull('order_id')->count())->toBe(0);
        expect(Order::query()->where('wash_surcharge_per_kg_cents', '>', 0)->count())->toBeGreaterThan(0);
        expect(DB::table('payments')->where('payment_method_id', 3)->count())->toBeGreaterThan(0);
    });
});
