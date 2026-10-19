<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('name', 140);
            $table->string('category', 40)->default('equipamento');
            $table->string('location', 120)->nullable();
            $table->string('brand', 80)->nullable();
            $table->string('serial', 80)->nullable();
            $table->string('installed_at', 12)->nullable();
            $table->string('status', 24)->default('operacional');
            $table->longText('notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
