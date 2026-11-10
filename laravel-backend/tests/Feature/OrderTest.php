<?php

use App\Actions\V1\CreateOrder;
use App\Models\AuditLog;
use App\Models\Basket;
use App\Models\Customer;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderBasket;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

describe('taking in an order', function () {
    it('writes everything in one transaction, with a daily order number and frozen prices', function () {
        $customer = $this->customerWithAccount();
        $baskets = $this->baskets(2);

        $response = $this->asStaff('kevin.m')->postJson('/api/v1/orders', $this->orderBody($customer->id, $baskets, [
            ['serviceId' => 1, 'weightKg' => 6.5],
            ['serviceId' => 4, 'quantity' => 6],
            ['serviceId' => 5],
        ], ['amountCents' => 20000, 'paymentMethod' => 'cash']));

        $response->assertCreated();
        $order = Order::query()->findOrFail($response->json('data.id'));
        expect($order->order_number)->toBe('LF-'.now()->format('ymd').'-0001');
        $response->assertJsonPath('data.attributes.totalCents', 36750)
            ->assertJsonPath('data.attributes.paidCents', 20000)
            ->assertJsonPath('data.attributes.balanceCents', 16750)
            ->assertJsonPath('data.attributes.paymentStatus', 'partial')
            ->assertJsonPath('data.attributes.status', 'received')
            ->assertJsonCount(3, 'data.includes.items')
            ->assertJsonCount(2, 'data.includes.baskets')
            ->assertJsonPath('data.includes.payments.0.attributes.receiptNumber', 'OR-000201')
            ->assertJsonPath('data.includes.shop.attributes.name', 'LaundryFlow');

        expect(Basket::query()->whereIn('id', $baskets)->pluck('status')->unique()->all())->toBe(['in_use']);
        expect($order->statusHistory()->count())->toBe(1);
        expect(Notification::query()->where('customer_id', $customer->id)->value('message'))->toBe("Order {$order->order_number} received");
        expect(AuditLog::query()->where('action', 'order.created')->count())->toBe(1);

        // A rate change later never alters this order.
        DB::table('services')->where('id', 1)->update(['rate_cents' => 9999]);
        $this->asStaff()->getJson("/api/v1/orders/{$order->id}")->assertJsonPath('data.attributes.totalCents', 36750);

        $second = $this->createOrder();
        expect(Order::query()->find($second)->order_number)->toBe('LF-'.now()->format('ymd').'-0002');
    });

    it('reports every problem with the counter wording', function () {
        $legacy = Customer::query()->create(['full_name' => 'No Account', 'contact_number' => '09179990000', 'barangay_id' => 1]);
        $retired = $this->baskets()[0];
        Basket::query()->whereKey($retired)->update(['status' => 'retired']);

        $response = $this->asStaff()->postJson('/api/v1/orders', $this->orderBody($legacy->id, [$retired], [
            ['serviceId' => 1, 'weightKg' => 2.25],
            ['serviceId' => 4, 'quantity' => 0],
            ['serviceId' => 5],
            ['serviceId' => 5],
            ['serviceId' => 6, 'quantity' => 1],
        ]));

        $response->assertStatus(422);
        expect(array_column($response->json('errors'), 'message', 'source'))->toBe([
            'data.relationships.customer.data.id' => 'This customer has no account yet. Create one first.',
            'data.relationships.baskets.data' => Basket::query()->find($retired)->basket_number.' is retired and cannot be used.',
            'data.attributes.items.0.weightKg' => 'Weight goes in 0.1 kg steps.',
            'data.attributes.items.1.quantity' => 'Enter a whole quantity of at least 1.',
            'data.attributes.items.3.serviceId' => 'Express (same day) applies once per order.',
            'data.attributes.items.4.serviceId' => 'Choose an active service.',
        ]);
    });

    it('refuses a basket that holds another order, and a payment above the total', function () {
        $first = $this->createOrder();
        $busy = Order::query()->find($first)->basketAssignments()->value('basket_id');
        $customer = $this->customerWithAccount();

        $busyResponse = $this->asStaff()->postJson('/api/v1/orders', $this->orderBody($customer->id, [$busy]))->assertStatus(409);
        expect($this->firstError($busyResponse))->toMatch('/^BSK-\d{4} is in use by LF-\d{6}-\d{4}\.$/');

        $tooMuch = $this->asStaff()->postJson('/api/v1/orders', $this->orderBody($customer->id, $this->baskets(), payment: ['amountCents' => 999999, 'paymentMethod' => 'gcash']));
        expect(array_column($tooMuch->json('errors'), 'message', 'source'))->toBe([
            'data.attributes.payment.amountCents' => 'The amount cannot be more than the balance.',
            'data.attributes.payment.referenceNumber' => 'Enter the GCash reference number.',
        ]);
    });

    it('needs payments.record to take a payment with the order', function () {
        $this->asStaff()->putJson('/api/v1/roles/staff/permissions', ['data' => ['attributes' => ['permissions' => []]]]);
        $customer = $this->customerWithAccount();

        $this->asStaff('aira.d')->postJson('/api/v1/orders', $this->orderBody($customer->id, $this->baskets(), payment: ['amountCents' => 100, 'paymentMethod' => 'cash']))
            ->assertStatus(403)->assertJsonPath('errors.0.message', 'You do not have permission to record payments.');
        $this->asStaff('aira.d')->postJson('/api/v1/orders', $this->orderBody($customer->id, $this->baskets()))->assertCreated();
    });

    it('lets the database itself refuse a second open order on one basket', function () {
        $basket = $this->baskets()[0];
        $order = $this->createOrder();
        OrderBasket::query()->create(['order_id' => $order, 'basket_id' => $basket, 'assigned_at' => now(), 'assigned_by' => 1]);

        // The race: the request was validated before another counter took the basket, so the
        // locked re-check inside the transaction refuses it, and the unique index backs it up.
        $create = app(CreateOrder::class);
        expect(fn () => $create([
            'customer_id' => $this->customerWithAccount()->id, 'basket_ids' => [$basket],
            'lines' => [['service_id' => 1, 'weight_kg' => 5, 'quantity' => null, 'unit_price_cents' => 3500, 'subtotal_cents' => 17500]],
            'promised_at' => now()->addDay()->toIso8601String(), 'notes' => null, 'payment' => null,
        ], User::query()->find(1)))->toThrow(HttpException::class, 'is in use by');

        expect(fn () => DB::table('order_baskets')->insert(['order_id' => $order, 'basket_id' => $basket, 'assigned_at' => now(), 'assigned_by' => 1]))
            ->toThrow(QueryException::class);
        expect(Order::query()->count())->toBe(1);
    });

    it('lists orders with status counts that ignore the status filter', function () {
        $this->createOrder();
        $washing = $this->createOrder();
        $this->moveTo($washing, 'washing')->assertOk();

        $response = $this->asStaff()->getJson('/api/v1/orders?status=washing&include=customer,baskets,items,receivedBy');
        $response->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.statusCounts.received', 1)
            ->assertJsonPath('meta.statusCounts.washing', 1)
            ->assertJsonPath('meta.statusCounts.all', 2)
            ->assertJsonPath('data.0.includes.receivedBy.attributes.name', 'Liza Ramos');
        $this->asStaff()->getJson('/api/v1/orders?paymentStatus=paid')->assertJsonCount(0, 'data');
        $this->asStaff()->getJson('/api/v1/orders?receivedAt='.now()->toDateString())->assertJsonCount(2, 'data');
        $this->asStaff()->getJson('/api/v1/orders?receivedAt=2020-01-01,2020-01-31')->assertJsonCount(0, 'data');
    });
});

describe('status changes', function () {
    it('moves forward one stage at a time and writes history, notices and the audit log', function () {
        $order = $this->createOrder();

        $this->moveTo($order, 'drying')->assertStatus(409)->assertJsonPath('errors.0.message', 'Orders move one stage at a time. Next is Washing.');
        $this->moveTo($order, 'received')->assertStatus(409);
        foreach (['washing', 'drying', 'folding', 'ready_for_pickup'] as $status) {
            $this->moveTo($order, $status, user: 'kevin.m')->assertOk()->assertJsonPath('data.attributes.status', $status);
        }

        expect(Order::query()->find($order)->statusHistory()->count())->toBe(5);
        expect(Notification::query()->where('recipient_type', 'staff')->where('type', 'ready_for_pickup')->count())->toBe(1);
        expect(Notification::query()->where('recipient_type', 'customer')->latest('id')->value('message'))->toContain('Ready for pickup!');
        expect(AuditLog::query()->where('action', 'order.status_changed')->count())->toBe(4);
    });

    it('lets only an admin move back one stage, with a reason', function () {
        $order = $this->createOrder();
        $this->moveTo($order, 'washing');
        $this->moveTo($order, 'drying');

        $this->moveTo($order, 'washing', 'oops', 'kevin.m')->assertStatus(403);
        $this->moveTo($order, 'washing')->assertStatus(422)->assertJsonPath('errors.0.message', 'Give a reason for moving this order back.');
        $this->moveTo($order, 'washing', 'Wrong load')->assertOk()->assertJsonPath('data.attributes.status', 'washing');
    });

    it('completes only with a zero balance, frees the baskets and locks the record', function () {
        $order = $this->createOrder();
        foreach (['washing', 'drying', 'folding', 'ready_for_pickup'] as $status) {
            $this->moveTo($order, $status);
        }

        $this->moveTo($order, 'released')->assertStatus(409)->assertJsonPath('errors.0.message', 'Settle the balance before completing this order.');
        $this->asStaff()->postJson("/api/v1/orders/{$order}/payments", ['data' => ['attributes' => ['amountCents' => 17500, 'paymentMethod' => 'cash']]])->assertCreated();
        $this->moveTo($order, 'released')->assertOk()->assertJsonPath('data.attributes.statusLabel', 'Completed');

        $basket = OrderBasket::query()->where('order_id', $order)->firstOrFail();
        expect($basket->released_at)->not->toBeNull();
        expect(Basket::query()->find($basket->basket_id)->status)->toBe('available');

        $this->moveTo($order, 'ready_for_pickup', 'Came back')->assertStatus(409)->assertJsonPath('errors.0.message', 'This transaction is completed.');
        $this->asStaff()->patchJson("/api/v1/orders/{$order}", ['data' => ['attributes' => ['notes' => 'x']]])->assertStatus(409);
    });

    it('refuses a stale scan: the basket in hand must still hold the order', function () {
        $order = $this->createOrder();
        $other = $this->baskets()[0];

        $this->asStaff()->postJson("/api/v1/orders/{$order}/status", ['data' => [
            'attributes' => ['toStatus' => 'washing'],
            'relationships' => ['basket' => ['data' => ['id' => $other]]],
        ]])->assertStatus(409)->assertJsonPath('errors.0.message', 'This basket has no active laundry session.');
    });
});
