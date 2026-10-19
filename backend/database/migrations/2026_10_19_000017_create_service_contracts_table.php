<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_contracts', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('request_id');
            $table->bigInteger('quote_id');
            $table->bigInteger('quote_version')->default(1);
            $table->bigInteger('customer_id');
            $table->bigInteger('vendor_id');
            $table->string('service_title', 200);
            $table->longText('scope_description');
            $table->json('itemized_materials')->nullable();
            $table->bigInteger('labor_cents')->default(0);
            $table->bigInteger('materials_cents')->default(0);
            $table->bigInteger('other_costs_cents')->default(0);
            $table->bigInteger('discount_cents')->default(0);
            $table->bigInteger('inspection_discount_cents')->default(0);
            $table->bigInteger('total_cents');
            $table->bigInteger('commission_rate_snapshot');
            $table->bigInteger('platform_fee_cents');
            $table->bigInteger('net_vendor_cents');
            $table->bigInteger('warranty_days')->default(90);
            $table->string('contract_hash', 64);
            $table->string('terms_version', 20)->default('1.0');
            $table->dateTime('terms_accepted_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->string('user_ip', 60)->nullable();
            $table->longText('conditions')->nullable();
            $table->string('status', 30)->default('AWAITING_PAYMENT');
            $table->bigInteger('payment_order_id')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_contracts');
    }
};
