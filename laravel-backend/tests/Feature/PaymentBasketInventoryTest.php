<?php

use App\Models\Basket;
use App\Models\Notification;
use App\Models\Order;

$pay = fn (int $cents, string $method = 'cash', ?string $reference = null) => ['data' => ['attributes' => array_filter([
    'amountCents' => $cents, 'paymentMethod' => $method, 'referenceNumber' => $reference,
])]];

describe('payments', function () use ($pay) {
    it('records up to the balance, with sequential OR numbers', function () use ($pay) {
        $order = $this->createOrder();

        $this->asStaff()->postJson("/api/v1/orders/{$order}/payments", $pay(20000))->assertStatus(422)
            ->assertJsonPath('errors.0.source', 'data.attributes.amountCents');
        $this->asStaff()->postJson("/api/v1/orders/{$order}/payments", $pay(5000, 'gcash'))->assertStatus(422)
            ->assertJsonPath('errors.0.message', 'Enter the GCash reference number.');
        $this->asStaff()->postJson("/api/v1/orders/{$order}/payments", $pay(5000, 'gcash', '5012345678901'))->assertCreated();
        $this->asStaff()->postJson("/api/v1/orders/{$order}/payments", $pay(12500))->assertCreated()
            ->assertJsonPath('data.attributes.paymentStatus', 'paid')
            ->assertJsonPath('data.includes.payments.0.attributes.receiptNumber', 'OR-000202');
        $this->asStaff()->postJson("/api/v1/orders/{$order}/payments", $pay(100))->assertStatus(422)
            ->assertJsonPath('errors.0.message', 'This order is already fully paid.');
    });

    it('voids with a reason and permission, which re-opens the balance', function () use ($pay) {
        $order = $this->createOrder(payment: ['amountCents' => 17500, 'paymentMethod' => 'cash']);
        $payment = Order::query()->find($order)->payments()->value('id');

        $this->asStaff('kevin.m')->postJson("/api/v1/payments/{$payment}/void", ['data' => ['attributes' => ['reason' => 'Wrong']]])->assertStatus(403);
        $this->asStaff()->postJson("/api/v1/payments/{$payment}/void", ['data' => ['attributes' => ['reason' => '  ']]])->assertStatus(422)
            ->assertJsonPath('errors.0.message', 'A reason is required.');
        $this->asStaff()->postJson("/api/v1/payments/{$payment}/void", ['data' => ['attributes' => ['reason' => 'Wrong amount']]])->assertOk()
            ->assertJsonPath('data.attributes.voidReason', 'Wrong amount')
            ->assertJsonPath('data.includes.voidedBy.attributes.name', 'Liza Ramos');
        $this->asStaff()->getJson("/api/v1/orders/{$order}")->assertJsonPath('data.attributes.balanceCents', 17500);

        // The staff toggle lets a staff member void too.
        $this->asStaff()->putJson('/api/v1/roles/staff/permissions', ['data' => ['attributes' => ['permissions' => ['payments.void']]]]);
        $this->asStaff()->postJson("/api/v1/orders/{$order}/payments", $pay(17500))->assertCreated();
        $second = Order::query()->find($order)->payments()->whereNull('voided_at')->value('id');
        $this->asStaff('kevin.m')->postJson("/api/v1/payments/{$second}/void", ['data' => ['attributes' => ['reason' => 'Keyed twice']]])->assertOk();
    });

    it('sums the collected meta like the sales figure, voided payments excluded', function () {
        $a = $this->createOrder(payment: ['amountCents' => 10000, 'paymentMethod' => 'cash']);
        $this->createOrder(payment: ['amountCents' => 5000, 'paymentMethod' => 'gcash', 'referenceNumber' => '5012']);
        $voided = Order::query()->find($a)->payments()->value('id');
        $this->asStaff()->postJson("/api/v1/payments/{$voided}/void", ['data' => ['attributes' => ['reason' => 'x']]]);

        $this->asStaff()->getJson('/api/v1/payments?paidAt='.now()->toDateString())
            ->assertJsonPath('meta.collectedCents', 5000)
            ->assertJsonPath('meta.cashCents', 0)
            ->assertJsonPath('meta.gcashCents', 5000)
            ->assertJsonPath('meta.count', 1)
            ->assertJsonCount(2, 'data');
        $this->asStaff()->getJson('/api/v1/balances')->assertJsonPath('meta.ordersCount', 2)->assertJsonPath('meta.outstandingCents', 17500 + 12500);
    });
});

describe('baskets', function () {
    it('numbers new baskets after the highest ever issued, with permanent unique tokens', function () {
        $first = $this->asStaff()->postJson('/api/v1/baskets', ['data' => ['attributes' => ['count' => 3, 'label' => 'Blue']]])->assertCreated();
        expect(array_column(array_column($first->json('data'), 'attributes'), 'basketNumber'))->toBe(['BSK-0001', 'BSK-0002', 'BSK-0003']);
        [$one, , $three] = array_column($first->json('data'), 'id');
        $this->asStaff()->postJson("/api/v1/baskets/{$three}/retire", ['data' => ['attributes' => ['reason' => 'Cracked']]])->assertOk();

        $next = $this->asStaff()->postJson('/api/v1/baskets', ['data' => ['attributes' => []]])->assertCreated();
        expect($next->json('data.0.attributes.basketNumber'))->toBe('BSK-0004');
        expect(Basket::query()->pluck('qr_token')->unique())->toHaveCount(4);

        $token = Basket::query()->find($one)->qr_token;
        $this->asStaff()->patchJson("/api/v1/baskets/{$one}", ['data' => ['attributes' => ['label' => 'Green', 'qrToken' => str_repeat('x', 32), 'basketNumber' => 'BSK-9999']]])
            ->assertOk()->assertJsonPath('data.attributes.label', 'Green')->assertJsonPath('data.attributes.basketNumber', 'BSK-0001');
        expect(Basket::query()->find($one)->qr_token)->toBe($token);

        $this->asStaff('kevin.m')->postJson('/api/v1/baskets', ['data' => ['attributes' => []]])->assertStatus(403);
        $this->asStaff()->postJson('/api/v1/baskets', ['data' => ['attributes' => ['count' => 101]]])->assertStatus(422)
            ->assertJsonPath('errors.0.message', 'Add between 1 and 100 baskets at a time.');
    });

    it('refuses to retire a basket in use, or twice', function () {
        $order = $this->createOrder();
        $basket = Order::query()->find($order)->basketAssignments()->value('basket_id');

        $this->asStaff()->postJson("/api/v1/baskets/{$basket}/retire")->assertStatus(409);
        $free = $this->baskets()[0];
        $this->asStaff()->postJson("/api/v1/baskets/{$free}/retire")->assertOk();
        $this->asStaff()->postJson("/api/v1/baskets/{$free}/retire")->assertStatus(409);
    });

    it('resolves a scanned label, basket number or order number', function () {
        $order = $this->createOrder();
        $basket = Basket::query()->find(Order::query()->find($order)->basketAssignments()->value('basket_id'));
        $free = Basket::query()->find($this->baskets()[0]);
        $number = Order::query()->find($order)->order_number;

        $this->asStaff('kevin.m')->getJson('/api/v1/scan/'.rawurlencode("https://shop.example/b/{$basket->qr_token}"))->assertOk()
            ->assertJsonPath('data.type', 'basket')->assertJsonPath('data.activeOrder.attributes.orderNumber', $number);
        $this->asStaff()->getJson("/api/v1/scan/{$free->basket_number}")->assertOk()->assertJsonPath('data.activeOrder', null);
        $this->asStaff()->getJson("/api/v1/scan/{$number}")->assertOk()->assertJsonPath('data.type', 'order');
        $this->asStaff()->getJson('/api/v1/scan/BSK-9999')->assertNotFound()->assertJsonPath('errors.0.message', 'No basket matches BSK-9999.');
        $this->asStaff()->getJson('/api/v1/scan/'.str_repeat('z', 32))->assertNotFound()
            ->assertJsonPath('errors.0.message', 'QR not recognized. Scan a LaundryFlow basket label.');
    });
});

describe('inventory', function () {
    $move = fn (int $item, string $type, float $quantity, ?string $remarks = null) => ['data' => [
        'attributes' => array_filter(['type' => $type, 'quantity' => $quantity, 'remarks' => $remarks]),
        'relationships' => ['item' => ['data' => ['id' => $item]]],
    ]];

    it('never lets a stock-out exceed what is on hand', function () use ($move) {
        $this->asStaff()->postJson('/api/v1/inventory/movements', $move(1, 'in', 10))->assertCreated();
        $this->asStaff('kevin.m')->postJson('/api/v1/inventory/movements', $move(1, 'out', 11))->assertStatus(422)
            ->assertJsonPath('errors.0.message', 'Stock-out cannot exceed the 10 on hand.');
        $this->asStaff('kevin.m')->postJson('/api/v1/inventory/movements', $move(1, 'out', 6.5))->assertCreated()
            ->assertJsonPath('data.attributes.signedQuantity', -6.5);
        $items = collect($this->asStaff()->getJson('/api/v1/inventory/items')->assertOk()->json('data'))->keyBy('id');
        expect($items[1]['attributes'])->toMatchArray(['onHand' => 3.5, 'stockStatus' => 'low', 'levelPercent' => 35]);
        // Critical items (nothing on hand) come first.
        expect($items->first()['attributes']['stockStatus'])->toBe('critical');
    });

    it('keeps stock-in and adjustments for the owner, and raises low-stock notices', function () use ($move) {
        $this->asStaff('kevin.m')->postJson('/api/v1/inventory/movements', $move(1, 'in', 10))->assertStatus(403)
            ->assertJsonPath('errors.0.message', 'Only an administrator can record stock-in or adjustments.');
        $this->asStaff()->postJson('/api/v1/inventory/movements', $move(1, 'adjust', 4))->assertStatus(422)
            ->assertJsonPath('errors.0.message', 'Say why the count is being adjusted.');
        $this->asStaff()->postJson('/api/v1/inventory/movements', $move(1, 'in', 8))->assertCreated();
        $this->asStaff('kevin.m')->postJson('/api/v1/inventory/movements', $move(1, 'out', 4))->assertCreated();

        expect(Notification::query()->where('type', 'low_stock')->value('message'))->toBe('Detergent powder is below its reorder level (4 kg left).');
    });
});
