<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assembly_minute_versions', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('minutes_id');
            $table->bigInteger('assembly_id');
            $table->string('version', 12);
            $table->longText('file_url')->nullable();
            $table->string('file_name', 200)->nullable();
            $table->bigInteger('file_size_kb')->nullable()->default(0);
            $table->longText('content')->nullable();
            $table->longText('summary')->nullable();
            $table->longText('change_reason')->nullable();
            $table->bigInteger('created_by_id')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assembly_minute_versions');
    }
};
