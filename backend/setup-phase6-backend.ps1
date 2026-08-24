if (-not (Test-Path "artisan")) {
    Write-Host "ERROR: jalankan dari folder backend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "app\Http\Controllers\Api" | Out-Null

Write-Host "Menulis SimulationController..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SimulationLog;
use App\Models\SimulationScenario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SimulationController extends Controller
{
    public function index(): JsonResponse
    {
        $scenarios = SimulationScenario::with(['device', 'logs' => function ($q) {
            $q->latest()->limit(1);
        }])->get()->map(function ($s) {
            return [
                'id'                 => $s->id,
                'name'               => $s->name,
                'scenario_type'      => $s->scenario_type,
                'description'        => $s->description,
                'impact_description' => $s->impact_description,
                'affected_device_ids'=> $s->affected_device_ids ?? [],
                'device'             => $s->device ? [
                    'id'   => $s->device->id,
                    'name' => $s->device->name,
                    'type' => $s->device->type,
                ] : null,
                'times_run'   => $s->logs->count(),
                'last_run'    => $s->logs->first()?->created_at,
            ];
        });

        return response()->json($scenarios);
    }

    public function show(SimulationScenario $simulation): JsonResponse
    {
        $simulation->load(['device', 'logs.user']);
        return response()->json($simulation);
    }

    public function run(SimulationScenario $simulation): JsonResponse
    {
        $steps = $this->generateSteps($simulation->scenario_type, $simulation->device);

        $log = SimulationLog::create([
            'scenario_id' => $simulation->id,
            'user_id'     => auth()->id(),
            'started_at'  => Carbon::now(),
            'steps'       => $steps,
            'resolved'    => false,
        ]);

        return response()->json([
            'log_id'   => $log->id,
            'steps'    => $steps,
            'scenario' => [
                'name'               => $simulation->name,
                'scenario_type'      => $simulation->scenario_type,
                'impact_description' => $simulation->impact_description,
                'affected_device_ids'=> $simulation->affected_device_ids ?? [],
            ],
        ]);
    }

    public function resolve(SimulationLog $log): JsonResponse
    {
        $log->update([
            'resolved' => true,
            'ended_at' => Carbon::now(),
        ]);

        return response()->json([
            'message'     => 'Simulasi berhasil diselesaikan.',
            'duration_seconds' => $log->started_at
                ? Carbon::parse($log->started_at)->diffInSeconds(Carbon::now())
                : null,
        ]);
    }

    public function logs(): JsonResponse
    {
        $logs = SimulationLog::with(['scenario', 'user'])
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn($l) => [
                'id'          => $l->id,
                'scenario'    => $l->scenario?->name,
                'type'        => $l->scenario?->scenario_type,
                'user'        => $l->user?->name,
                'started_at'  => $l->started_at,
                'ended_at'    => $l->ended_at,
                'resolved'    => $l->resolved,
                'duration'    => $l->started_at && $l->ended_at
                    ? Carbon::parse($l->started_at)->diffInSeconds($l->ended_at)
                    : null,
            ]);

        return response()->json($logs);
    }

    private function generateSteps(string $type, $device): array
    {
        $name = $device?->name ?? 'perangkat';

        $playbooks = [
            'router_down' => [
                "🔍 Deteksi: {$name} tidak merespons ping dari sistem monitoring",
                "📋 Catat waktu kejadian dan dampak pada koneksi downstream",
                "🔌 Periksa koneksi fisik kabel WAN dan power supply {$name}",
                "💻 Akses console port atau manajemen out-of-band jika tersedia",
                "🔄 Coba restart service routing: restart {$name} via CLI",
                "📡 Verifikasi routing table dan BGP/OSPF neighbor setelah restart",
                "🌐 Test konektivitas internet dari beberapa client internal",
                "📞 Eskalasi ke ISP jika masalah ada di sisi upstream",
                "📝 Dokumentasikan root cause dan buat laporan insiden",
                "✅ Konfirmasi semua layanan kembali normal",
            ],
            'switch_down' => [
                "🔍 Deteksi: {$name} tidak merespons SNMP polling",
                "💡 Periksa lampu indikator power dan port di {$name}",
                "🔌 Cek kondisi power supply dan kabel power {$name}",
                "📋 Identifikasi port dan VLAN yang terdampak",
                "🔄 Hard reset {$name} jika soft reboot tidak berhasil",
                "⚙️ Restore konfigurasi dari backup jika diperlukan",
                "🔗 Verifikasi Spanning Tree Protocol tidak loop setelah online",
                "📊 Cek log error switch untuk identifikasi penyebab",
                "✅ Test konektivitas semua port yang terhubung",
                "📝 Update dokumentasi dan jadwal preventive maintenance",
            ],
            'fiber_cut' => [
                "🔍 Deteksi: Link down pada port uplink {$name}",
                "📡 Konfirmasi fiber cut dengan OTDR test jika tersedia",
                "🗺️ Identifikasi titik putus menggunakan peta jalur kabel",
                "🚨 Notifikasi tim lapangan untuk inspeksi fisik jalur fiber",
                "🔄 Aktifkan jalur backup / redundant path jika tersedia",
                "📞 Hubungi vendor fiber untuk estimasi waktu perbaikan",
                "⏱️ Update stakeholder tentang estimasi downtime",
                "🔧 Koordinasi splicing fiber dengan teknisi bersertifikat",
                "🔗 Test BER (Bit Error Rate) setelah perbaikan",
                "✅ Verifikasi throughput normal dan tutup tiket insiden",
            ],
            'ups_failure' => [
                "🔍 Deteksi: {$name} mengeluarkan alarm atau tidak merespons SNMP",
                "🔋 Cek level baterai dan kondisi fisik {$name}",
                "⚡ Pastikan input power PLN dalam kondisi normal",
                "🌡️ Periksa suhu ruangan — UPS sensitif terhadap panas berlebih",
                "📋 Identifikasi perangkat kritis yang terhubung ke {$name}",
                "🔌 Pindahkan beban kritis ke UPS lain atau generator jika ada",
                "📞 Hubungi vendor APC/Eaton untuk emergency service",
                "🔧 Ganti baterai jika usia > 3 tahun atau kapasitas < 80%",
                "⚙️ Konfigurasi ulang threshold alarm setelah perbaikan",
                "✅ Load test UPS untuk verifikasi kapasitas normal",
            ],
            'server_offline' => [
                "🔍 Deteksi: {$name} tidak merespons ping dan HTTP health check",
                "💻 Akses iDRAC/iLO atau konsol fisik {$name}",
                "📊 Periksa log sistem: /var/log/syslog atau Event Viewer",
                "🔄 Coba restart layanan aplikasi yang bermasalah terlebih dahulu",
                "💾 Cek utilisasi disk — full disk sering menyebabkan crash",
                "🧠 Periksa RAM usage dan kemungkinan OOM killer aktif",
                "⚙️ Hard reboot {$name} jika layanan tidak bisa di-restart",
                "🗄️ Restore dari snapshot VM/backup jika ada korupsi data",
                "🔗 Verifikasi koneksi database dan dependency service",
                "✅ Jalankan smoke test aplikasi dan konfirmasi layanan online",
            ],
        ];

        return $playbooks[$type] ?? [
            "🔍 Deteksi masalah pada {$name}",
            "📋 Kumpulkan informasi dan identifikasi dampak",
            "🔧 Lakukan troubleshooting sesuai SOP",
            "✅ Verifikasi sistem kembali normal",
        ];
    }
}
'@ | Set-Content -Path "app\Http\Controllers\Api\SimulationController.php" -Encoding ascii

Write-Host "Menulis DigitalTwinController..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Building;
use App\Models\Device;
use App\Models\Rack;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DigitalTwinController extends Controller
{
    public function scene(Request $request): JsonResponse
    {
        $buildingId = $request->query('building_id', 1);

        $building = Building::with([
            'floors.rooms.racks.devices',
        ])->find($buildingId);

        if (! $building) {
            return response()->json(['message' => 'Gedung tidak ditemukan.'], 404);
        }

        $nodes  = [];
        $racks3d = [];

        $floorHeight = 4.5;
        $roomColors  = [
            'server_room' => '#1e40af',
            'office'      => '#065f46',
            'classroom'   => '#78350f',
            'lab'         => '#4c1d95',
            'storage'     => '#374151',
            'other'       => '#1f2937',
        ];

        foreach ($building->floors as $fi => $floor) {
            $baseY = $fi * $floorHeight;
            foreach ($floor->rooms as $ri => $room) {
                $roomX = ($ri % 3) * ($room->width + 1);
                $roomZ = floor($ri / 3) * ($room->depth + 1);

                $nodes[] = [
                    'id'    => "room-{$room->id}",
                    'type'  => 'room',
                    'label' => $room->name,
                    'color' => $roomColors[$room->type] ?? '#1f2937',
                    'x'     => $room->pos_x ?: $roomX,
                    'y'     => $room->pos_y ?: $baseY,
                    'z'     => $room->pos_z ?: $roomZ,
                    'w'     => $room->width,
                    'h'     => $room->height,
                    'd'     => $room->depth,
                ];

                foreach ($room->racks as $rackIdx => $rack) {
                    $rackX = ($room->pos_x ?: $roomX) + 1 + $rackIdx * 1.2;
                    $rackY = ($room->pos_y ?: $baseY);
                    $rackZ = ($room->pos_z ?: $roomZ) + 1;

                    $devices3d = $rack->devices->map(fn($d) => [
                        'id'     => $d->id,
                        'name'   => $d->name,
                        'type'   => $d->type,
                        'status' => $d->status,
                        'ip'     => $d->ip_address,
                        'vendor' => $d->vendor,
                        'model'  => $d->model,
                        'u_pos'  => $d->rack_position ?? 1,
                        'u_size' => $d->rack_units ?? 1,
                    ])->values();

                    $racks3d[] = [
                        'id'      => $rack->id,
                        'name'    => $rack->name,
                        'total_u' => $rack->total_u,
                        'x'       => $rack->pos_x ?: $rackX,
                        'y'       => $rack->pos_y ?: $rackY,
                        'z'       => $rack->pos_z ?: $rackZ,
                        'devices' => $devices3d,
                    ];
                }
            }
        }

        $statusSummary = Device::whereHas('rack.room.floor', fn($q) =>
            $q->where('building_id', $buildingId)
        )->get()->groupBy('status')->map->count();

        return response()->json([
            'building' => [
                'id'           => $building->id,
                'name'         => $building->name,
                'total_floors' => $building->total_floors,
            ],
            'nodes'          => $nodes,
            'racks'          => $racks3d,
            'status_summary' => $statusSummary,
        ]);
    }

    public function updateDeviceStatus(Request $request, Device $device): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:active,inactive,maintenance,down'],
        ]);

        $device->update(['status' => $request->status]);

        return response()->json([
            'message' => "Status {$device->name} diubah ke {$request->status}.",
            'device'  => $device,
        ]);
    }
}
'@ | Set-Content -Path "app\Http\Controllers\Api\DigitalTwinController.php" -Encoding ascii

Write-Host "Update routes/api.php (final)..." -ForegroundColor Cyan

@'
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BuildingController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\MappingController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\SimulationController;
use App\Http\Controllers\Api\DigitalTwinController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Buildings
    Route::get('/buildings',                   [BuildingController::class, 'index']);
    Route::get('/buildings/{building}',         [BuildingController::class, 'show']);
    Route::get('/buildings/{building}/floors',  [BuildingController::class, 'floorIndex']);
    Route::get('/floors/{floor}/rooms',         [BuildingController::class, 'roomIndex']);
    Route::get('/rooms/{room}/racks',           [BuildingController::class, 'rackIndex']);

    // Devices
    Route::get('/devices',               [DeviceController::class, 'index']);
    Route::get('/devices/{device}',      [DeviceController::class, 'show']);
    Route::get('/racks/{rack}/devices',  [DeviceController::class, 'byRack']);

    // Mapping
    Route::get('/mapping/topology',                    [MappingController::class, 'topology']);
    Route::delete('/mapping/connections/{connection}', [MappingController::class, 'destroyConnection']);

    // Analytics
    Route::get('/analytics/summary',    [AnalyticsController::class, 'summary']);
    Route::get('/analytics/predictive', [AnalyticsController::class, 'predictiveMaintenance']);

    // Simulation — semua role bisa run & resolve
    Route::get('/simulations',                        [SimulationController::class, 'index']);
    Route::get('/simulations/logs',                   [SimulationController::class, 'logs']);
    Route::get('/simulations/{simulation}',           [SimulationController::class, 'show']);
    Route::post('/simulations/{simulation}/run',      [SimulationController::class, 'run']);
    Route::post('/simulation-logs/{log}/resolve',     [SimulationController::class, 'resolve']);

    // Digital Twin
    Route::get('/digital-twin/scene',                         [DigitalTwinController::class, 'scene']);
    Route::patch('/digital-twin/devices/{device}/status',     [DigitalTwinController::class, 'updateDeviceStatus']);

    // Write — admin & teknisi only
    Route::middleware('role:admin,teknisi')->group(function () {
        Route::post('/buildings',                            [BuildingController::class, 'store']);
        Route::post('/buildings/{building}',                 [BuildingController::class, 'update']);
        Route::delete('/buildings/{building}',               [BuildingController::class, 'destroy']);

        Route::post('/buildings/{building}/floors',          [BuildingController::class, 'floorStore']);
        Route::post('/buildings/{building}/floors/{floor}',  [BuildingController::class, 'floorUpdate']);
        Route::delete('/buildings/{building}/floors/{floor}',[BuildingController::class, 'floorDestroy']);

        Route::post('/floors/{floor}/rooms',                 [BuildingController::class, 'roomStore']);
        Route::post('/floors/{floor}/rooms/{room}',          [BuildingController::class, 'roomUpdate']);
        Route::delete('/floors/{floor}/rooms/{room}',        [BuildingController::class, 'roomDestroy']);

        Route::post('/rooms/{room}/racks',                   [BuildingController::class, 'rackStore']);
        Route::post('/rooms/{room}/racks/{rack}',            [BuildingController::class, 'rackUpdate']);
        Route::delete('/rooms/{room}/racks/{rack}',          [BuildingController::class, 'rackDestroy']);

        Route::post('/devices',            [DeviceController::class, 'store']);
        Route::post('/devices/{device}',   [DeviceController::class, 'update']);
        Route::delete('/devices/{device}', [DeviceController::class, 'destroy']);

        Route::post('/mapping/connections', [MappingController::class, 'storeConnection']);
    });
});
'@ | Set-Content -Path "routes\api.php" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Backend Phase 6+7 siap." -ForegroundColor Green
Write-Host "Lanjut jalankan setup-phase6-frontend.ps1 di folder frontend." -ForegroundColor Yellow