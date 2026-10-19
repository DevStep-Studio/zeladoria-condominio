<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_quotes', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('request_id');
            $table->bigInteger('vendor_id');
            $table->bigInteger('inspection_id')->nullable();
            $table->bigInteger('version')->default(1);
            $table->string('title', 180)->nullable();
            $table->longText('scope_description')->nullable();
            $table->json('itemized_materials')->nullable();
            $table->bigInteger('labor_cents')->default(0);
            $table->bigInteger('materials_cents')->default(0);
            $table->bigInteger('other_costs_cents')->default(0);
            $table->bigInteger('discount_cents')->default(0);
            $table->bigInteger('inspection_discount_cents')->default(0);
            $table->bigInteger('total_cents')->default(0);
            $table->longText('description');
            $table->string('available_at', 120)->nullable();
            $table->longText('conditions')->nullable();
            $table->bigInteger('estimated_days')->nullable()->default(1);
            $table->bigInteger('warranty_days')->nullable()->default(90);
            $table->string('contract_hash', 64)->nullable();
            $table->dateTime('terms_accepted_at', 6)->nullable();
            $table->string('user_ip', 60)->nullable();
            $table->dateTime('valid_until', 6)->nullable();
            $table->dateTime('expires_at', 6)->nullable();
            $table->dateTime('sent_at', 6)->nullable();
            $table->dateTime('accepted_at', 6)->nullable();
            $table->string('status', 24)->default('pendente');
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_quotes');
    }
};
