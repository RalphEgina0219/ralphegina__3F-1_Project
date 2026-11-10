<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Orders and everything recorded about them. None of these rows is ever deleted: foreign keys
 * restrict deletes, and there are no DELETE routes for them.
 */
return new class extends Migration
{
    public function up(): void
    {
        // One row per Manila day: the last order number issued that day (LF-YYMMDD-NNNN).
        Schema::create('order_sequences', function (Blueprint $table) {
            $table->date('sequence_date')->primary();
            $table->unsignedInteger('last_number');
        });

        // A single row holding the last official receipt number issued (OR-000201 …).
        Schema::create('receipt_sequences', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->unsignedInteger('last_number');
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 20)->unique();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('current_status_id')->constrained('order_statuses')->restrictOnDelete();
            $table->foreignId('received_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('received_at');
            // Shown as "Estimated completion".
            $table->timestamp('promised_at');
            // Set when the order reaches Completed (code released).
            $table->timestamp('released_at')->nullable();
            $table->text('notes')->nullable();
            // No stored totals: totals and balances are computed from items and payments.
            $table->timestamps();

            $table->index('received_at');
            $table->index('current_status_id');
            $table->index(['customer_id', 'received_at']);
            $table->index(['current_status_id', 'promised_at']);
            $table->index(['received_by', 'received_at']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->foreignId('service_id')->constrained()->restrictOnDelete();
            $table->decimal('weight_kg', 6, 1)->nullable();
            $table->unsignedInteger('quantity')->nullable();
            // Frozen at order time, so later rate changes never alter an old order.
            $table->unsignedInteger('unit_price_cents');
            $table->unsignedInteger('subtotal_cents');

            $table->index(['order_id', 'service_id']);
        });

        Schema::create('order_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->foreignId('from_status_id')->nullable()->constrained('order_statuses')->restrictOnDelete();
            $table->foreignId('to_status_id')->constrained('order_statuses')->restrictOnDelete();
            $table->foreignId('changed_by')->constrained('users')->restrictOnDelete();
            $table->string('note')->nullable();
            $table->timestamp('changed_at');

            $table->index(['order_id', 'changed_at']);
            $table->index(['order_id', 'to_status_id', 'changed_at']);
            $table->index(['changed_by', 'changed_at']);
        });

        Schema::create('order_baskets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->foreignId('basket_id')->constrained()->restrictOnDelete();
            $table->timestamp('assigned_at');
            $table->foreignId('assigned_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('released_at')->nullable();

            $table->index('order_id');
        });

        // One active order per basket, enforced by the database: 1 while open, NULL once released.
        // MySQL allows many NULLs in a unique index, so a basket keeps any number of closed rows.
        DB::statement('ALTER TABLE order_baskets ADD active_flag TINYINT AS (IF(released_at IS NULL, 1, NULL)) STORED');
        DB::statement('ALTER TABLE order_baskets ADD UNIQUE order_baskets_basket_active_unique (basket_id, active_flag)');

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->foreignId('payment_method_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('amount_cents');
            // The GCash reference number. Required for GCash, null for cash.
            $table->string('reference_number', 50)->nullable();
            // The official receipt (OR) number.
            $table->string('receipt_number', 20)->unique();
            $table->foreignId('received_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('paid_at');
            // A voided payment stays on record; it no longer counts towards the paid amount.
            $table->timestamp('voided_at')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('void_reason')->nullable();

            $table->index(['paid_at', 'voided_at']);
            $table->index(['received_by', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_baskets');
        Schema::dropIfExists('order_status_history');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('receipt_sequences');
        Schema::dropIfExists('order_sequences');
    }
};
