<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('code', 20);
            $table->bigInteger('unit_id')->nullable();
            $table->string('title', 200);
            $table->longText('description');
            $table->string('category', 40)->default('manutencao');
            $table->string('priority', 20)->default('media');
            $table->string('status', 24)->default('solicitado');
            $table->string('location', 160)->nullable();
            $table->string('preferred_time', 80)->nullable();
            $table->bigInteger('vendor_id')->nullable();
            $table->bigInteger('assigned_to_id')->nullable();
            $table->string('scheduled_for', 12)->nullable();
            $table->bigInteger('cost_cents')->nullable()->default(0);
            $table->longText('report')->nullable();
            $table->json('attachments')->nullable();
            $table->string('ai_priority', 20)->nullable();
            $table->longText('ai_summary')->nullable();
            $table->bigInteger('opened_by_id')->nullable();
            $table->dateTime('due_at', 6)->nullable();
            $table->dateTime('closed_at', 6)->nullable();
            $table->bigInteger('rating')->nullable();
            $table->longText('rating_comment')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
