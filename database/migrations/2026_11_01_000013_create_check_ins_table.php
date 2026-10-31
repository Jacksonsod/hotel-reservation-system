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
        Schema::create('check_ins', function (Blueprint $table) {
            $table->id('checkin_id');
            $table->foreignId('reservation_id')->unique()->constrained('reservations', 'reservation_id')->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('rooms', 'room_id')->restrictOnDelete();
            $table->foreignId('receptionist_id')->constrained('users', 'user_id')->restrictOnDelete();
            $table->dateTime('checkin_time');
            $table->text('special_requests')->nullable();
            $table->enum('status', ['checked_in', 'completed'])->default('checked_in');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('check_ins');
    }
};
