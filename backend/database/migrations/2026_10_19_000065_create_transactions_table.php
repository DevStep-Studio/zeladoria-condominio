<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->string('kind', 12)->default('despesa');
            $table->string('category', 60)->default('manutencao');
            $table->string('cost_center', 60)->nullable()->default('administracao');
            $table->string('description', 200);
            $table->bigInteger('amount_cents')->default(0);
            $table->string('due_date', 12);
            $table->string('paid_date', 12)->nullable();
            $table->string('status', 20)->default('pendente');
            $table->bigInteger('vendor_id')->nullable();
            $table->boolean('reserve_fund')->default(false);
            $table->longText('attachment_url')->nullable();
            $table->bigInteger('created_by_id')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
