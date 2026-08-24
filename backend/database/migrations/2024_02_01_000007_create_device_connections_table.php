<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_device_id')->constrained('devices')->cascadeOnDelete();
            $table->foreignId('target_device_id')->constrained('devices')->cascadeOnDelete();
            $table->enum('connection_type', ['fiber', 'utp', 'wireless', 'other'])->default('utp');
            $table->string('port_source')->nullable();
            $table->string('port_target')->nullable();
            $table->enum('status', ['active', 'inactive', 'down'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_connections');
    }
};
