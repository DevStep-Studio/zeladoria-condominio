<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assembly_notification_logs', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('assembly_id');
            $table->bigInteger('condo_id');
            $table->string('trigger_event', 40);
            $table->string('channel', 20)->default('app');
            $table->dateTime('sent_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
            $table->bigInteger('recipients_count')->default(0);
            $table->bigInteger('delivered_count')->default(0);
            $table->bigInteger('read_count')->default(0);
            $table->bigInteger('failed_count')->default(0);
            $table->longText('failure_details')->nullable();
            $table->bigInteger('created_by_id')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assembly_notification_logs');
    }
};
