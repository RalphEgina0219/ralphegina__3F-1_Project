<?php

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\CustomerAccount;
use Illuminate\Support\Facades\Hash;

$body = fn (array $attributes, int $barangay = 28) => ['data' => [
    'attributes' => $attributes,
    'relationships' => ['barangay' => ['data' => ['id' => $barangay]]],
]];

it('registers a customer at the counter with a temporary password, shown once', function () use ($body) {
    $response = $this->asStaff('kevin.m')->postJson('/api/v1/customers', $body([
        'fullName' => '  Juan   Dela Cruz ',
        'contactNumber' => '+63 917 555 0101',
        'email' => 'Juan.DelaCruz@Example.com',
    ]));

    $response->assertCreated()
        ->assertJsonPath('data.customer.attributes.fullName', 'Juan Dela Cruz')
        ->assertJsonPath('data.customer.attributes.contactNumber', '09175550101')
        ->assertJsonPath('data.customer.attributes.hasAccount', true)
        ->assertJsonPath('data.customer.attributes.account.mustChangePassword', true)
        ->assertJsonPath('data.customer.relationships.barangay.data.id', 28);

    $password = $response->json('data.temporaryPassword');
    expect($password)->toMatch('/^[a-z2-9]{10}$/');
    $account = CustomerAccount::query()->where('email', 'juan.delacruz@example.com')->firstOrFail();
    expect(Hash::check($password, $account->password))->toBeTrue();
    expect($account->password)->not->toBe($password);
    // Never logged: the audit rows name the customer, not the password.
    expect(AuditLog::query()->get()->pluck('new_values')->flatten()->all())->not->toContain($password);
});

it('validates with the counter wording and the course error format', function () use ($body) {
    $this->customerWithAccount(['contact_number' => '09170000001'], 'taken@example.com');

    $response = $this->asStaff()->postJson('/api/v1/customers', $body([
        'fullName' => 'A', 'contactNumber' => '0917 000 0001', 'email' => 'TAKEN@example.com',
    ], 999));

    $response->assertStatus(422);
    $messages = array_column($response->json('errors'), 'message', 'source');
    expect($messages)->toBe([
        'data.attributes.fullName' => 'Enter the full name.',
        'data.attributes.contactNumber' => 'A customer with this contact number already exists.',
        'data.relationships.barangay.data.id' => 'Choose a barangay.',
        'data.attributes.email' => 'This email is already registered.',
    ]);
});

it('lists customers with their totals and searches by name, email or phone digits', function () {
    $this->customerWithAccount(['full_name' => 'Rosa Magtanggol', 'contact_number' => '09281234567'], 'rosa@example.com');

    $this->asStaff()->getJson('/api/v1/customers?search=magtang')->assertOk()->assertJsonPath('data.0.attributes.fullName', 'Rosa Magtanggol')
        ->assertJsonPath('data.0.attributes.ordersCount', 0)
        ->assertJsonPath('data.0.attributes.balanceCents', 0)
        ->assertJsonStructure(['data', 'links', 'meta' => ['current_page', 'last_page', 'per_page', 'total', 'withBalance']]);
    $this->asStaff()->getJson('/api/v1/customers?search=rosa@')->assertJsonCount(1, 'data');
    $this->asStaff()->getJson('/api/v1/customers?search=1234567')->assertJsonCount(1, 'data');
});

it('replaces with PUT (every field) and updates with PATCH (fields sent)', function () use ($body) {
    $customer = $this->customerWithAccount();

    $this->asStaff()->putJson("/api/v1/customers/{$customer->id}", ['data' => ['attributes' => ['fullName' => 'Only Name']]])->assertStatus(422);
    $this->asStaff()->patchJson("/api/v1/customers/{$customer->id}", ['data' => ['attributes' => ['notes' => 'Call first']]])
        ->assertOk()->assertJsonPath('data.attributes.notes', 'Call first')->assertJsonPath('data.attributes.fullName', $customer->full_name);
    $this->asStaff()->putJson("/api/v1/customers/{$customer->id}", $body(['fullName' => 'New Name', 'contactNumber' => $customer->contact_number]))
        ->assertOk()->assertJsonPath('data.attributes.fullName', 'New Name');
});

it('creates an account for a legacy profile once, and resets its password', function () {
    $legacy = Customer::query()->create(['full_name' => 'Legacy Person', 'contact_number' => '09170001111', 'barangay_id' => 1]);
    $body = ['data' => ['attributes' => ['email' => 'legacy@example.com']]];

    $this->asStaff()->postJson("/api/v1/customers/{$legacy->id}/account", $body)->assertCreated()->assertJsonPath('data.customer.attributes.hasAccount', true);
    $this->asStaff()->postJson("/api/v1/customers/{$legacy->id}/account", ['data' => ['attributes' => ['email' => 'other@example.com']]])
        ->assertStatus(409)->assertJsonPath('errors.0.message', 'This customer already has an account.');

    $reset = $this->asStaff()->postJson("/api/v1/customers/{$legacy->id}/reset-password")->assertOk();
    expect(Hash::check($reset->json('data.temporaryPassword'), CustomerAccount::query()->where('customer_id', $legacy->id)->value('password')))->toBeTrue();

    $noAccount = Customer::query()->create(['full_name' => 'No Account', 'contact_number' => '09170002222', 'barangay_id' => 1]);
    $this->asStaff()->postJson("/api/v1/customers/{$noAccount->id}/reset-password")->assertStatus(409);
});

it('lets only the owner disable a customer sign-in', function () {
    $customer = $this->customerWithAccount();
    $body = ['data' => ['attributes' => ['isActive' => false]]];

    $this->asStaff('kevin.m')->patchJson("/api/v1/customers/{$customer->id}/account", $body)->assertStatus(403);
    $this->asStaff()->patchJson("/api/v1/customers/{$customer->id}/account", $body)->assertOk()->assertJsonPath('data.attributes.account.isActive', false);
});

it('answers 404 for a customer that does not exist', function () {
    $this->asStaff()->getJson('/api/v1/customers/999999')->assertNotFound()
        ->assertJsonPath('errors.0.source', Customer::class);
});
