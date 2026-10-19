<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('amenities', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('name', 120);
            $table->string('category', 40)->nullable()->default('outro');
            $table->longText('description')->nullable();
            $table->bigInteger('capacity')->nullable()->default(20);
            $table->bigInteger('fee_cents')->nullable()->default(0);
            $table->bigInteger('deposit_cents')->nullable()->default(0);
            $table->string('pricing_type', 24)->nullable()->default('gratis');
            $table->string('reservation_model', 24)->nullable()->default('horario_livre');
            $table->bigInteger('slot_duration_minutes')->nullable()->default(60);
            $table->longText('rules')->nullable();
            $table->json('images')->nullable();
            $table->json('features')->nullable();
            $table->string('open_time', 8)->nullable()->default('08:00');
            $table->string('close_time', 8)->nullable()->default('22:00');
            $table->json('days_schedule')->nullable();
            $table->bigInteger('interval_minutes')->nullable()->default(30);
            $table->json('blocked_days')->nullable();
            $table->bigInteger('max_hours')->nullable()->default(8);
            $table->bigInteger('min_advance_hours')->nullable()->default(2);
            $table->bigInteger('max_advance_days')->nullable()->default(60);
            $table->bigInteger('limit_per_unit')->nullable()->default(2);
            $table->string('limit_interval', 20)->nullable()->default('mes');
            $table->bigInteger('cancellation_deadline_hours')->nullable()->default(24);
            $table->boolean('request_guest_list')->nullable()->default(false);
            $table->boolean('requires_approval')->default(true);
            $table->boolean('active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('amenities');
    }
};
