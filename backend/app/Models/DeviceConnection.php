<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceConnection extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_device_id', 'target_device_id', 'connection_type',
        'port_source', 'port_target', 'status',
    ];

    public function sourceDevice()
    {
        return $this->belongsTo(Device::class, 'source_device_id');
    }

    public function targetDevice()
    {
        return $this->belongsTo(Device::class, 'target_device_id');
    }
}
