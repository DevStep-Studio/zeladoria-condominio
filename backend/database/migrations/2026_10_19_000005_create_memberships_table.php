<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('memberships', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('user_id');
            $table->bigInteger('condo_id');
            $table->string('role', 24)->default('morador');
            $table->bigInteger('unit_id')->nullable();
            $table->string('relation', 24)->nullable()->default('proprietario');
            $table->string('status', 20)->default('ativo');
            $table->dateTime('invited_at', 6)->nullable();
            $table->dateTime('accepted_at', 6)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->unique(['user_id', 'condo_id'], 'memberships_user_condo_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memberships');
    }
};
