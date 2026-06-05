<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('product_name', 150);
            $table->decimal('quantity', 10, 4);
            $table->decimal('original_quantity', 10, 4);
            $table->string('unit', 30)->default('pcs');
            $table->enum('storage_location', ['freezer', 'chiller', 'room_temp'])->default('room_temp');
            $table->date('expiration_date');
            $table->enum('urgency_status', ['green', 'yellow', 'red'])->default('green');
            $table->boolean('is_scalable')->default(false);
            $table->timestamps();

            // Index for fast dashboard queries sorted by urgency
            $table->index(['user_id', 'urgency_status']);
            $table->index('expiration_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_items');
    }
};
