<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitors', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('name', 160);
            $table->string('document', 40)->nullable();
            $table->string('doc_type', 20)->nullable()->default('RG');
            $table->string('phone', 32)->nullable();
            $table->longText('photo_url')->nullable();
            $table->string('kind', 24)->default('visitante');
            $table->string('company', 140)->nullable();
            $table->string('vehicle_plate', 16)->nullable();
            $table->boolean('recurring')->default(false);
            $table->boolean('blocked')->default(false);
            $table->longText('block_reason')->nullable();
            $table->longText('notes')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};
