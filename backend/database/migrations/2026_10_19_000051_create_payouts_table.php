<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('vendor_id');
            $table->bigInteger('contract_id')->nullable();
            $table->bigInteger('payment_order_id')->nullable();
            $table->string('gateway', 24)->default('asaas');
            $table->string('gateway_payout_id', 80)->nullable();
            $table->bigInteger('gross_amount_cents');
            $table->bigInteger('platform_fee_cents')->default(0);
            $table->bigInteger('processing_fee_cents')->default(0);
            $table->bigInteger('net_amount_cents');
            $table->string('status', 24)->default('ELIGIBLE');
            $table->dateTime('eligible_at', 6)->nullable();
            $table->dateTime('paid_at', 6)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
