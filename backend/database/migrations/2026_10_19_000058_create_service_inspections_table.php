<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_inspections', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('request_id');
            $table->bigInteger('vendor_id');
            $table->string('type', 20)->default('gratuita');
            $table->bigInteger('price_cents')->default(0);
            $table->boolean('discount_on_service')->default(false);
            $table->bigInteger('estimated_duration_minutes')->nullable()->default(40);
            $table->longText('notes')->nullable();
            $table->json('available_slots')->nullable();
            $table->json('selected_slot')->nullable();
            $table->dateTime('hold_expires_at', 6)->nullable();
            $table->bigInteger('payment_order_id')->nullable();
            $table->dateTime('provider_arrived_at', 6)->nullable();
            $table->string('status', 32)->default('pendente_escolha_morador');
            $table->longText('diagnostic_report')->nullable();
            $table->json('evidence_photos')->nullable();
            $table->dateTime('completed_at', 6)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_inspections');
    }
};
