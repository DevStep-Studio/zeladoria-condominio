<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('charges', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('unit_id');
            $table->string('reference', 12);
            $table->string('description', 160)->default('Taxa condominial');
            $table->bigInteger('amount_cents')->default(0);
            $table->string('due_date', 12);
            $table->string('paid_at', 12)->nullable();
            $table->string('status', 20)->default('aberta');
            $table->string('method', 20)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
