<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('occurrence_comments', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('occurrence_id');
            $table->bigInteger('user_id')->nullable();
            $table->longText('body');
            $table->boolean('internal')->default(false);
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('occurrence_comments');
    }
};
