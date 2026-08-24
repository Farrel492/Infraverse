if (-not (Test-Path "artisan")) {
    Write-Host "ERROR: file 'artisan' tidak ditemukan di folder ini." -ForegroundColor Red
    Write-Host "Jalankan script ini dari dalam folder backend (cd backend dulu)." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "database\migrations","app\Models","database\seeders" | Out-Null

Write-Host "Menulis migrations..." -ForegroundColor Cyan

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['admin', 'teknisi', 'viewer'])->default('viewer');
            $table->string('phone')->nullable();
            $table->string('avatar')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
'@ | Set-Content -Path "database\migrations\0001_01_01_000000_create_users_table.php" -Encoding ascii

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buildings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->nullable();
            $table->unsignedInteger('total_floors')->default(1);
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->float('pos_x')->default(0);
            $table->float('pos_y')->default(0);
            $table->float('pos_z')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buildings');
    }
};
'@ | Set-Content -Path "database\migrations\2024_02_01_000001_create_buildings_table.php" -Encoding ascii

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('floors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('building_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->integer('floor_number');
            $table->float('pos_y')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('floors');
    }
};
'@ | Set-Content -Path "database\migrations\2024_02_01_000002_create_floors_table.php" -Encoding ascii

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('floor_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['server_room', 'office', 'classroom', 'lab', 'storage', 'other'])->default('other');
            $table->float('pos_x')->default(0);
            $table->float('pos_y')->default(0);
            $table->float('pos_z')->default(0);
            $table->float('width')->default(5);
            $table->float('depth')->default(5);
            $table->float('height')->default(3);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
'@ | Set-Content -Path "database\migrations\2024_02_01_000003_create_rooms_table.php" -Encoding ascii

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('racks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('position')->nullable();
            $table->unsignedInteger('total_u')->default(42);
            $table->float('pos_x')->default(0);
            $table->float('pos_y')->default(0);
            $table->float('pos_z')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('racks');
    }
};
'@ | Set-Content -Path "database\migrations\2024_02_01_000004_create_racks_table.php" -Encoding ascii

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rack_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->enum('type', ['router', 'switch', 'firewall', 'server', 'access_point', 'ups', 'other'])->default('other');
            $table->string('vendor')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable()->unique();
            $table->string('ip_address')->nullable();
            $table->string('mac_address')->nullable();
            $table->enum('status', ['active', 'inactive', 'maintenance', 'down'])->default('active');
            $table->date('purchase_date')->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->unsignedInteger('rack_position')->nullable();
            $table->unsignedInteger('rack_units')->default(1);
            $table->string('photo')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
'@ | Set-Content -Path "database\migrations\2024_02_01_000005_create_devices_table.php" -Encoding ascii

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('file_path');
            $table->string('type')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_documents');
    }
};
'@ | Set-Content -Path "database\migrations\2024_02_01_000006_create_device_documents_table.php" -Encoding ascii

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_device_id')->constrained('devices')->cascadeOnDelete();
            $table->foreignId('target_device_id')->constrained('devices')->cascadeOnDelete();
            $table->enum('connection_type', ['fiber', 'utp', 'wireless', 'other'])->default('utp');
            $table->string('port_source')->nullable();
            $table->string('port_target')->nullable();
            $table->enum('status', ['active', 'inactive', 'down'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_connections');
    }
};
'@ | Set-Content -Path "database\migrations\2024_02_01_000007_create_device_connections_table.php" -Encoding ascii

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['preventive', 'corrective'])->default('preventive');
            $table->date('scheduled_date');
            $table->date('completed_date')->nullable();
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenances');
    }
};
'@ | Set-Content -Path "database\migrations\2024_02_01_000008_create_maintenances_table.php" -Encoding ascii

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulation_scenarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->enum('scenario_type', ['router_down', 'switch_down', 'fiber_cut', 'ups_failure', 'server_offline'])->default('router_down');
            $table->text('description')->nullable();
            $table->text('impact_description')->nullable();
            $table->json('affected_device_ids')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulation_scenarios');
    }
};
'@ | Set-Content -Path "database\migrations\2024_02_01_000009_create_simulation_scenarios_table.php" -Encoding ascii

@'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scenario_id')->constrained('simulation_scenarios')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->json('steps')->nullable();
            $table->boolean('resolved')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulation_logs');
    }
};
'@ | Set-Content -Path "database\migrations\2024_02_01_000010_create_simulation_logs_table.php" -Encoding ascii

Write-Host "Menulis models..." -ForegroundColor Cyan

@'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function maintenances()
    {
        return $this->hasMany(Maintenance::class, 'technician_id');
    }

    public function simulationLogs()
    {
        return $this->hasMany(SimulationLog::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isTeknisi(): bool
    {
        return $this->role === 'teknisi';
    }
}
'@ | Set-Content -Path "app\Models\User.php" -Encoding ascii

@'
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
'@ | Set-Content -Path "app\Models\Building.php" -Encoding ascii

@'
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

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
'@ | Set-Content -Path "app\Models\Floor.php" -Encoding ascii

@'
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
'@ | Set-Content -Path "app\Models\Room.php" -Encoding ascii

@'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rack extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'room_id', 'name', 'position', 'total_u',
        'pos_x', 'pos_y', 'pos_z',
    ];

    protected $casts = [
        'pos_x' => 'float', 'pos_y' => 'float', 'pos_z' => 'float',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function devices()
    {
        return $this->hasMany(Device::class);
    }
}
'@ | Set-Content -Path "app\Models\Rack.php" -Encoding ascii

@'
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
'@ | Set-Content -Path "app\Models\Device.php" -Encoding ascii

@'
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
'@ | Set-Content -Path "app\Models\DeviceDocument.php" -Encoding ascii

@'
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
'@ | Set-Content -Path "app\Models\DeviceConnection.php" -Encoding ascii

@'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Maintenance extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id', 'technician_id', 'type', 'scheduled_date',
        'completed_date', 'status', 'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_date' => 'date',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
}
'@ | Set-Content -Path "app\Models\Maintenance.php" -Encoding ascii

@'
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
'@ | Set-Content -Path "app\Models\SimulationScenario.php" -Encoding ascii

@'
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
'@ | Set-Content -Path "app\Models\SimulationLog.php" -Encoding ascii

Write-Host "Menulis seeders..." -ForegroundColor Cyan

@'
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            InfraVerseSeeder::class,
        ]);
    }
}
'@ | Set-Content -Path "database\seeders\DatabaseSeeder.php" -Encoding ascii

@'
<?php

namespace Database\Seeders;

use App\Models\Building;
use App\Models\Device;
use App\Models\DeviceConnection;
use App\Models\Floor;
use App\Models\Maintenance;
use App\Models\Rack;
use App\Models\Room;
use App\Models\SimulationLog;
use App\Models\SimulationScenario;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InfraVerseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin Sistem',
            'email' => 'admin@infraverse.test',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $teknisi = User::create([
            'name' => 'Budi Santoso',
            'email' => 'teknisi@infraverse.test',
            'password' => Hash::make('password'),
            'role' => 'teknisi',
        ]);

        $viewer = User::create([
            'name' => 'Mahasiswa Demo',
            'email' => 'viewer@infraverse.test',
            'password' => Hash::make('password'),
            'role' => 'viewer',
        ]);

        $building = Building::create([
            'name' => 'Gedung Utama Kampus',
            'location' => 'Kampus Utama',
            'total_floors' => 3,
            'description' => 'Gedung pusat yang menampung ruang server dan jaringan inti kampus.',
        ]);

        $floor1 = Floor::create(['building_id' => $building->id, 'name' => 'Lantai 1', 'floor_number' => 1, 'pos_y' => 0]);
        Floor::create(['building_id' => $building->id, 'name' => 'Lantai 2', 'floor_number' => 2, 'pos_y' => 4]);
        Floor::create(['building_id' => $building->id, 'name' => 'Lantai 3', 'floor_number' => 3, 'pos_y' => 8]);

        $serverRoom = Room::create([
            'floor_id' => $floor1->id,
            'name' => 'Server Room A',
            'type' => 'server_room',
            'width' => 8, 'depth' => 6, 'height' => 3,
        ]);

        $rackA1 = Rack::create(['room_id' => $serverRoom->id, 'name' => 'Rack A1', 'position' => 'A1', 'total_u' => 42, 'pos_x' => -1.5]);
        $rackA2 = Rack::create(['room_id' => $serverRoom->id, 'name' => 'Rack A2', 'position' => 'A2', 'total_u' => 42, 'pos_x' => 1.5]);

        $router = Device::create([
            'rack_id' => $rackA1->id, 'name' => 'Router Utama', 'type' => 'router',
            'vendor' => 'MikroTik', 'model' => 'CCR2004-1G-12S+2XS', 'serial_number' => 'MKT-RT-0001',
            'ip_address' => '10.10.0.1', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addYear(),
            'rack_position' => 40, 'rack_units' => 1,
        ]);

        $firewall = Device::create([
            'rack_id' => $rackA1->id, 'name' => 'Firewall Utama', 'type' => 'firewall',
            'vendor' => 'Fortinet', 'model' => 'FortiGate 60F', 'serial_number' => 'FTN-FW-0001',
            'ip_address' => '10.10.0.2', 'status' => 'active',
            'purchase_date' => now()->subYears(3), 'warranty_expiry' => now()->subMonths(2),
            'rack_position' => 38, 'rack_units' => 1,
        ]);

        $coreSwitch = Device::create([
            'rack_id' => $rackA1->id, 'name' => 'Core Switch', 'type' => 'switch',
            'vendor' => 'Cisco', 'model' => 'Catalyst 9300', 'serial_number' => 'CSC-SW-0001',
            'ip_address' => '10.10.0.3', 'status' => 'active',
            'purchase_date' => now()->subYears(4), 'warranty_expiry' => now()->subYear(),
            'rack_position' => 34, 'rack_units' => 2,
        ]);

        $ups = Device::create([
            'rack_id' => $rackA1->id, 'name' => 'UPS Server Room', 'type' => 'ups',
            'vendor' => 'APC', 'model' => 'Smart-UPS 3000VA', 'serial_number' => 'APC-UPS-0001',
            'status' => 'active',
            'purchase_date' => now()->subYears(8), 'warranty_expiry' => now()->subYears(5),
            'rack_position' => 5, 'rack_units' => 3,
        ]);

        $distSwitch = Device::create([
            'rack_id' => $rackA2->id, 'name' => 'Distribution Switch', 'type' => 'switch',
            'vendor' => 'Cisco', 'model' => 'Catalyst 2960', 'serial_number' => 'CSC-SW-0002',
            'ip_address' => '10.10.1.1', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addMonths(6),
            'rack_position' => 38, 'rack_units' => 1,
        ]);

        $accessSwitch = Device::create([
            'rack_id' => $rackA2->id, 'name' => 'Access Switch Lt.1', 'type' => 'switch',
            'vendor' => 'TP-Link', 'model' => 'TL-SG1024', 'serial_number' => 'TPL-SW-0001',
            'ip_address' => '10.10.1.2', 'status' => 'active',
            'purchase_date' => now()->subMonths(10), 'warranty_expiry' => now()->addYears(2),
            'rack_position' => 35, 'rack_units' => 1,
        ]);

        $server = Device::create([
            'rack_id' => $rackA2->id, 'name' => 'Server Aplikasi', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R740', 'serial_number' => 'DELL-SRV-0001',
            'ip_address' => '10.10.2.10', 'status' => 'active',
            'purchase_date' => now()->subYear(), 'warranty_expiry' => now()->addYears(2),
            'rack_position' => 28, 'rack_units' => 2,
        ]);

        $ap = Device::create([
            'rack_id' => null, 'name' => 'Access Point Lt.1', 'type' => 'access_point',
            'vendor' => 'Ubiquiti', 'model' => 'UniFi U6-Pro', 'serial_number' => 'UBNT-AP-0001',
            'ip_address' => '10.10.1.50', 'status' => 'active',
            'purchase_date' => now()->subMonths(6), 'warranty_expiry' => now()->addMonths(18),
        ]);

        DeviceConnection::create(['source_device_id' => $router->id, 'target_device_id' => $firewall->id, 'connection_type' => 'utp', 'port_source' => 'ether1', 'port_target' => 'wan1']);
        DeviceConnection::create(['source_device_id' => $firewall->id, 'target_device_id' => $coreSwitch->id, 'connection_type' => 'utp', 'port_source' => 'internal', 'port_target' => 'gi1/0/1']);
        DeviceConnection::create(['source_device_id' => $coreSwitch->id, 'target_device_id' => $distSwitch->id, 'connection_type' => 'fiber', 'port_source' => 'gi1/0/24', 'port_target' => 'gi0/1']);
        DeviceConnection::create(['source_device_id' => $distSwitch->id, 'target_device_id' => $accessSwitch->id, 'connection_type' => 'utp', 'port_source' => 'gi0/2', 'port_target' => 'port1']);
        DeviceConnection::create(['source_device_id' => $accessSwitch->id, 'target_device_id' => $ap->id, 'connection_type' => 'utp', 'port_source' => 'port10', 'port_target' => 'eth0']);
        DeviceConnection::create(['source_device_id' => $coreSwitch->id, 'target_device_id' => $server->id, 'connection_type' => 'utp', 'port_source' => 'gi1/0/12', 'port_target' => 'nic1']);

        Maintenance::create([
            'device_id' => $ups->id, 'technician_id' => $teknisi->id, 'type' => 'preventive',
            'scheduled_date' => now()->addWeek(), 'status' => 'scheduled',
            'notes' => 'Cek kapasitas baterai UPS, ganti jika di bawah 80 persen.',
        ]);

        Maintenance::create([
            'device_id' => $router->id, 'technician_id' => $teknisi->id, 'type' => 'corrective',
            'scheduled_date' => now()->subDays(10), 'completed_date' => now()->subDays(9), 'status' => 'completed',
            'notes' => 'Restart router karena firmware freeze, sudah update ke versi terbaru.',
        ]);

        $scenarioRouter = SimulationScenario::create([
            'device_id' => $router->id, 'name' => 'Router Utama Down', 'scenario_type' => 'router_down',
            'description' => 'Simulasi ketika router utama berhenti merespons total.',
            'impact_description' => 'Seluruh jaringan kampus kehilangan akses internet.',
            'affected_device_ids' => [$firewall->id, $coreSwitch->id, $distSwitch->id, $accessSwitch->id, $ap->id],
        ]);

        SimulationScenario::create([
            'device_id' => $coreSwitch->id, 'name' => 'Core Switch Down', 'scenario_type' => 'switch_down',
            'description' => 'Simulasi core switch mati mendadak.',
            'impact_description' => 'Distribusi jaringan ke semua lantai terputus.',
            'affected_device_ids' => [$distSwitch->id, $accessSwitch->id, $ap->id, $server->id],
        ]);

        SimulationScenario::create([
            'device_id' => $distSwitch->id, 'name' => 'Fiber Optik Putus Core-Distribution', 'scenario_type' => 'fiber_cut',
            'description' => 'Simulasi kabel fiber optik antara core switch dan distribution switch terputus.',
            'impact_description' => 'Lantai yang terhubung ke distribution switch kehilangan koneksi.',
            'affected_device_ids' => [$accessSwitch->id, $ap->id],
        ]);

        SimulationScenario::create([
            'device_id' => $ups->id, 'name' => 'UPS Gagal Berfungsi', 'scenario_type' => 'ups_failure',
            'description' => 'Simulasi UPS gagal menyuplai daya cadangan saat listrik padam.',
            'impact_description' => 'Seluruh perangkat di rack berisiko mati mendadak.',
            'affected_device_ids' => [$router->id, $firewall->id, $coreSwitch->id],
        ]);

        SimulationScenario::create([
            'device_id' => $server->id, 'name' => 'Server Aplikasi Offline', 'scenario_type' => 'server_offline',
            'description' => 'Simulasi server aplikasi tidak dapat diakses.',
            'impact_description' => 'Layanan akademik online tidak dapat diakses pengguna.',
            'affected_device_ids' => [],
        ]);

        SimulationLog::create([
            'scenario_id' => $scenarioRouter->id, 'user_id' => $viewer->id,
            'started_at' => now()->subDay(), 'ended_at' => now()->subDay()->addMinutes(15),
            'steps' => [
                'Memeriksa status LED pada router',
                'Melakukan power cycle pada router',
                'Memeriksa kabel WAN dari ISP',
                'Menghubungi ISP untuk validasi jalur',
            ],
            'resolved' => true,
        ]);
    }
}
'@ | Set-Content -Path "database\seeders\InfraVerseSeeder.php" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. 11 migration, 11 model, 2 seeder berhasil ditulis." -ForegroundColor Green
Write-Host "Lanjut jalankan: php artisan migrate:fresh --seed" -ForegroundColor Yellow