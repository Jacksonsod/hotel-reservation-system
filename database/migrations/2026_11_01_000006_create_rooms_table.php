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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id('room_id');
            $table->foreignId('hotel_id')->constrained('hotels', 'hotel_id')->cascadeOnDelete();
            $table->string('room_number', 30);
            $table->foreignId('room_type_id')->constrained('room_types', 'room_type_id')->restrictOnDelete();
            $table->decimal('price_per_night', 12, 2);
            $table->unsignedInteger('capacity');
            $table->text('description')->nullable();
            $table->enum('status', [
                'available',
                'reserved',
                'occupied',
                'dirty',
                'clean',
                'under_maintenance',
                'inactive',
            ])->default('available');
            $table->unique(['hotel_id', 'room_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
