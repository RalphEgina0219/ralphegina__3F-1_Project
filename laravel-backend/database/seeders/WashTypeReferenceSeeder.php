<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * The reference data the wash types feature needs, safe to run on a live database any number of
 * times: the five wash types (by name), the units L, kg and pcs and the Cash, GCash and Maya
 * payment methods (by code). It only inserts what is missing and never touches a row that exists,
 * so nothing the owner edited (a renamed wash type, a surcharge, a soap assignment) is changed.
 * No soap items are created: the owner adds the real brands.
 *
 *   php artisan db:seed --class=WashTypeReferenceSeeder --force
 *
 * The migration 2026_11_20_000100_create_wash_types already inserts the same rows on an existing
 * install, so on production this is a safe re-check.
 */
class WashTypeReferenceSeeder extends Seeder
{
    /** [name, description] in display order. */
    public const WASH_TYPES = [
        ['Regular washing', 'Standard wash for everyday clothes.'],
        ['Colored clothes', 'Color-safe wash that protects dyes.'],
        ['Softness and fragrance', 'Extra softener and scent.'],
        ['Stain removal', 'Pre-treated for everyday stains.'],
        ['Tough stains', 'Heavy-duty treatment for stubborn stains.'],
    ];

    public const UNITS = [['kg', 'Kilogram'], ['L', 'Liter'], ['pcs', 'Piece']];

    public const PAYMENT_METHODS = [['cash', 'Cash'], ['gcash', 'GCash'], ['maya', 'Maya']];

    public function run(): void
    {
        $now = now();

        foreach (self::WASH_TYPES as $index => [$name, $description]) {
            if (! DB::table('wash_types')->where('name', $name)->exists()) {
                DB::table('wash_types')->insert([
                    'name' => $name,
                    'description' => $description,
                    'surcharge_per_kg_cents' => 0,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        foreach (self::UNITS as [$code, $label]) {
            if (! DB::table('units')->where('code', $code)->exists()) {
                DB::table('units')->insert(['code' => $code, 'label' => $label]);
            }
        }

        foreach (self::PAYMENT_METHODS as [$code, $label]) {
            if (! DB::table('payment_methods')->where('code', $code)->exists()) {
                DB::table('payment_methods')->insert(['code' => $code, 'label' => $label]);
            }
        }
    }
}
