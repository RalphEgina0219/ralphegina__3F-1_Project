<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Soap used by orders is an inventory movement of the new type "usage", linked to its order, and
 * the shop gets the "block orders when soap stock is insufficient" switch (default off).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->foreignId('order_id')->nullable()->after('user_id')->constrained('orders')->restrictOnDelete();
            // What the order needed. quantity is what was actually deducted (never below zero stock).
            $table->decimal('required_quantity', 10, 3)->nullable()->after('quantity');
        });

        // Appending a value to an ENUM keeps every existing row as it is.
        DB::statement("ALTER TABLE inventory_movements MODIFY type ENUM('in','out','adjust','usage') NOT NULL");

        Schema::table('shop_settings', function (Blueprint $table) {
            $table->boolean('block_orders_on_low_soap')->default(false)->after('claim_policy_days');
        });
    }

    public function down(): void
    {
        if (DB::table('inventory_movements')->where('type', 'usage')->exists()) {
            throw new RuntimeException('Cannot roll back: orders have used soap (usage movements). Restore the database backup instead.');
        }

        Schema::table('shop_settings', function (Blueprint $table) {
            $table->dropColumn('block_orders_on_low_soap');
        });

        DB::statement("ALTER TABLE inventory_movements MODIFY type ENUM('in','out','adjust') NOT NULL");

        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('order_id');
            $table->dropColumn('required_quantity');
        });
    }
};
