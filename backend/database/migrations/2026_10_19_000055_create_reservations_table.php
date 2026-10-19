<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('amenity_id');
            $table->bigInteger('unit_id')->nullable();
            $table->bigInteger('user_id')->nullable();
            $table->string('date', 12);
            $table->string('start_time', 8);
            $table->string('end_time', 8);
            $table->bigInteger('guests')->nullable()->default(0);
            $table->json('guest_list')->nullable();
            $table->bigInteger('total_cents')->nullable()->default(0);
            $table->bigInteger('deposit_cents')->nullable()->default(0);
            $table->string('payment_status', 24)->nullable()->default('not_required');
            $table->string('status', 24)->default('pendente');
            $table->longText('rejection_reason')->nullable();
            $table->longText('cancellation_reason')->nullable();
            $table->dateTime('cancelled_at', 6)->nullable();
            $table->dateTime('approved_at', 6)->nullable();
            $table->bigInteger('approved_by_id')->nullable();
            $table->boolean('rules_accepted')->nullable()->default(true);
            $table->string('qr_token', 40)->nullable();
            $table->dateTime('checkin_at', 6)->nullable();
            $table->longText('notes')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
