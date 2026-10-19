<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotion_plans', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id')->nullable();
            $table->string('name', 120);
            $table->string('type', 40)->default('categoria');
            $table->bigInteger('duration_days')->default(7);
            $table->bigInteger('price_cents')->default(2990);
            $table->string('badge', 40)->nullable()->default('Patrocinado');
            $table->boolean('active')->default(true);
            $table->longText('description')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_plans');
    }
};
