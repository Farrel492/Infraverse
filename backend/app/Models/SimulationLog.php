<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SimulationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'scenario_id', 'user_id', 'started_at', 'ended_at', 'steps', 'resolved',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'steps' => 'array',
        'resolved' => 'boolean',
    ];

    public function scenario()
    {
        return $this->belongsTo(SimulationScenario::class, 'scenario_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
