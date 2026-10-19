<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketplace_settings', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id')->nullable();
            $table->bigInteger('commission_percent')->default(10);
            $table->bigInteger('visit_commission_percent')->default(0);
            $table->bigInteger('slot_hold_minutes')->default(10);
            $table->bigInteger('inspection_fee_max_cents')->nullable()->default(15000);
            $table->bigInteger('dispute_window_hours')->default(48);
            $table->bigInteger('auto_release_hours')->default(72);
            $table->string('processing_fee_payer', 20)->default('PROVIDER');
            $table->decimal('estimated_psp_fee_percent', 4, 2)->nullable()->default('3.50');
            $table->boolean('payments_enabled')->default(true);
            $table->boolean('paid_visits_enabled')->default(true);
            $table->boolean('pix_enabled')->default(true);
            $table->boolean('card_enabled')->default(true);
            $table->boolean('installments_enabled')->default(false);
            $table->boolean('payouts_enabled')->default(true);
            $table->boolean('zeladoria_protege_enabled')->default(true);
            $table->bigInteger('max_installments')->default(1);
            $table->bigInteger('default_quote_validity_hours')->default(48);
            $table->boolean('require_before_photo')->default(false);
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketplace_settings');
    }
};
