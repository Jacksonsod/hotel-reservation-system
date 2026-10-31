<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('checkouts', function (Blueprint $table) {
            $table->id('checkout_id');
            $table->foreignId('reservation_id')->unique()->constrained('reservations', 'reservation_id')->cascadeOnDelete();
            $table->foreignId('receptionist_id')->constrained('users', 'user_id')->restrictOnDelete();
            $table->dateTime('checkout_time');
            $table->decimal('room_charges', 12, 2);
            $table->decimal('additional_charges', 12, 2)->default(0);
            $table->decimal('discounts', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('checkouts');
    }
};
