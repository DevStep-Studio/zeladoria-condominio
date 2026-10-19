<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('occurrences', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('shift_id')->nullable();
            $table->string('code', 20);
            $table->string('visibility', 20)->default('publica');
            $table->string('category', 40)->default('seguranca');
            $table->string('severity', 20)->default('media');
            $table->string('status', 24)->default('recebida');
            $table->string('title', 200);
            $table->longText('description');
            $table->string('exact_location', 160)->nullable();
            $table->double('latitude')->nullable();
            $table->double('longitude')->nullable();
            $table->longText('actions_taken')->nullable();
            $table->dateTime('occurred_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->bigInteger('reported_by_id')->nullable();
            $table->bigInteger('assigned_to_id')->nullable();
            $table->bigInteger('unit_id')->nullable();
            $table->bigInteger('block_id')->nullable();
            $table->json('attachments')->nullable();
            $table->dateTime('estimated_deadline', 6)->nullable();
            $table->dateTime('resolved_at', 6)->nullable();
            $table->bigInteger('resident_rating')->nullable();
            $table->longText('resident_comment')->nullable();
            $table->bigInteger('ack_by_id')->nullable();
            $table->dateTime('ack_at', 6)->nullable();
            $table->boolean('locked')->default(false);
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('occurrences');
    }
};
