<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_incidents', function (Blueprint $table): void {
            $table->id('id');
            $table->string('code', 30)->unique();
            $table->string('title', 255);
            $table->text('description');
            $table->enum('type', ['aviso', 'erro'])->default('aviso');
            $table->string('category', 60)->default('operacional');
            $table->string('source_module', 60);
            $table->enum('priority', ['P0', 'P1', 'P2', 'P3'])->default('P2');
            $table->enum('status', ['aberto', 'reconhecido', 'em_analise', 'resolvido', 'encerrado'])->default('aberto');
            $table->bigInteger('condo_id')->nullable()->index();
            $table->string('condo_name', 160)->nullable();
            $table->bigInteger('assignee_id')->nullable();
            $table->string('assignee_name', 140)->nullable();
            $table->string('fingerprint', 64)->nullable()->index();
            $table->integer('occurrences_count')->default(1);
            $table->dateTime('first_seen_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('last_seen_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('resolved_at', 6)->nullable();
            $table->bigInteger('resolved_by_id')->nullable();
            $table->string('resolved_by_name', 140)->nullable();
            $table->text('resolution_notes')->nullable();
            $table->boolean('is_manual')->default(false);
            $table->dateTime('start_date', 6)->nullable();
            $table->dateTime('end_date', 6)->nullable();
            $table->text('recommended_action')->nullable();
            $table->string('target_audience', 60)->nullable()->default('todos');
            $table->string('environment', 40)->default('production');
            $table->string('correlation_id', 64)->nullable();
            $table->string('app_version', 30)->nullable()->default('1.0.0');
            $table->json('technical_context')->nullable();
            $table->text('stack_trace')->nullable();
            $table->string('related_entity_type', 60)->nullable();
            $table->string('related_entity_id', 60)->nullable();
            $table->string('related_url', 255)->nullable();
            $table->boolean('silenced')->default(false);
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('updated_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });

        Schema::create('incident_activities', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('incident_id')->index();
            $table->bigInteger('user_id')->nullable();
            $table->string('user_name', 140)->default('Sistema');
            $table->string('action', 60);
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });

        Schema::create('incident_occurrences', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('incident_id')->index();
            $table->string('correlation_id', 64)->nullable();
            $table->string('message', 255);
            $table->json('context')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });

        Schema::create('monitoring_rules', function (Blueprint $table): void {
            $table->id('id');
            $table->string('name', 160);
            $table->string('module', 60);
            $table->string('event_condition', 160);
            $table->integer('threshold')->default(1);
            $table->integer('window_minutes')->default(60);
            $table->enum('priority', ['P0', 'P1', 'P2', 'P3'])->default('P1');
            $table->string('default_assignee_name', 140)->nullable();
            $table->boolean('active')->default(true);
            $table->string('action_plan', 255)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monitoring_rules');
        Schema::dropIfExists('incident_occurrences');
        Schema::dropIfExists('incident_activities');
        Schema::dropIfExists('system_incidents');
    }
};
