<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulation_scenarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->enum('scenario_type', ['router_down', 'switch_down', 'fiber_cut', 'ups_failure', 'server_offline'])->default('router_down');
            $table->text('description')->nullable();
            $table->text('impact_description')->nullable();
            $table->json('affected_device_ids')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulation_scenarios');
    }
};
