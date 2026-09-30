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

    protected static function booted(): void
    {
        static::deleting(function (Room $room) {
            $room->racks()->each(function ($rack) {
                $rack->devices()->each(function ($device) {
                    $device->sourceConnections()->delete();
                    $device->targetConnections()->delete();
                    $device->documents()->delete();
                    $device->maintenances()->delete();
                    $device->simulationScenarios()->delete();
                    $device->delete();
                });
                $rack->delete();
            });
        });
    }

    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }

    public function racks()
    {
        return $this->hasMany(Rack::class);
    }
}
