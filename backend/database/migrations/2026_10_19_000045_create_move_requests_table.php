<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('move_requests', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('unit_id');
            $table->bigInteger('requested_by_id')->nullable();
            $table->string('kind', 24)->default('mudanca');
            $table->string('scheduled_date', 12);
            $table->string('start_time', 8)->default('08:00');
            $table->string('end_time', 8)->default('17:00');
            $table->string('elevator', 40)->nullable()->default('Social');
            $table->string('carrier_name', 140)->nullable();
            $table->string('carrier_doc', 40)->nullable();
            $table->string('vehicle_plate', 16)->nullable();
            $table->longText('workers')->nullable();
            $table->longText('description')->nullable();
            $table->longText('art_url')->nullable();
            $table->boolean('term_accepted')->default(false);
            $table->string('status', 20)->default('pendente');
            $table->bigInteger('reviewed_by_id')->nullable();
            $table->longText('review_notes')->nullable();
            $table->string('deadline_at', 12)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('move_requests');
    }
};
