<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('title', 200);
            $table->string('category', 40)->default('geral');
            $table->longText('description')->nullable();
            $table->string('file_name', 200)->nullable();
            $table->longText('file_url')->nullable();
            $table->bigInteger('size_kb')->nullable()->default(0);
            $table->string('visibility', 20)->default('moradores');
            $table->string('version', 12)->nullable()->default('1.0');
            $table->bigInteger('uploaded_by_id')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
