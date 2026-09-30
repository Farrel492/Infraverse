<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Floor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['building_id', 'name', 'floor_number', 'pos_y'];

    protected $casts = ['pos_y' => 'float'];

    protected static function booted(): void
    {
        static::deleting(function (Floor $floor) {
            $floor->rooms()->each(function ($room) {
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
                $room->delete();
            });
        });
    }

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
