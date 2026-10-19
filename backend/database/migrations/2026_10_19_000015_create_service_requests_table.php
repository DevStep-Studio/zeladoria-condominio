<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('code', 24);
            $table->bigInteger('customer_id');
            $table->bigInteger('vendor_id')->nullable();
            $table->string('mode', 24)->default('on_demand');
            $table->string('category', 40);
            $table->string('title', 200);
            $table->longText('description');
            $table->string('urgency', 20)->default('hoje');
            $table->string('scheduled_date', 20)->nullable();
            $table->string('scheduled_time_slot', 60)->nullable();
            $table->string('location', 160)->default('Unidade do Morador');
            $table->bigInteger('unit_id')->nullable();
            $table->json('attachments')->nullable();
            $table->string('status', 36)->default('solicitado');
            $table->dateTime('accepted_at', 6)->nullable();
            $table->dateTime('arrived_at', 6)->nullable();
            $table->dateTime('started_at', 6)->nullable();
            $table->dateTime('completed_at', 6)->nullable();
            $table->dateTime('cancelled_at', 6)->nullable();
            $table->bigInteger('cancelled_by')->nullable();
            $table->longText('cancel_reason')->nullable();
            $table->bigInteger('estimated_amount_cents')->nullable();
            $table->bigInteger('final_amount_cents')->nullable();
            $table->bigInteger('platform_fee_cents')->nullable()->default(0);
            $table->bigInteger('commission_rate_percent')->nullable()->default(10);
            $table->string('payment_method', 30)->nullable()->default('direto_prestador');
            $table->boolean('is_paid')->default(false);
            $table->bigInteger('inspection_id')->nullable();
            $table->bigInteger('payment_order_id')->nullable();
            $table->json('checklist')->nullable();
            $table->json('materials_used')->nullable();
            $table->longText('execution_notes')->nullable();
            $table->dateTime('completion_requested_at', 6)->nullable();
            $table->dateTime('validated_at', 6)->nullable();
            $table->bigInteger('validated_by_id')->nullable();
            $table->longText('correction_notes')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
