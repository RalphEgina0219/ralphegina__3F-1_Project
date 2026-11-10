<?php

use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;

$register = fn (array $overrides = []) => array_merge([
    'full_name' => 'Portal Person',
    'contact_number' => '0917 444 5555',
    'email' => 'portal@example.com',
    'password' => 'laundry123',
    'password_confirmation' => 'laundry123',
    'barangay_id' => 28,
], $overrides);

it('registers a customer and signs them in', function () use ($register) {
    $response = $this->asGuest()->postJson('/api/v1/customer/auth/register', $register());

    $response->assertOk()->assertJsonPath('data.customer.attributes.fullName', 'Portal Person')
        ->assertJsonPath('data.customer.attributes.contactNumber', '09174445555');
    $token = $response->json('data.access_token');
    $this->withHeaders(['Authorization' => "Bearer {$token}", 'Accept' => 'application/json'])->getJson('/api/v1/customer/auth/me')->assertOk();
});

it('refuses a phone on a legacy profile without creating anything', function () use ($register) {
    Customer::query()->create(['full_name' => 'On File', 'contact_number' => '09174445555', 'barangay_id' => 1]);

    $this->asGuest()->postJson('/api/v1/customer/auth/register', $register())->assertStatus(422)
        ->assertJsonPath('errors.0.message', 'This number is already on file. Please ask the shop to set up your account.');
    expect(CustomerAccount::query()->count())->toBe(0);

    $weak = $this->asGuest()->postJson('/api/v1/customer/auth/register', $register(['contact_number' => '09170000000', 'password' => 'short', 'password_confirmation' => 'other']));
    expect(array_column($weak->json('errors'), 'message', 'source'))->toMatchArray([
        'password' => 'Use at least 8 characters.',
        'password_confirmation' => 'The passwords do not match.',
    ]);
});

it('throttles customer sign-in after five failures a minute', function () {
    $this->customerWithAccount([], 'slow@example.com');
    foreach (range(1, 5) as $_) {
        $this->asGuest()->postJson('/api/v1/customer/auth/login', ['email' => 'slow@example.com', 'password' => 'bad'])->assertStatus(401);
    }
    $this->asGuest()->postJson('/api/v1/customer/auth/login', ['email' => 'slow@example.com', 'password' => 'password123'])->assertStatus(429)
        ->assertJsonPath('errors.0.message', 'Too many sign-in attempts. Please wait a minute and try again.');
});

it('shows a customer their own orders only; another customer\'s answers 404', function () {
    $mine = $this->customerWithAccount();
    $theirs = $this->customerWithAccount();
    $myOrder = Order::query()->find($this->createOrder(customer: $mine, payment: ['amountCents' => 5000, 'paymentMethod' => 'cash']));
    $theirOrder = Order::query()->find($this->createOrder(customer: $theirs));
    Payment::query()->where('order_id', $myOrder->id)->update(['voided_at' => now(), 'voided_by' => 1, 'void_reason' => 'x']);
    $this->asStaff()->postJson("/api/v1/orders/{$myOrder->id}/payments", ['data' => ['attributes' => ['amountCents' => 3000, 'paymentMethod' => 'cash']]]);
    $myOrder->update(['notes' => 'Internal staff note']);

    $list = $this->asCustomer($mine->account)->getJson('/api/v1/customer/orders')->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('meta.active', 1)->assertJsonPath('meta.completed', 0);
    expect($list->json('data.0.id'))->toBe($myOrder->order_number);

    $detail = $this->asCustomer($mine->account)->getJson("/api/v1/customer/orders/{$myOrder->order_number}")->assertOk()
        ->assertJsonCount(1, 'data.includes.payments')
        ->assertJsonPath('data.includes.payments.0.attributes.amountCents', 3000)
        ->assertJsonPath('data.attributes.timeline.0.status', 'received');
    $json = json_encode($detail->json());
    expect($json)->not->toContain('Liza Ramos')->not->toContain('Internal staff note')->not->toContain('qrToken');

    $this->asCustomer($mine->account)->getJson("/api/v1/customer/orders/{$theirOrder->order_number}")->assertNotFound();
    $this->asCustomer($mine->account)->getJson('/api/v1/customer/orders/LF-000000-0000')->assertNotFound();
});

it('lets a customer change only their phone, barangay and street', function () {
    $customer = $this->customerWithAccount(['full_name' => 'Keep Name']);

    $this->asCustomer($customer->account)->patchJson('/api/v1/customer/account', ['data' => [
        'attributes' => ['contactNumber' => '0917 222 3333', 'fullName' => 'Changed', 'streetAddress' => 'Purok 9'],
        'relationships' => ['barangay' => ['data' => ['id' => 5]]],
    ]])->assertOk()->assertJsonPath('data.customer.attributes.contactNumber', '09172223333')
        ->assertJsonPath('data.customer.attributes.fullName', 'Keep Name')
        ->assertJsonPath('data.customer.attributes.barangayId', 5);
});

it('requires a temporary password to be changed before anything else', function () {
    $customer = $this->customerWithAccount();
    CustomerAccount::query()->where('customer_id', $customer->id)->update(['must_change_password' => true]);

    $this->asCustomer($customer->account)->getJson('/api/v1/customer/orders')->assertStatus(403);
    $this->asCustomer($customer->account)->getJson('/api/v1/customer/auth/me')->assertOk()->assertJsonPath('data.customer.attributes.mustChangePassword', true);
    $this->asCustomer($customer->account)->putJson('/api/v1/customer/account/password', [
        'current_password' => 'password123', 'password' => 'password123', 'password_confirmation' => 'password123',
    ])->assertStatus(422)->assertJsonPath('errors.0.message', 'Choose a password different from the current one.');
    $this->asCustomer($customer->account)->putJson('/api/v1/customer/account/password', [
        'current_password' => 'password123', 'password' => 'fresh12345', 'password_confirmation' => 'fresh12345',
    ])->assertOk()->assertJsonPath('data.customer.attributes.mustChangePassword', false);
    $this->asCustomer($customer->account)->getJson('/api/v1/customer/orders')->assertOk();
});

it('gives customers no way to write orders, statuses, payments or baskets', function () {
    $customer = $this->customerWithAccount();
    $order = $this->createOrder(customer: $customer);

    foreach ([
        ['post', '/api/v1/orders'], ['post', "/api/v1/orders/{$order}/status"], ['post', "/api/v1/orders/{$order}/payments"],
        ['post', '/api/v1/baskets'], ['patch', "/api/v1/orders/{$order}"],
    ] as [$method, $url]) {
        $this->asCustomer($customer->account)->json($method, $url, [])->assertStatus(401);
    }
    $this->asCustomer($customer->account)->postJson('/api/v1/customer/orders', [])->assertStatus(405);
});

it('shows a customer their own notifications only', function () {
    $mine = $this->customerWithAccount();
    $other = $this->customerWithAccount();
    $this->createOrder(customer: $mine);
    $this->createOrder(customer: $other);
    $otherNotice = Notification::query()->where('customer_id', $other->id)->value('id');

    $this->asCustomer($mine->account)->getJson('/api/v1/customer/notifications')->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('meta.unread', 1)
        ->assertJsonPath('data.0.attributes.orderNumber', Order::query()->where('customer_id', $mine->id)->value('order_number'));
    $this->asCustomer($mine->account)->postJson("/api/v1/customer/notifications/{$otherNotice}/read")->assertNotFound();
});
