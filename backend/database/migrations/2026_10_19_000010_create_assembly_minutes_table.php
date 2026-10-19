<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assembly_minutes', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('assembly_id')->unique();
            $table->bigInteger('condo_id');
            $table->string('status', 24)->default('rascunho');
            $table->string('current_version', 12)->default('1.0');
            $table->longText('file_url')->nullable();
            $table->string('file_name', 200)->nullable();
            $table->bigInteger('file_size_kb')->nullable()->default(0);
            $table->string('file_format', 20)->nullable()->default('pdf');
            $table->longText('content')->nullable();
            $table->longText('summary')->nullable();
            $table->longText('ai_suggested_summary')->nullable();
            $table->string('summary_status', 20)->default('rascunho');
            $table->bigInteger('summary_approved_by_id')->nullable();
            $table->dateTime('summary_approved_at', 6)->nullable();
            $table->dateTime('published_at', 6)->nullable();
            $table->bigInteger('published_by_id')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assembly_minutes');
    }
};
