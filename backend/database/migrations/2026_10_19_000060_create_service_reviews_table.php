<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_reviews', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('request_id')->unique();
            $table->bigInteger('vendor_id');
            $table->bigInteger('customer_id');
            $table->bigInteger('rating');
            $table->bigInteger('punctuality_rating')->nullable();
            $table->bigInteger('quality_rating')->nullable();
            $table->bigInteger('communication_rating')->nullable();
            $table->bigInteger('cost_benefit_rating')->nullable();
            $table->longText('comment')->nullable();
            $table->json('photos')->nullable();
            $table->boolean('is_verified')->default(true);
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_reviews');
    }
};
