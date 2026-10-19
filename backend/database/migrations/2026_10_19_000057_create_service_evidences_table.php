<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_evidences', function (Blueprint $table): void {
            $table->id('id');
            $table->bigInteger('condo_id');
            $table->bigInteger('request_id');
            $table->bigInteger('contract_id')->nullable();
            $table->bigInteger('vendor_id');
            $table->string('stage', 20);
            $table->longText('file_url');
            $table->longText('caption')->nullable();
            $table->dateTime('created_at', 6)->default(DB::raw('CURRENT_TIMESTAMP(6)'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_evidences');
    }
};
