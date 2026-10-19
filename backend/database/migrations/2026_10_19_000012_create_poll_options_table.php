<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poll_options', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('poll_id');
            $table->string('label', 160);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_options');
    }
};
