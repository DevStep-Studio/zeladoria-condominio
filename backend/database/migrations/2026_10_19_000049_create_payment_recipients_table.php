<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_recipients', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('vendor_id')->unique();
            $table->string('psp_provider', 24)->default('asaas');
            $table->string('psp_account_id', 80);
            $table->longText('psp_api_key')->nullable();
            $table->string('account_type', 20)->default('individual');
            $table->string('pix_key', 140)->nullable();
            $table->string('status', 24)->default('active');
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_recipients');
    }
};
