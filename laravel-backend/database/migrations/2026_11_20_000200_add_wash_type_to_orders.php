<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Every order gets a wash type and the surcharge per kilo that was in force when it was made.
 * Existing orders are backfilled to "Regular washing" with no surcharge, so no total changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('wash_type_id')->nullable()->after('received_by')->constrained('wash_types')->restrictOnDelete();
            // Frozen at order time, like order_items.unit_price_cents.
            $table->unsignedInteger('wash_surcharge_per_kg_cents')->default(0)->after('wash_type_id');
        });

        $regular = DB::table('wash_types')->where('name', 'Regular washing')->value('id');
        if ($regular === null) {
            $regular = DB::table('wash_types')->insertGetId([
                'name' => 'Regular washing',
                'description' => 'Standard wash for everyday clothes.',
                'surcharge_per_kg_cents' => 0,
                'sort_order' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('orders')->whereNull('wash_type_id')->update([
            'wash_type_id' => $regular,
            'wash_surcharge_per_kg_cents' => 0,
        ]);

        // Required from now on (every row has a value, so this cannot fail).
        DB::statement('ALTER TABLE orders MODIFY wash_type_id BIGINT UNSIGNED NOT NULL');
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('wash_type_id');
            $table->dropColumn('wash_surcharge_per_kg_cents');
        });
    }
};
