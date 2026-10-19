<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('visitor_id');
            $table->bigInteger('unit_id')->nullable();
            $table->bigInteger('host_user_id')->nullable();
            $table->string('purpose', 160)->nullable();
            $table->string('status', 24)->default('aguardando');
            $table->string('qr_token', 48);
            $table->dateTime('valid_from', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('valid_until', 6);
            $table->bigInteger('authorized_by_id')->nullable();
            $table->dateTime('authorized_at', 6)->nullable();
            $table->longText('denied_reason')->nullable();
            $table->dateTime('checkin_at', 6)->nullable();
            $table->bigInteger('checkin_by_id')->nullable();
            $table->dateTime('checkout_at', 6)->nullable();
            $table->bigInteger('checkout_by_id')->nullable();
            $table->string('vehicle_plate', 16)->nullable();
            $table->longText('notes')->nullable();
            $table->bigInteger('created_by_id')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
