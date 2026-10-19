<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('year');
            $table->string('category', 60);
            $table->bigInteger('planned_cents')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
