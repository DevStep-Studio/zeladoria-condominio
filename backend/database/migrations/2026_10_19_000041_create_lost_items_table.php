<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lost_items', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('title', 160);
            $table->longText('description')->nullable();
            $table->longText('photo_url')->nullable();
            $table->string('found_location', 140)->nullable();
            $table->string('found_at', 12);
            $table->string('stored_location', 120)->nullable()->default('Portaria');
            $table->string('status', 20)->default('guardado');
            $table->string('discard_after', 12)->nullable();
            $table->string('claimed_by', 140)->nullable();
            $table->bigInteger('claimed_unit_id')->nullable();
            $table->dateTime('claimed_at', 6)->nullable();
            $table->bigInteger('registered_by_id')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lost_items');
    }
};
