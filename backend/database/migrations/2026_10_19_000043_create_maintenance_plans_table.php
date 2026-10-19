<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_plans', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('asset_id')->nullable();
            $table->string('title', 160);
            $table->bigInteger('frequency_days')->default(30);
            $table->json('checklist')->nullable();
            $table->bigInteger('vendor_id')->nullable();
            $table->string('responsible', 120)->nullable();
            $table->string('next_due_at', 12)->nullable();
            $table->string('last_done_at', 12)->nullable();
            $table->boolean('active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_plans');
    }
};
