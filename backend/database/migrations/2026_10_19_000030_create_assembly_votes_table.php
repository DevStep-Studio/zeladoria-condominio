<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assembly_votes', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('assembly_id');
            $table->bigInteger('agenda_id');
            $table->bigInteger('unit_id')->nullable();
            $table->bigInteger('user_id')->nullable();
            $table->string('choice', 20);
            $table->string('weight', 16)->nullable()->default('1.00');
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->unique(['user_id', 'agenda_id'], 'assembly_votes_user_agenda_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assembly_votes');
    }
};
