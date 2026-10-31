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
        Schema::create('maintenance_logs', function (Blueprint $table) {
            $table->id('maintenance_id');
            $table->foreignId('room_id')->constrained('rooms', 'room_id')->cascadeOnDelete();
            $table->foreignId('reported_by')->constrained('users', 'user_id')->restrictOnDelete();
            $table->text('issue_description');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent']);
            $table->enum('maintenance_status', ['pending', 'in_progress', 'resolved'])->default('pending');
            $table->dateTime('reported_at');
            $table->dateTime('resolved_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_logs');
    }
};
