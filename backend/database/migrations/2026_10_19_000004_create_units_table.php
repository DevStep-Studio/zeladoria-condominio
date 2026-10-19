<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('block_id')->nullable();
            $table->string('number', 24);
            $table->bigInteger('floor')->nullable()->default(0);
            $table->string('fraction', 16)->nullable()->default('1.00');
            $table->string('kind', 24)->default('apartamento');
            $table->string('status', 24)->default('ocupada');
            $table->bigInteger('parking_spots')->nullable()->default(1);
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
