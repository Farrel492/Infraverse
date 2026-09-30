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

    protected static function booted(): void
    {
        static::deleting(function (Building $building) {
            // Cascade soft-delete: Building -> Floor -> Room -> Rack -> Device
            $building->floors()->each(function ($floor) {
                $floor->rooms()->each(function ($room) {
                    $room->racks()->each(function ($rack) {
                        // Delete device connections, documents, maintenances, simulations
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
                $floor->delete();
            });
        });
    }

    public function floors()
    {
        return $this->hasMany(Floor::class);
    }
}
