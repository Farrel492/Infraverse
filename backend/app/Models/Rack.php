<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rack extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'room_id', 'name', 'position', 'total_u',
        'pos_x', 'pos_y', 'pos_z',
    ];

    protected $casts = [
        'pos_x' => 'float', 'pos_y' => 'float', 'pos_z' => 'float',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function devices()
    {
        return $this->hasMany(Device::class);
    }
}
