<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id('id');
            $table->string('name', 140);
            $table->string('email', 160)->unique();
            $table->longText('password_hash');
            $table->string('phone', 32)->nullable();
            $table->string('document', 32)->nullable();
            $table->longText('avatar_url')->nullable();
            $table->json('emergency_contacts')->nullable();
            $table->json('dependents')->nullable();
            $table->json('vehicles')->nullable();
            $table->json('notification_preferences')->nullable();
            $table->boolean('two_factor_enabled')->default(false);
            $table->boolean('is_super_admin')->default(false);
            $table->string('status', 20)->default('ativo');
            $table->string('theme', 12)->default('light');
            $table->dateTime('first_access_at', 6)->nullable();
            $table->dateTime('last_login_at', 6)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
