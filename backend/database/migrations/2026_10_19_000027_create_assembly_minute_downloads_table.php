<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assembly_minute_downloads', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('assembly_id');
            $table->bigInteger('minutes_id');
            $table->string('version', 12);
            $table->bigInteger('user_id');
            $table->bigInteger('unit_id')->nullable();
            $table->dateTime('downloaded_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assembly_minute_downloads');
    }
};
