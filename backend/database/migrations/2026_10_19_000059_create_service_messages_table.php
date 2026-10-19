<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_messages', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('request_id');
            $table->bigInteger('sender_id');
            $table->string('sender_role', 20);
            $table->longText('body');
            $table->longText('attachment_url')->nullable();
            $table->dateTime('read_at', 6)->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_messages');
    }
};
