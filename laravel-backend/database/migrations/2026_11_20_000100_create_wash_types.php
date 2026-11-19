<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wash types (how the laundry is washed) and which supplies each one uses.
 *
 * Safe on a live database: it only adds tables and inserts missing reference rows (by name or
 * code), and never touches a row that already exists.
 */
return new class extends Migration
{
    /** [name, description] in display order. */
    private const WASH_TYPES = [
        ['Regular washing', 'Standard wash for everyday clothes.'],
        ['Colored clothes', 'Color-safe wash that protects dyes.'],
        ['Softness and fragrance', 'Extra softener and scent.'],
        ['Stain removal', 'Pre-treated for everyday stains.'],
        ['Tough stains', 'Heavy-duty treatment for stubborn stains.'],
    ];

    public function up(): void
    {
        Schema::create('wash_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('description')->nullable();
            // Optional extra charge per kilo of per-kg laundry, in centavos. 0 = no extra charge.
            $table->unsignedInteger('surcharge_per_kg_cents')->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('wash_type_supplies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wash_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->restrictOnDelete();
            // Per kilo of laundry, in the item's SMALL unit: grams for kg items, millilitres for L
            // items, pieces for pcs items. 25 = 25 g/kg of a kg item.
            $table->decimal('usage_per_kg_small_unit', 10, 3);
            $table->timestamps();

            $table->unique(['wash_type_id', 'inventory_item_id']);
        });

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

        // On an existing install these tables already hold rows: add what is missing. On an empty
        // database the seeder inserts them with their fixed ids, so nothing is added here.
        if (DB::table('payment_methods')->exists() && ! DB::table('payment_methods')->where('code', 'maya')->exists()) {
            DB::table('payment_methods')->insert(['code' => 'maya', 'label' => 'Maya']);
        }
        if (DB::table('units')->exists()) {
            foreach ([['kg', 'Kilogram'], ['L', 'Liter'], ['pcs', 'Piece']] as [$code, $label]) {
                if (! DB::table('units')->where('code', $code)->exists()) {
                    DB::table('units')->insert(['code' => $code, 'label' => $label]);
                }
            }
        }
    }

    public function down(): void
    {
        // The Maya method and the units may already be used by payments and items: left in place.
        Schema::dropIfExists('wash_type_supplies');
        Schema::dropIfExists('wash_types');
    }
};
