<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Customers: their barangay, their profile, and the account they sign in to the portal with.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barangays', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            // Always stored normalized as 09XXXXXXXXX, so the unique index catches duplicates.
            $table->char('contact_number', 11)->unique();
            $table->foreignId('barangay_id')->constrained()->restrictOnDelete();
            $table->string('street_address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('full_name');
        });

        Schema::create('customer_accounts', function (Blueprint $table) {
            $table->id();
            // 1:1 with customers. A customer without a row is a legacy profile.
            $table->foreignId('customer_id')->unique()->constrained()->restrictOnDelete();
            // Stored lower-case, so uniqueness is case-insensitive.
            $table->string('email')->unique();
            $table->string('password');
            $table->boolean('is_active')->default(true);
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_accounts');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('barangays');
    }
};
