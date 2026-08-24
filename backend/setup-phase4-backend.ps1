if (-not (Test-Path "artisan")) {
    Write-Host "ERROR: jalankan dari folder backend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "app\Http\Controllers\Api" | Out-Null

Write-Host "Menulis MappingController..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\DeviceConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MappingController extends Controller
{
    public function topology(): JsonResponse
    {
        $devices = Device::with(['rack.room.floor.building'])
            ->get()
            ->map(fn($d) => [
                'id'       => $d->id,
                'name'     => $d->name,
                'type'     => $d->type,
                'status'   => $d->status,
                'ip'       => $d->ip_address,
                'vendor'   => $d->vendor,
                'model'    => $d->model,
                'location' => $d->rack?->room?->floor?->building?->name
                              . ($d->rack ? ' / ' . $d->rack->name : ''),
            ]);

        $connections = DeviceConnection::all()->map(fn($c) => [
            'id'              => $c->id,
            'source'          => $c->source_device_id,
            'target'          => $c->target_device_id,
            'type'            => $c->connection_type,
            'port_source'     => $c->port_source,
            'port_target'     => $c->port_target,
            'status'          => $c->status,
        ]);

        return response()->json([
            'nodes' => $devices,
            'edges' => $connections,
        ]);
    }

    public function storeConnection(Request $request): JsonResponse
    {
        $data = $request->validate([
            'source_device_id' => ['required', 'exists:devices,id'],
            'target_device_id' => ['required', 'exists:devices,id', 'different:source_device_id'],
            'connection_type'  => ['required', 'in:fiber,utp,wireless,other'],
            'port_source'      => ['nullable', 'string', 'max:50'],
            'port_target'      => ['nullable', 'string', 'max:50'],
        ]);

        $conn = DeviceConnection::create($data);
        return response()->json($conn, 201);
    }

    public function destroyConnection(DeviceConnection $connection): JsonResponse
    {
        $connection->delete();
        return response()->json(['message' => 'Koneksi dihapus.']);
    }
}
'@ | Set-Content -Path "app\Http\Controllers\Api\MappingController.php" -Encoding ascii

Write-Host "Menulis AnalyticsController..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Maintenance;
use App\Models\SimulationLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function summary(): JsonResponse
    {
        $devices   = Device::all();
        $today     = Carbon::today();
        $nextMonth = Carbon::today()->addDays(30);

        $byStatus = $devices->groupBy('status')->map->count();
        $byType   = $devices->groupBy('type')->map->count();

        $warrantyExpired = $devices->filter(
            fn($d) => $d->warranty_expiry && Carbon::parse($d->warranty_expiry)->lt($today)
        )->count();

        $warrantyExpiringSoon = $devices->filter(
            fn($d) => $d->warranty_expiry
                && Carbon::parse($d->warranty_expiry)->gte($today)
                && Carbon::parse($d->warranty_expiry)->lte($nextMonth)
        )->count();

        $oldDevices = $devices->filter(
            fn($d) => $d->purchase_date
                && Carbon::parse($d->purchase_date)->diffInYears($today) >= 5
        )->count();

        $maintenances = Maintenance::with('device')->get();
        $upcoming = $maintenances
            ->filter(fn($m) => $m->status === 'scheduled'
                && Carbon::parse($m->scheduled_date)->gte($today)
                && Carbon::parse($m->scheduled_date)->lte($nextMonth))
            ->values()
            ->map(fn($m) => [
                'device'         => $m->device?->name,
                'type'           => $m->type,
                'scheduled_date' => $m->scheduled_date,
                'status'         => $m->status,
            ]);

        $simLogs = SimulationLog::all();

        return response()->json([
            'total_devices'          => $devices->count(),
            'by_status'              => $byStatus,
            'by_type'                => $byType,
            'warranty_expired'       => $warrantyExpired,
            'warranty_expiring_soon' => $warrantyExpiringSoon,
            'old_devices'            => $oldDevices,
            'upcoming_maintenances'  => $upcoming,
            'total_maintenances'     => $maintenances->count(),
            'simulations_run'        => $simLogs->count(),
            'simulations_resolved'   => $simLogs->where('resolved', true)->count(),
        ]);
    }

    public function predictiveMaintenance(): JsonResponse
    {
        $today   = Carbon::today();
        $devices = Device::all();

        $alerts = [];

        foreach ($devices as $d) {
            $reasons = [];

            if ($d->warranty_expiry && Carbon::parse($d->warranty_expiry)->lt($today)) {
                $reasons[] = 'Garansi sudah habis';
            }

            if ($d->purchase_date) {
                $age = Carbon::parse($d->purchase_date)->diffInYears($today);
                if ($age >= 5) $reasons[] = "Usia perangkat {$age} tahun (≥5 tahun)";
            }

            if ($d->status === 'down' || $d->status === 'maintenance') {
                $reasons[] = 'Status: ' . $d->status;
            }

            if (count($reasons) > 0) {
                $alerts[] = [
                    'device_id' => $d->id,
                    'name'      => $d->name,
                    'type'      => $d->type,
                    'vendor'    => $d->vendor,
                    'status'    => $d->status,
                    'risk'      => count($reasons) >= 2 ? 'high' : 'medium',
                    'reasons'   => $reasons,
                ];
            }
        }

        usort($alerts, fn($a, $b) => ($b['risk'] === 'high') <=> ($a['risk'] === 'high'));

        return response()->json($alerts);
    }
}
'@ | Set-Content -Path "app\Http\Controllers\Api\AnalyticsController.php" -Encoding ascii

Write-Host "Update routes/api.php..." -ForegroundColor Cyan

@'
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BuildingController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\MappingController;
use App\Http\Controllers\Api\AnalyticsController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Buildings
    Route::get('/buildings',                [BuildingController::class, 'index']);
    Route::get('/buildings/{building}',     [BuildingController::class, 'show']);
    Route::get('/buildings/{building}/floors', [BuildingController::class, 'floorIndex']);
    Route::get('/floors/{floor}/rooms',     [BuildingController::class, 'roomIndex']);
    Route::get('/rooms/{room}/racks',       [BuildingController::class, 'rackIndex']);

    // Devices
    Route::get('/devices',              [DeviceController::class, 'index']);
    Route::get('/devices/{device}',     [DeviceController::class, 'show']);
    Route::get('/racks/{rack}/devices', [DeviceController::class, 'byRack']);

    // Mapping
    Route::get('/mapping/topology',                        [MappingController::class, 'topology']);
    Route::delete('/mapping/connections/{connection}',     [MappingController::class, 'destroyConnection']);

    // Analytics
    Route::get('/analytics/summary',               [AnalyticsController::class, 'summary']);
    Route::get('/analytics/predictive',            [AnalyticsController::class, 'predictiveMaintenance']);

    // Write — admin & teknisi only
    Route::middleware('role:admin,teknisi')->group(function () {
        Route::post('/buildings',                           [BuildingController::class, 'store']);
        Route::post('/buildings/{building}',                [BuildingController::class, 'update']);
        Route::delete('/buildings/{building}',              [BuildingController::class, 'destroy']);

        Route::post('/buildings/{building}/floors',         [BuildingController::class, 'floorStore']);
        Route::post('/buildings/{building}/floors/{floor}', [BuildingController::class, 'floorUpdate']);
        Route::delete('/buildings/{building}/floors/{floor}',[BuildingController::class, 'floorDestroy']);

        Route::post('/floors/{floor}/rooms',                [BuildingController::class, 'roomStore']);
        Route::post('/floors/{floor}/rooms/{room}',         [BuildingController::class, 'roomUpdate']);
        Route::delete('/floors/{floor}/rooms/{room}',       [BuildingController::class, 'roomDestroy']);

        Route::post('/rooms/{room}/racks',                  [BuildingController::class, 'rackStore']);
        Route::post('/rooms/{room}/racks/{rack}',           [BuildingController::class, 'rackUpdate']);
        Route::delete('/rooms/{room}/racks/{rack}',         [BuildingController::class, 'rackDestroy']);

        Route::post('/devices',           [DeviceController::class, 'store']);
        Route::post('/devices/{device}',  [DeviceController::class, 'update']);
        Route::delete('/devices/{device}',[DeviceController::class, 'destroy']);

        Route::post('/mapping/connections', [MappingController::class, 'storeConnection']);
    });
});
'@ | Set-Content -Path "routes\api.php" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Backend Phase 4+5 siap." -ForegroundColor Green
Write-Host "Lanjut jalankan setup-phase4-frontend.ps1 di folder frontend." -ForegroundColor Yellow