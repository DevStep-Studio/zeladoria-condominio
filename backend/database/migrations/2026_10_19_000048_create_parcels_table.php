<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcels', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('unit_id');
            $table->string('code', 20);
            $table->string('kind', 24)->default('encomenda');
            $table->string('carrier', 80)->nullable();
            $table->string('tracking_code', 60)->nullable();
            $table->longText('description')->nullable();
            $table->longText('photo_url')->nullable();
            $table->string('shelf', 40)->nullable();
            $table->string('status', 20)->default('pendente');
            $table->string('pickup_code', 12);
            $table->bigInteger('received_by_id')->nullable();
            $table->dateTime('received_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->dateTime('picked_up_at', 6)->nullable();
            $table->string('picked_up_by', 140)->nullable();
            $table->string('picked_up_document', 40)->nullable();
            $table->longText('signature')->nullable();
            $table->longText('notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcels');
    }
};
