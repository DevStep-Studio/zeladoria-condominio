<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assembly_attendance', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('assembly_id');
            $table->bigInteger('unit_id')->nullable();
            $table->bigInteger('user_id')->nullable();
            $table->string('status', 20)->default('confirmado');
            $table->bigInteger('proxy_for_unit_id')->nullable();
            $table->string('proxy_doc', 200)->nullable();
            $table->string('proxy_name', 140)->nullable();
            $table->string('proxy_cpf', 32)->nullable();
            $table->json('history')->nullable();
            $table->dateTime('checkin_at', 6)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assembly_attendance');
    }
};
