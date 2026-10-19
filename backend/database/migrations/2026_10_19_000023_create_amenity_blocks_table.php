<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('amenity_blocks', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('amenity_id')->nullable();
            $table->string('start_date', 12);
            $table->string('end_date', 12);
            $table->string('start_time', 8)->nullable();
            $table->string('end_time', 8)->nullable();
            $table->string('recurrent_day', 20)->nullable();
            $table->longText('reason');
            $table->bigInteger('created_by_id')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('amenity_blocks');
    }
};
