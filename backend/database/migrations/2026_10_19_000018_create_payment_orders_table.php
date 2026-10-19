<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_orders', function (Blueprint $table): void {
            $table->id('id');
            $table->string('code', 32)->unique();
            $table->bigInteger('condo_id');
            $table->bigInteger('request_id');
            $table->bigInteger('contract_id')->nullable();
            $table->bigInteger('quote_id')->nullable();
            $table->bigInteger('customer_id');
            $table->bigInteger('vendor_id');
            $table->string('purpose', 20);
            $table->bigInteger('amount_gross_cents');
            $table->bigInteger('platform_fee_cents')->default(0);
            $table->bigInteger('net_vendor_cents');
            $table->bigInteger('commission_percent')->default(10);
            $table->string('billing_type', 20)->default('PIX');
            $table->bigInteger('installments')->nullable()->default(1);
            $table->string('currency', 10)->default('BRL');
            $table->string('external_reference', 120)->nullable();
            $table->string('psp_provider', 24)->default('asaas');
            $table->string('psp_payment_id', 80)->nullable();
            $table->longText('psp_invoice_url')->nullable();
            $table->longText('pix_qr_code')->nullable();
            $table->longText('pix_copia_e_cola')->nullable();
            $table->string('status', 24)->default('pending');
            $table->dateTime('paid_at', 6)->nullable();
            $table->dateTime('released_at', 6)->nullable();
            $table->dateTime('failed_at', 6)->nullable();
            $table->dateTime('refunded_at', 6)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_orders');
    }
};
