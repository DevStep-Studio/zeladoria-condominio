<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('title', 200);
            $table->longText('body');
            $table->string('category', 40)->default('geral');
            $table->string('priority', 20)->default('normal');
            $table->string('audience', 20)->default('todos');
            $table->bigInteger('block_id')->nullable();
            $table->boolean('pinned')->default(false);
            $table->boolean('show_on_tv')->default(true);
            $table->bigInteger('author_id')->nullable();
            $table->dateTime('published_at', 6)->nullable()->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('expires_at', 6)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
