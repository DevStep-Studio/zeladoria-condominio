<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_disputes', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('request_id');
            $table->bigInteger('opened_by_id');
            $table->string('reason', 60);
            $table->longText('description');
            $table->string('status', 24)->default('aberta');
            $table->longText('resolution_notes')->nullable();
            $table->bigInteger('resolved_by_id')->nullable();
            $table->dateTime('resolved_at', 6)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_disputes');
    }
};
