<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id')->nullable();
            $table->bigInteger('user_id')->nullable();
            $table->string('user_name', 140)->nullable();
            $table->string('action', 60);
            $table->string('entity', 60);
            $table->string('entity_id', 40)->nullable();
            $table->string('summary', 240)->nullable();
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('ip', 60)->nullable();
            $table->string('user_agent', 240)->nullable();
            $table->string('origin', 40)->nullable()->default('painel');
            $table->boolean('critical')->default(false);
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
