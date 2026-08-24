<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceDocument extends Model
{
    use HasFactory;

    protected $fillable = ['device_id', 'name', 'file_path', 'type'];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
