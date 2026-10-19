<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_orders', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('asset_id')->nullable();
            $table->bigInteger('plan_id')->nullable();
            $table->string('kind', 20)->default('preventiva');
            $table->string('title', 180);
            $table->longText('description')->nullable();
            $table->string('scheduled_for', 12)->nullable();
            $table->string('completed_at', 12)->nullable();
            $table->string('status', 24)->default('programada');
            $table->bigInteger('vendor_id')->nullable();
            $table->string('technician', 120)->nullable();
            $table->bigInteger('cost_cents')->nullable()->default(0);
            $table->longText('report')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_orders');
    }
};
