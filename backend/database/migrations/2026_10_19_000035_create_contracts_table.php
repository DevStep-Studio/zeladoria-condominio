<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('vendor_id');
            $table->string('title', 180);
            $table->longText('object')->nullable();
            $table->string('start_at', 12);
            $table->string('end_at', 12);
            $table->bigInteger('notice_days')->default(30);
            $table->bigInteger('value_cents')->default(0);
            $table->string('billing_cycle', 20)->default('mensal');
            $table->string('adjustment_index', 20)->nullable()->default('IGPM');
            $table->string('status', 20)->default('vigente');
            $table->longText('document_url')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
