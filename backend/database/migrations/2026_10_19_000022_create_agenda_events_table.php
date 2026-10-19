<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_events', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('title', 200);
            $table->longText('description')->nullable();
            $table->string('category', 40)->default('evento');
            $table->string('date', 12);
            $table->string('start_time', 8);
            $table->string('end_time', 8);
            $table->string('location', 160)->nullable();
            $table->string('responsible', 140)->nullable();
            $table->string('audience_scope', 20)->default('todos');
            $table->json('attachments')->nullable();
            $table->string('reminder', 20)->nullable()->default('1d');
            $table->string('recurrence', 20)->nullable()->default('nenhuma');
            $table->string('status', 20)->default('agendado');
            $table->bigInteger('amenity_id')->nullable();
            $table->bigInteger('created_by_id')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_events');
    }
};
