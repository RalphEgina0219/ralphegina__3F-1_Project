<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Supplies (stock is computed from movements), notifications, the shop profile and the audit log.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('label', 50);
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->foreignId('unit_id')->constrained()->restrictOnDelete();
            $table->decimal('reorder_level', 10, 3);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('inventory_items')->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            // in adds, out subtracts, adjust carries its own sign.
            $table->enum('type', ['in', 'out', 'adjust']);
            $table->decimal('quantity', 10, 3);
            $table->string('remarks')->nullable();
            $table->timestamp('moved_at');

            $table->index(['item_id', 'moved_at']);
            $table->index('moved_at');
        });

        // In-app notices. Staff notices have no customer; customer notices are for one customer.
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->enum('recipient_type', ['staff', 'customer']);
            $table->foreignId('customer_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->restrictOnDelete();
            // staff: ready_for_pickup, low_stock; customer: order_received, status_changed, ready_for_pickup
            $table->string('type', 30);
            $table->string('channel', 20)->default('in_app');
            $table->string('message');
            $table->string('status', 20)->default('recorded');
            $table->timestamp('sent_at');
            $table->timestamp('read_at')->nullable();

            $table->index(['recipient_type', 'sent_at']);
            $table->index(['customer_id', 'read_at']);
        });

        // A single row (id = 1).
        Schema::create('shop_settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->string('name');
            $table->string('address');
            $table->string('contact_number', 50)->default('');
            $table->string('opening_hours')->default('');
            // The closing note of every order summary.
            $table->string('receipt_footer', 500)->default('');
            $table->unsignedSmallInteger('claim_policy_days')->default(30);
            $table->timestamps();
        });
        DB::statement('ALTER TABLE shop_settings ADD CONSTRAINT shop_settings_single_row CHECK (id = 1)');

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            // Null for actions by a customer or the system.
            $table->foreignId('user_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('action', 50);
            $table->string('auditable_type', 50);
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamp('created_at');

            $table->index('created_at');
            $table->index(['auditable_type', 'auditable_id']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('shop_settings');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('units');
    }
};
