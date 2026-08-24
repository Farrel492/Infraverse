<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('floor_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['server_room', 'office', 'classroom', 'lab', 'storage', 'other'])->default('other');
            $table->float('pos_x')->default(0);
            $table->float('pos_y')->default(0);
            $table->float('pos_z')->default(0);
            $table->float('width')->default(5);
            $table->float('depth')->default(5);
            $table->float('height')->default(3);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
