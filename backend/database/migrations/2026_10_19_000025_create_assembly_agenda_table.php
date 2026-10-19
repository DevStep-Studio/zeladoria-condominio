<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assembly_agenda', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('assembly_id');
            $table->bigInteger('position')->default(1);
            $table->string('title', 200);
            $table->longText('description')->nullable();
            $table->string('voting_type', 20)->default('unidade');
            $table->string('status', 20)->default('pendente');
            $table->string('result', 40)->nullable();
            $table->json('attachments')->nullable();
            $table->string('presenter', 140)->nullable();
            $table->longText('discussion_result')->nullable();
            $table->longText('decision')->nullable();
            $table->longText('notes')->nullable();
            $table->boolean('requires_voting')->default(true);
            $table->longText('voting_result')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assembly_agenda');
    }
};
