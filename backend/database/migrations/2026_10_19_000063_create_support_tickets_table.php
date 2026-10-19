<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id')->nullable();
            $table->bigInteger('user_id')->nullable();
            $table->string('subject', 200);
            $table->longText('body');
            $table->string('category', 40)->default('duvida');
            $table->string('priority', 20)->default('normal');
            $table->string('status', 20)->default('aberto');
            $table->longText('answer')->nullable();
            $table->bigInteger('satisfaction')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
