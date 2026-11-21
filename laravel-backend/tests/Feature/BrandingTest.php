<?php

use App\Models\AuditLog;
use App\Models\Basket;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ShopSetting;
use App\Support\Branding;
use App\Support\ImageTools;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

describe('the public branding endpoint', function () {
    it('needs no sign-in and starts as exactly today\'s LaundryFlow look', function () {
        $response = $this->asGuest()->getJson('/api/v1/branding')->assertOk();

        $response->assertJsonPath('data.attributes.systemName', 'LaundryFlow')
            ->assertJsonPath('data.attributes.shortName', 'LaundryFlow')
            ->assertJsonPath('data.attributes.primaryColor', '#0e7490')
            ->assertJsonPath('data.attributes.accentColor', '#3dd6e8')
            ->assertJsonPath('data.attributes.sidebarColor', '#0b2e3f')
            ->assertJsonPath('data.attributes.buttonTextColor', '#ffffff')
            ->assertJsonPath('data.attributes.logoUrl', null)
            ->assertJsonPath('data.attributes.iconUrls', null)
            ->assertJsonPath('data.attributes.basketPrefix', 'BSK')
            ->assertJsonPath('data.attributes.payAtPickupEnabled', true)
            ->assertJsonPath('data.attributes.showPoweredBy', false)
            ->assertJsonPath('data.attributes.statusLabels.released', 'Completed')
            ->assertJsonPath('data.attributes.statusLabels.ready_for_pickup', 'Ready for Pickup');
        expect(collect($response->json('data.attributes.paymentMethods'))->pluck('code')->all())->toBe(['cash', 'gcash', 'maya']);
        expect($response->headers->get('ETag'))->not->toBeNull();
        expect($response->headers->get('Cache-Control'))->toContain('max-age=60');
    });

    it('holds nothing private, and the contact email only when the owner shows it', function () {
        ShopSetting::query()->update(['contact_email' => 'owner@shop.example', 'show_contact_email' => false]);
        Branding::flush();
        $json = json_encode($this->asGuest()->getJson('/api/v1/branding')->json());
        expect($json)->not->toContain('owner@shop.example')->not->toContain('setupChecklist')->not->toContain('password')->not->toContain('block_orders');

        $this->putBranding(['showContactEmail' => true])->assertOk();
        $this->asGuest()->getJson('/api/v1/branding')->assertJsonPath('data.attributes.shop.contactEmail', 'owner@shop.example');
    });

    it('answers 304 to an unchanged ETag and a new version after a change', function () {
        $first = $this->asGuest()->getJson('/api/v1/branding');
        $etag = $first->headers->get('ETag');
        $this->asGuest()->withHeaders(['If-None-Match' => $etag])->getJson('/api/v1/branding')->assertStatus(304);

        $this->putBranding(['systemName' => 'Suds & Co'])->assertOk();
        $second = $this->asGuest()->getJson('/api/v1/branding');
        expect($second->headers->get('ETag'))->not->toBe($etag);
        expect($second->json('data.attributes.version'))->not->toBe($first->json('data.attributes.version'));
    });
});

describe('Settings > Branding & Appearance', function () {
    it('lets the owner change the name and colors, writes the audit entry, and keeps staff and guests out', function () {
        $this->putBranding(['systemName' => 'Suds & Co', 'shortName' => 'Suds', 'tagline' => 'Fresh and fast', 'primaryColor' => '#7C3AED', 'accentColor' => '#F59E0B', 'sidebarColor' => '#1E1B4B'])->assertOk()
            ->assertJsonPath('data.attributes.primaryColor', '#7c3aed')
            ->assertJsonPath('data.attributes.systemName', 'Suds & Co');
        $this->asGuest()->getJson('/api/v1/branding')->assertJsonPath('data.attributes.shortName', 'Suds')->assertJsonPath('data.attributes.tagline', 'Fresh and fast');

        $log = AuditLog::query()->where('action', 'branding.updated')->latest('id')->firstOrFail();
        expect($log->new_values['summary'])->toContain('system name')->toContain('primary color');
        expect($log->old_values['system_name'])->toBe('LaundryFlow')->and($log->new_values['system_name'])->toBe('Suds & Co');

        $this->putBranding(['systemName' => 'Hacked'], 'kevin.m')->assertForbidden();
        $this->asStaff('kevin.m')->getJson('/api/v1/settings/branding')->assertForbidden();
        $this->asStaff('kevin.m')->postJson('/api/v1/settings/branding/reset')->assertForbidden();
        $this->asGuest()->putJson('/api/v1/settings/branding', ['data' => ['attributes' => ['systemName' => 'x']]])->assertUnauthorized();
        $customer = $this->customerWithAccount();
        $this->asCustomer($customer->account)->putJson('/api/v1/settings/branding', ['data' => ['attributes' => ['systemName' => 'x']]])->assertStatus(401);
    });

    it('validates hex colors, readable button text, lengths and the setup checklist', function () {
        $errors = fn (array $a) => $this->errorSources($this->putBranding($a)->assertUnprocessable());

        expect($errors(['primaryColor' => 'red']))->toContain('data.attributes.primaryColor');
        expect($errors(['primaryColor' => '#0e749']))->toContain('data.attributes.primaryColor');
        // Mid-grey: neither white nor dark text reaches 4.5:1 on it.
        expect($errors(['primaryColor' => '#777777']))->toContain('data.attributes.primaryColor');
        expect($errors(['shortName' => 'Thirteen char']))->toContain('data.attributes.shortName');
        expect($errors(['systemName' => '']))->toContain('data.attributes.systemName');
        expect($errors(['contactEmail' => 'not-an-email']))->toContain('data.attributes.contactEmail');
        expect($errors(['basketPrefix' => 'B']))->toContain('data.attributes.basketPrefix');
        // A light brand color is fine: it gets dark button text.
        $this->putBranding(['primaryColor' => '#f5c518'])->assertOk()->assertJsonPath('data.attributes.buttonTextColor', '#10242e');

        $this->asStaff()->putJson('/api/v1/settings/setup-checklist', ['data' => ['attributes' => ['key' => 'rates', 'done' => true]]])->assertOk();
        $checklist = collect($this->asStaff()->getJson('/api/v1/settings/branding')->json('data.attributes.setupChecklist'))->keyBy('key');
        expect($checklist['rates']['done'])->toBeTrue()->and($checklist['staff']['done'])->toBeFalse();
    });

    it('renames status labels without touching the codes, and refuses empty, duplicate or long ones', function () {
        $labels = ['received' => 'Dropped off', 'washing' => 'In the wash', 'drying' => 'Drying', 'folding' => 'Folding', 'ready_for_pickup' => 'Ready!', 'released' => 'Picked up'];
        $this->putBranding(['statusLabels' => $labels])->assertOk();

        $id = $this->createOrder();
        $this->moveTo($id, 'washing')->assertOk();
        $order = $this->asStaff()->getJson("/api/v1/orders/{$id}")->assertOk();
        $order->assertJsonPath('data.attributes.status', 'washing')->assertJsonPath('data.attributes.statusLabel', 'In the wash');
        // The customer's order, timeline and notifications use the shop's words too.
        $number = $order->json('data.attributes.orderNumber');
        $customer = Order::query()->findOrFail($id)->customer->account;
        $portal = $this->asCustomer($customer)->getJson("/api/v1/customer/orders/{$number}")->assertOk();
        $portal->assertJsonPath('data.attributes.statusLabel', 'In the wash')->assertJsonPath('data.attributes.timeline.5.label', 'Picked up')->assertJsonPath('data.attributes.timeline.5.status', 'released');
        expect($this->asCustomer($customer)->getJson('/api/v1/customer/notifications')->json('data.0.attributes.message'))->toContain('In the wash');

        $bad = fn (array $change) => $this->errorSources($this->putBranding(['statusLabels' => array_merge($labels, $change)])->assertUnprocessable());
        expect($bad(['washing' => '']))->toContain('data.attributes.statusLabels.washing');
        expect($bad(['washing' => 'Dropped off']))->toContain('data.attributes.statusLabels.washing');
        expect($bad(['washing' => str_repeat('x', 25)]))->toContain('data.attributes.statusLabels.washing');
    });

    it('turns payment methods off for new payments while old ones still show, and keeps one way to pay on', function () {
        $id = $this->createOrder([['serviceId' => 1, 'weightKg' => 5]]);
        $this->asStaff()->postJson("/api/v1/orders/{$id}/payments", ['data' => ['attributes' => ['amountCents' => 3000, 'paymentMethod' => 'maya', 'referenceNumber' => 'MY1']]])->assertCreated();

        $this->putBranding(['paymentMethods' => [['code' => 'maya', 'isActive' => false, 'label' => ''], ['code' => 'gcash', 'isActive' => true, 'label' => 'GCash (0917 555 0101)']]])->assertOk();

        $refused = $this->asStaff()->postJson("/api/v1/orders/{$id}/payments", ['data' => ['attributes' => ['amountCents' => 1000, 'paymentMethod' => 'maya', 'referenceNumber' => 'MY2']]])->assertUnprocessable();
        expect($this->firstError($refused))->toBe('Maya is turned off. Choose another way to pay.');
        $this->asStaff()->postJson("/api/v1/orders/{$id}/payments", ['data' => ['attributes' => ['amountCents' => 1000, 'paymentMethod' => 'gcash', 'referenceNumber' => 'G1']]])->assertCreated()
            ->assertJsonPath('data.includes.payments.0.attributes.methodLabel', 'GCash (0917 555 0101)');
        // The Maya payment from before still displays.
        $detail = $this->asStaff()->getJson("/api/v1/orders/{$id}")->json('data.includes.payments');
        expect(collect($detail)->pluck('attributes.methodLabel')->all())->toContain('Maya');
        expect(Payment::query()->count())->toBe(2);
        $public = $this->asGuest()->getJson('/api/v1/branding')->json('data.attributes.paymentMethods');
        expect(collect($public)->firstWhere('code', 'maya')['isActive'])->toBeFalse();

        // Everything off is refused.
        $all = fn () => $this->putBranding(['payAtPickupEnabled' => false, 'paymentMethods' => [['code' => 'cash', 'isActive' => false], ['code' => 'gcash', 'isActive' => false], ['code' => 'maya', 'isActive' => false]]]);
        expect($this->errorSources($all()->assertUnprocessable()))->toContain('data.attributes.paymentMethods');
        // Pay at pickup off, with Cash on: an order without a payment is asked to take one.
        $this->putBranding(['payAtPickupEnabled' => false, 'paymentMethods' => [['code' => 'cash', 'isActive' => true]]])->assertOk();
        $unpaid = $this->orderWith(null, [['serviceId' => 1, 'weightKg' => 4]], null, 'liza.ramos')->assertUnprocessable();
        expect($this->firstError($unpaid))->toBe('Pay at pickup is turned off. Record a payment with the order.');
    });

    it('applies the basket prefix to new baskets only and still scans the old ones', function () {
        $old = $this->baskets(1)[0];
        $oldNumber = Basket::query()->findOrFail($old)->basket_number;
        $this->putBranding(['basketPrefix' => 'sud'])->assertOk()->assertJsonPath('data.attributes.basketPrefix', 'SUD');

        $created = $this->asStaff()->postJson('/api/v1/baskets', ['data' => ['attributes' => ['count' => 2]]])->assertCreated();
        $numbers = collect($created->json('data'))->pluck('attributes.basketNumber')->all();
        expect($numbers)->toBe(['SUD-'.str_pad((string) ((int) preg_replace('/\D/', '', $oldNumber) + 1), 4, '0', STR_PAD_LEFT), 'SUD-'.str_pad((string) ((int) preg_replace('/\D/', '', $oldNumber) + 2), 4, '0', STR_PAD_LEFT)]);
        expect(Basket::query()->findOrFail($old)->basket_number)->toBe($oldNumber);
        $this->asStaff()->getJson('/api/v1/scan/'.$oldNumber)->assertOk()->assertJsonPath('data.basket.attributes.basketNumber', $oldNumber);
        $this->asStaff()->getJson('/api/v1/scan/'.$numbers[0])->assertOk();
    });

    it('resets to the LaundryFlow defaults, with confirmation done in the app', function () {
        Storage::fake('public');
        $this->putBranding(['systemName' => 'Suds', 'primaryColor' => '#7c3aed', 'basketPrefix' => 'SUD', 'paymentMethods' => [['code' => 'maya', 'isActive' => false, 'label' => 'PayMaya']]])->assertOk();
        $this->upload('logo', UploadedFile::fake()->image('logo.png', 300, 300))->assertOk();
        $files = Storage::disk('public')->allFiles('branding');
        expect($files)->not->toBeEmpty();

        $this->asStaff()->postJson('/api/v1/settings/branding/reset')->assertOk()
            ->assertJsonPath('data.attributes.systemName', 'LaundryFlow')->assertJsonPath('data.attributes.primaryColor', '#0e7490')
            ->assertJsonPath('data.attributes.basketPrefix', 'BSK')->assertJsonPath('data.attributes.logoUrl', null);
        expect(Storage::disk('public')->allFiles('branding'))->toBe([]);
        expect(collect($this->asGuest()->getJson('/api/v1/branding')->json('data.attributes.paymentMethods'))->firstWhere('code', 'maya'))->toMatchArray(['isActive' => true, 'label' => 'Maya']);
        expect(AuditLog::query()->where('action', 'branding.reset')->count())->toBe(1);
    });
});

describe('logo and icon uploads', function () {
    beforeEach(fn () => Storage::fake('public'));

    it('re-encodes the logo as a PNG under a hashed name and deletes the old file when it is replaced', function () {
        $first = $this->upload('logo', UploadedFile::fake()->image('Logo.JPG', 400, 300))->assertOk();
        $url = $first->json('data.attributes.logoUrl');
        expect($url)->toMatch('~^/storage/branding/logo-[a-f0-9]{10}\.png$~');
        $path = ltrim(str_replace('/storage/', '', $url), '/');
        $bytes = Storage::disk('public')->get($path);
        expect(substr($bytes, 0, 8))->toBe("\x89PNG\r\n\x1a\n");
        expect(strtolower($bytes))->not->toContain('exif');

        $second = $this->upload('logo', UploadedFile::fake()->image('other.png', 500, 500))->assertOk();
        expect($second->json('data.attributes.logoUrl'))->not->toBe($url);
        expect(Storage::disk('public')->exists($path))->toBeFalse();
        // The same bytes always get the same name; a different image never reuses one.
        expect(collect(Storage::disk('public')->allFiles('branding'))->filter(fn ($f) => str_contains($f, 'logo-'))->count())->toBe(1);

        $this->asStaff()->deleteJson('/api/v1/settings/branding/logo')->assertOk()->assertJsonPath('data.attributes.logoUrl', null);
        expect(Storage::disk('public')->allFiles('branding'))->toBe([]);
    });

    it('refuses SVG, other types, oversize files and images that are too small, and staff cannot upload', function () {
        $svg = UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><script>alert(1)</script></svg>');
        $this->upload('logo', $svg)->assertUnprocessable();
        // A script renamed to .png is judged by what it is, not by its name.
        $this->upload('logo', UploadedFile::fake()->createWithContent('logo.png', '<?php echo 1;'))->assertUnprocessable();
        $this->upload('logo', UploadedFile::fake()->create('huge.png', 3000, 'image/png'))->assertUnprocessable();
        $small = $this->upload('logo', UploadedFile::fake()->image('tiny.png', 100, 100))->assertUnprocessable();
        expect($this->firstError($small))->toContain('at least 128 px');
        $this->upload('logo', UploadedFile::fake()->image('logo.png', 300, 300), 'kevin.m')->assertForbidden();
        expect(Storage::disk('public')->allFiles('branding'))->toBe([]);
    });

    it('generates the PWA icons at their sizes from the app icon, and a maskable one on the primary color', function () {
        $this->putBranding(['primaryColor' => '#7c3aed'])->assertOk();
        $icon = $this->upload('icon', UploadedFile::fake()->image('icon.png', 600, 600))->assertOk();
        $urls = $icon->json('data.attributes.iconUrls');
        // MySQL keeps JSON keys in its own order: compare as a set.
        expect(collect(array_keys($urls))->map(fn ($k) => (string) $k)->sort()->values()->all())->toBe(['192', '512', 'apple', 'favicon16', 'favicon32', 'maskable']);
        $sizes = ['192' => 192, '512' => 512, 'apple' => 180, 'favicon32' => 32, 'favicon16' => 16, 'maskable' => 512];
        foreach ($sizes as $key => $size) {
            $path = ltrim(str_replace('/storage/', '', $urls[$key]), '/');
            [$w, $h, $type] = getimagesizefromstring(Storage::disk('public')->get($path));
            expect([$w, $h, $type])->toBe([$size, $size, IMAGETYPE_PNG]);
        }
        // The maskable icon's corner is the primary color, so a platform mask never shows a white edge.
        $mask = imagecreatefromstring(Storage::disk('public')->get(ltrim(str_replace('/storage/', '', $urls['maskable']), '/')));
        expect(imagecolorat($mask, 2, 2) & 0xFFFFFF)->toBe(0x7C3AED);

        $notSquare = $this->upload('icon', UploadedFile::fake()->image('icon.png', 700, 600))->assertUnprocessable();
        expect($this->firstError($notSquare))->toContain('square');
        $this->upload('icon', UploadedFile::fake()->image('icon.png', 300, 300))->assertUnprocessable();

        // Changing the primary color rebuilds the maskable icon and removes the old files.
        $before = Storage::disk('public')->allFiles('branding');
        $this->putBranding(['primaryColor' => '#b91c1c'])->assertOk();
        expect(Storage::disk('public')->allFiles('branding'))->toHaveCount(count($before));
        expect(Storage::disk('public')->allFiles('branding'))->not->toBe($before);
    });

    it('makes the icons from the logo when there is no icon, and serves them through Laravel with no symlink', function () {
        $logo = $this->upload('logo', UploadedFile::fake()->image('logo.png', 400, 400))->assertOk();
        $iconUrl = $logo->json('data.attributes.iconUrls.512');
        expect($iconUrl)->toMatch('~^/storage/branding/icon-512-[a-f0-9]{10}\.png$~');

        $file = $this->get($iconUrl)->assertOk();
        expect($file->headers->get('Content-Type'))->toBe('image/png');
        expect($file->headers->get('Cache-Control'))->toContain('immutable');
        $this->get('/storage/branding/missing-0123456789.png')->assertNotFound();
        expect($this->get('/storage/branding/'.rawurlencode('..%2F.env'))->status())->toBeIn([403, 404]);
    });
});

describe('the dynamic web app manifest', function () {
    it('comes from the settings, is never cached, and falls back to the default icons', function () {
        $manifest = $this->get('/manifest.webmanifest')->assertOk();
        expect($manifest->headers->get('Content-Type'))->toContain('application/manifest+json');
        expect($manifest->headers->get('Cache-Control'))->toContain('no-cache');
        $manifest->assertJsonPath('name', 'LaundryFlow')->assertJsonPath('short_name', 'LaundryFlow')->assertJsonPath('theme_color', '#0b2e3f')
            ->assertJsonPath('icons.0.src', '/pwa-192x192.png')->assertJsonPath('icons.2.purpose', 'maskable');

        Storage::fake('public');
        $this->putBranding(['systemName' => 'Suds & Co', 'shortName' => 'Suds', 'tagline' => 'Fresh and fast', 'sidebarColor' => '#1e1b4b'])->assertOk();
        $this->upload('icon', UploadedFile::fake()->image('icon.png', 512, 512))->assertOk();
        $custom = $this->get('/manifest.webmanifest')->assertOk();
        $custom->assertJsonPath('name', 'Suds & Co — Fresh and fast')->assertJsonPath('short_name', 'Suds')->assertJsonPath('theme_color', '#1e1b4b');
        expect($custom->json('icons.0.src'))->toStartWith('/storage/branding/icon-192-')->and($custom->json('icons.2.src'))->toStartWith('/storage/branding/icon-maskable-');
    });
});

describe('the install command', function () {
    it('names the shop and can be run again', function () {
        $this->artisan('laundryflow:install', ['--system-name' => 'Suds & Co Laundry', '--shop-name' => 'Suds Laundry, Calapan'])->assertSuccessful();

        $settings = ShopSetting::current();
        expect($settings->system_name)->toBe('Suds & Co Laundry')->and($settings->short_name)->toBe('Suds & Co La')->and($settings->name)->toBe('Suds Laundry, Calapan');
        $this->artisan('laundryflow:install', ['--system-name' => 'Suds & Co Laundry', '--shop-name' => 'Suds Laundry, Calapan'])->assertSuccessful();
        expect(ImageTools::DIR)->toBe('branding');
    });
});
