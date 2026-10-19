<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('help_articles', function (Blueprint $table): void {
            $table->id('id');
            $table->string('slug', 80)->unique();
            $table->string('title', 200);
            $table->string('category', 60)->default('primeiros-passos');
            $table->longText('body');
            $table->string('tags', 200)->nullable();
            $table->string('video_url', 240)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('help_articles');
    }
};
