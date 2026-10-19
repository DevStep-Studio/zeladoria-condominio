<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_jobs', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('kind', 30);
            $table->string('file_name', 160)->nullable();
            $table->bigInteger('total')->default(0);
            $table->bigInteger('succeeded')->default(0);
            $table->bigInteger('failed')->default(0);
            $table->json('errors')->nullable();
            $table->bigInteger('created_by_id')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_jobs');
    }
};
