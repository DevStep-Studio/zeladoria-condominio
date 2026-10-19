<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_warranty_tickets', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('request_id');
            $table->bigInteger('quote_id');
            $table->bigInteger('customer_id');
            $table->bigInteger('vendor_id');
            $table->longText('description');
            $table->string('status', 24)->default('aberto');
            $table->longText('resolution_notes')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('resolved_at', 6)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_warranty_tickets');
    }
};
