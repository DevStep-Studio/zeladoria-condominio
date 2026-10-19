<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('user_id')->nullable();
            $table->string('slug', 140)->nullable();
            $table->string('name', 160);
            $table->string('cnpj', 32)->nullable();
            $table->string('provider_type', 24)->default('autonomo');
            $table->string('company_name', 160)->nullable();
            $table->string('category', 60)->default('servicos');
            $table->string('contact_name', 120)->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email', 140)->nullable();
            $table->bigInteger('rating')->nullable()->default(0);
            $table->boolean('active')->default(true);
            $table->longText('notes')->nullable();
            $table->longText('photo_url')->nullable();
            $table->longText('cover_url')->nullable();
            $table->string('whatsapp', 32)->nullable();
            $table->longText('description')->nullable();
            $table->string('service_area', 160)->nullable();
            $table->bigInteger('service_radius_km')->nullable()->default(15);
            $table->double('lat')->nullable();
            $table->double('lng')->nullable();
            $table->bigInteger('experience_years')->nullable()->default(3);
            $table->bigInteger('response_time_minutes')->nullable()->default(15);
            $table->string('working_hours', 120)->nullable()->default('Seg a Sex 08:00 - 18:00');
            $table->bigInteger('price_from_cents')->nullable();
            $table->string('cep', 16)->nullable();
            $table->string('address_street', 200)->nullable();
            $table->string('address_number', 30)->nullable();
            $table->string('address_neighborhood', 120)->nullable();
            $table->string('address_city', 100)->nullable();
            $table->string('address_state', 8)->nullable();
            $table->json('bank_info')->nullable();
            $table->json('pix_info')->nullable();
            $table->json('identity_verification')->nullable();
            $table->json('specialties')->nullable();
            $table->json('services')->nullable();
            $table->json('portfolio')->nullable();
            $table->json('documents')->nullable();
            $table->string('onboarding_status', 24)->default('aprovado');
            $table->boolean('is_online')->default(true);
            $table->boolean('available_now')->default(true);
            $table->boolean('verified')->default(false);
            $table->dateTime('verified_at', 6)->nullable();
            $table->bigInteger('verified_by_id')->nullable();
            $table->boolean('sponsored')->default(false);
            $table->bigInteger('completed_jobs')->nullable()->default(0);
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
