<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The service catalog, the six order statuses, payment methods, and the reusable QR baskets.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('description')->nullable();
            // per_kg: weight × rate (with a minimum); per_piece: quantity × rate; flat: once per order
            $table->enum('pricing_type', ['per_kg', 'per_piece', 'flat']);
            // Money is always whole centavos.
            $table->unsignedInteger('rate_cents');
            // Minimum billable kilograms (per_kg only).
            $table->decimal('minimum_qty', 6, 1)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('order_statuses', function (Blueprint $table) {
            $table->id();
            // received, washing, drying, folding, ready_for_pickup, released
            $table->string('code', 30)->unique();
            // The released stage is labelled "Completed".
            $table->string('label', 50);
            $table->unsignedTinyInteger('sort_order')->unique();
        });

        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('label', 50);
        });

        Schema::create('baskets', function (Blueprint $table) {
            $table->id();
            // BSK-0001 … never reused, even after a basket is retired.
            $table->string('basket_number', 20)->unique();
            // 32 random URL-safe characters, printed on the label. Never regenerated.
            $table->char('qr_token', 32)->unique();
            $table->string('label', 100)->nullable();
            // in_use is kept in sync with the open order_baskets row, in the same transaction.
            $table->enum('status', ['available', 'in_use', 'retired'])->default('available');
            $table->string('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('baskets');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('order_statuses');
        Schema::dropIfExists('services');
    }
};
