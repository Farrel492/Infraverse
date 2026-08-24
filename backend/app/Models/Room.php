<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Room extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'floor_id', 'name', 'type',
        'pos_x', 'pos_y', 'pos_z', 'width', 'depth', 'height',
    ];

    protected $casts = [
        'pos_x' => 'float', 'pos_y' => 'float', 'pos_z' => 'float',
        'width' => 'float', 'depth' => 'float', 'height' => 'float',
    ];

    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }

    public function racks()
    {
        return $this->hasMany(Rack::class);
    }
}
