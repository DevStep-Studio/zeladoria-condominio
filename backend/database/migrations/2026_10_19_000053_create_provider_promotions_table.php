<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_promotions', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('vendor_id');
            $table->bigInteger('plan_id')->nullable();
            $table->string('type', 40)->default('categoria');
            $table->string('category_id', 60)->nullable();
            $table->string('region', 160)->nullable();
            $table->dateTime('starts_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('ends_at', 6);
            $table->string('status', 24)->default('ACTIVE');
            $table->bigInteger('amount_cents')->default(0);
            $table->string('payment_status', 24)->default('paid');
            $table->bigInteger('impressions')->default(0);
            $table->bigInteger('clicks')->default(0);
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_promotions');
    }
};
