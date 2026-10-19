<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('user_id');
            $table->string('period', 20)->default('manha');
            $table->string('status', 20)->default('aberto');
            $table->dateTime('started_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('ended_at', 6)->nullable();
            $table->bigInteger('handover_to_id')->nullable();
            $table->longText('handover_notes')->nullable();
            $table->longText('pending_items')->nullable();
            $table->json('checklist')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
