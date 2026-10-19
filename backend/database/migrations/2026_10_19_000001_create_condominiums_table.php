<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('condominiums', function (Blueprint $table): void {
            $table->id('id');
            $table->string('name', 160);
            $table->string('slug', 80)->unique();
            $table->string('cnpj', 32)->nullable();
            $table->longText('address')->nullable();
            $table->string('city', 80)->nullable();
            $table->string('state', 8)->nullable();
            $table->string('plan', 24)->default('pro');
            $table->json('modules')->nullable();
            $table->string('brand_color', 16)->nullable()->default('#90B800');
            $table->boolean('public_page')->default(true);
            $table->bigInteger('onboarding_step')->default(1);
            $table->boolean('onboarding_done')->default(false);
            $table->bigInteger('storage_used_mb')->default(0);
            $table->bigInteger('storage_limit_mb')->default(5120);
            $table->double('latitude')->nullable()->default(-23.5855);
            $table->double('longitude')->nullable()->default(-46.6784);
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('condominiums');
    }
};
