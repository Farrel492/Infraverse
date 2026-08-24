<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Building extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'location', 'total_floors', 'description', 'image',
        'pos_x', 'pos_y', 'pos_z',
    ];

    protected $casts = [
        'pos_x' => 'float',
        'pos_y' => 'float',
        'pos_z' => 'float',
    ];

    public function floors()
    {
        return $this->hasMany(Floor::class);
    }
}
