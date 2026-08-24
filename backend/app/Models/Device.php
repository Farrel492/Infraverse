<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Device extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'rack_id', 'name', 'type', 'vendor', 'model', 'serial_number',
        'ip_address', 'mac_address', 'status', 'purchase_date',
        'warranty_expiry', 'rack_position', 'rack_units', 'photo',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_expiry' => 'date',
    ];

    public function rack()
    {
        return $this->belongsTo(Rack::class);
    }

    public function documents()
    {
        return $this->hasMany(DeviceDocument::class);
    }

    public function maintenances()
    {
        return $this->hasMany(Maintenance::class);
    }

    public function simulationScenarios()
    {
        return $this->hasMany(SimulationScenario::class);
    }

    public function sourceConnections()
    {
        return $this->hasMany(DeviceConnection::class, 'source_device_id');
    }

    public function targetConnections()
    {
        return $this->hasMany(DeviceConnection::class, 'target_device_id');
    }

    public function getAgeInYearsAttribute(): ?float
    {
        if (! $this->purchase_date) {
            return null;
        }

        return round($this->purchase_date->diffInDays(Carbon::now()) / 365, 1);
    }

    public function getIsUnderWarrantyAttribute(): bool
    {
        if (! $this->warranty_expiry) {
            return false;
        }

        return Carbon::now()->lte($this->warranty_expiry);
    }
}
