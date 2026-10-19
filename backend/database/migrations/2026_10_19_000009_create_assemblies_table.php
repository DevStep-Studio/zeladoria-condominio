<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assemblies', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('title', 200);
            $table->string('kind', 24)->default('ordinaria');
            $table->string('mode', 20)->default('hibrida');
            $table->dateTime('notice_at', 6)->nullable()->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('first_call_at', 6);
            $table->dateTime('second_call_at', 6)->nullable();
            $table->string('location', 200)->nullable();
            $table->string('online_link', 240)->nullable();
            $table->bigInteger('quorum_first')->default(50);
            $table->bigInteger('quorum_second')->default(25);
            $table->string('status', 24)->default('agendada');
            $table->longText('minutes')->nullable();
            $table->longText('recording_url')->nullable();
            $table->bigInteger('created_by_id')->nullable();
            $table->longText('description')->nullable();
            $table->string('start_time', 8)->nullable();
            $table->string('end_time', 8)->nullable();
            $table->longText('guidelines')->nullable();
            $table->string('audience_scope', 20)->default('todos');
            $table->bigInteger('target_block_id')->nullable();
            $table->bigInteger('target_unit_id')->nullable();
            $table->bigInteger('responsible_id')->nullable();
            $table->string('responsible_name', 140)->nullable();
            $table->dateTime('confirmation_deadline', 6)->nullable();
            $table->json('reminders_config')->nullable();
            $table->json('attachments')->nullable();
            $table->longText('notice_document_url')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assemblies');
    }
};
