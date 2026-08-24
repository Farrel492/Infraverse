<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rack_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->enum('type', ['router', 'switch', 'firewall', 'server', 'access_point', 'ups', 'other'])->default('other');
            $table->string('vendor')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable()->unique();
            $table->string('ip_address')->nullable();
            $table->string('mac_address')->nullable();
            $table->enum('status', ['active', 'inactive', 'maintenance', 'down'])->default('active');
            $table->date('purchase_date')->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->unsignedInteger('rack_position')->nullable();
            $table->unsignedInteger('rack_units')->default(1);
            $table->string('photo')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
