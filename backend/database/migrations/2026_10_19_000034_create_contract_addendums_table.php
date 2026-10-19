<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_addendums', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('request_id');
            $table->bigInteger('quote_id');
            $table->bigInteger('contract_id')->nullable();
            $table->bigInteger('vendor_id')->nullable();
            $table->string('title', 180);
            $table->longText('reason')->nullable();
            $table->longText('description');
            $table->bigInteger('additional_amount_cents');
            $table->string('status', 24)->default('proposto');
            $table->bigInteger('payment_order_id')->nullable();
            $table->json('photos')->nullable();
            $table->bigInteger('estimated_extra_hours')->nullable()->default(0);
            $table->dateTime('accepted_at', 6)->nullable();
            $table->dateTime('rejected_at', 6)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_addendums');
    }
};
