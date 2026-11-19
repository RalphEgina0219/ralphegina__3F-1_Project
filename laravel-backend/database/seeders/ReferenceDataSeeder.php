<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * The fixed rows every installation needs, with the same ids and values as the frontend's
 * mocks/seed.ts: roles and permissions, the four staff accounts, the 36 barangays of Bongabong,
 * the six statuses, payment methods, services, units, supply items and the shop profile.
 *
 * Demo password for every account: password123.
 */
class ReferenceDataSeeder extends Seeder
{
    public const BARANGAYS = [
        'Anilao', 'Aplaya', 'Bagong Bayan I', 'Bagong Bayan II', 'Batangan', 'Bukal', 'Camantigue',
        'Carmundo', 'Cawayan', 'Dayhagan', 'Formon', 'Hagan', 'Hagupit', 'Ipil', 'Kaligtasan',
        'Labasan', 'Labonan', 'Libertad', 'Lisap', 'Luna', 'Malitbog', 'Mapang', 'Masaguisi',
        'Mina de Oro', 'Morente', 'Ogbot', 'Orconuma', 'Poblacion', 'Pulosahi', 'Sagana',
        'San Isidro', 'San Jose', 'San Juan', 'Sigange', 'Sta. Cruz', 'Tawas',
    ];

    public const SERVICES = [
        [1, 'Wash-Dry-Fold', 'Regular, 24-hour turnaround', 'per_kg', 3500, 3, true],
        [2, 'Wash only', 'Customer dries at home', 'per_kg', 2500, 3, true],
        [3, 'Comforter / Blanket', 'Single or double size', 'per_piece', 15000, null, true],
        [4, 'Ironing', 'Shirts, uniforms, slacks', 'per_piece', 1500, null, true],
        [5, 'Express (same day)', 'Flat add-on per order', 'flat', 5000, null, true],
        [6, 'Dry cleaning', 'Not offered yet', 'per_piece', 12000, null, false],
    ];

    public const INVENTORY_ITEMS = [
        [1, 'Detergent powder', 1, 5],
        [2, 'Fabric conditioner', 2, 4],
        [3, 'Plastic laundry bags', 3, 50],
        [4, 'Liquid detergent', 2, 5],
        [5, 'Bleach', 2, 2],
        [6, 'Hangers', 3, 40],
        [7, 'Thermal receipt rolls', 4, 3],
        [8, 'QR tag stickers', 3, 100],
    ];

    /** The timestamp the reference rows carry (the demo seeder passes its own "opening day"). */
    public ?string $seededAt = null;

    public function run(): void
    {
        $at = $this->seededAt ?? now()->toDateTimeString();
        $password = Hash::make('password123');

        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'admin'],
            ['id' => 2, 'name' => 'staff'],
        ]);
        DB::table('permissions')->insert([
            ['id' => 1, 'code' => 'payments.record'],
            ['id' => 2, 'code' => 'inventory.stock_out'],
            ['id' => 3, 'code' => 'payments.void'],
        ]);
        // Staff may record payments and stock-out by default; voiding stays with the owner.
        DB::table('role_permission')->insert([
            ['role_id' => 2, 'permission_id' => 1],
            ['role_id' => 2, 'permission_id' => 2],
        ]);

        $users = [
            [1, 1, 'Liza Ramos', 'liza.ramos', true],
            [2, 2, 'Kevin Manalo', 'kevin.m', true],
            [3, 2, 'Aira Dimaculangan', 'aira.d', true],
            // Jessa left the shop: her account is disabled but stays on the history she made.
            [4, 2, 'Jessa Lopez', 'jessa.l', false],
        ];
        DB::table('users')->insert(array_map(fn ($u) => [
            'id' => $u[0],
            'role_id' => $u[1],
            'name' => $u[2],
            'username' => $u[3],
            'password' => $password,
            'is_active' => $u[4],
            'must_change_password' => false,
            'last_login_at' => null,
            'created_at' => $at,
            'updated_at' => $at,
        ], $users));

        DB::table('barangays')->insert(array_map(
            fn ($name, $index) => ['id' => $index + 1, 'name' => $name],
            self::BARANGAYS,
            array_keys(self::BARANGAYS),
        ));

        $labels = ['Received', 'Washing', 'Drying', 'Folding', 'Ready for Pickup', 'Completed'];
        $codes = ['received', 'washing', 'drying', 'folding', 'ready_for_pickup', 'released'];
        DB::table('order_statuses')->insert(array_map(
            fn ($code, $index) => ['id' => $index + 1, 'code' => $code, 'label' => $labels[$index], 'sort_order' => $index + 1],
            $codes,
            array_keys($codes),
        ));

        DB::table('payment_methods')->insert([
            ['id' => 1, 'code' => 'cash', 'label' => 'Cash'],
            ['id' => 2, 'code' => 'gcash', 'label' => 'GCash'],
            ['id' => 3, 'code' => 'maya', 'label' => 'Maya'],
        ]);

        DB::table('services')->insert(array_map(fn ($s) => [
            'id' => $s[0],
            'name' => $s[1],
            'description' => $s[2],
            'pricing_type' => $s[3],
            'rate_cents' => $s[4],
            'minimum_qty' => $s[5],
            'is_active' => $s[6],
            'created_at' => $at,
            'updated_at' => $at,
        ], self::SERVICES));

        DB::table('units')->insert([
            ['id' => 1, 'code' => 'kg', 'label' => 'Kilogram'],
            ['id' => 2, 'code' => 'L', 'label' => 'Liter'],
            ['id' => 3, 'code' => 'pcs', 'label' => 'Piece'],
            ['id' => 4, 'code' => 'rolls', 'label' => 'Roll'],
        ]);

        DB::table('inventory_items')->insert(array_map(fn ($i) => [
            'id' => $i[0],
            'name' => $i[1],
            'unit_id' => $i[2],
            'reorder_level' => $i[3],
            'is_active' => true,
            'created_at' => $at,
            'updated_at' => $at,
        ], self::INVENTORY_ITEMS));

        DB::table('shop_settings')->insert([
            'id' => 1,
            'name' => 'LaundryFlow',
            'address' => 'Brgy. Poblacion, Bongabong, Oriental Mindoro',
            'contact_number' => '[SHOP CONTACT NO.]',
            'opening_hours' => 'Open daily 7:00 AM – 7:00 PM',
            'receipt_footer' => "Salamat po! Unclaimed items after 30 days are the customer's responsibility.",
            'claim_policy_days' => 30,
            'created_at' => $at,
            'updated_at' => $at,
        ]);

        DB::table('receipt_sequences')->insert(['id' => 1, 'last_number' => 200]);

        // The five wash types (no soap assigned: the owner does that in Settings > Pricing & Usage).
        (new WashTypeReferenceSeeder)->run();
    }
}
