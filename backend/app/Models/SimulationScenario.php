<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SimulationScenario extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id', 'name', 'scenario_type', 'description',
        'impact_description', 'affected_device_ids',
    ];

    protected $casts = [
        'affected_device_ids' => 'array',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function logs()
    {
        return $this->hasMany(SimulationLog::class, 'scenario_id');
    }
}
