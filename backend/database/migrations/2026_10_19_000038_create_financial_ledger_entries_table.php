<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_ledger_entries', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('request_id')->nullable();
            $table->bigInteger('payment_order_id')->nullable();
            $table->string('event_type', 60);
            $table->bigInteger('amount_cents');
            $table->string('balance_type', 12)->default('credit');
            $table->string('entity_type', 24);
            $table->string('reference_code', 60)->nullable();
            $table->longText('description')->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_ledger_entries');
    }
};
