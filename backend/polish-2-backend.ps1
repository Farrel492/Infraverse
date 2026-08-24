if (-not (Test-Path "artisan")) {
    Write-Host "ERROR: jalankan dari folder backend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "app\Http\Controllers\Api" | Out-Null

Write-Host "Menulis MaintenanceController..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Maintenance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Maintenance::with(['device', 'technician'])
            ->orderBy('scheduled_date')
            ->get();
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id'      => ['required', 'exists:devices,id'],
            'type'           => ['required', 'in:preventive,corrective'],
            'scheduled_date' => ['required', 'date'],
            'notes'          => ['nullable', 'string'],
            'status'         => ['nullable', 'in:scheduled,in_progress,completed,cancelled'],
        ]);

        $data['technician_id'] = auth()->id();
        $maintenance = Maintenance::create($data);
        return response()->json($maintenance->load(['device','technician']), 201);
    }

    public function update(Request $request, Maintenance $maintenance): JsonResponse
    {
        $data = $request->validate([
            'device_id'       => ['sometimes', 'exists:devices,id'],
            'type'            => ['sometimes', 'in:preventive,corrective'],
            'scheduled_date'  => ['sometimes', 'date'],
            'completed_date'  => ['nullable', 'date'],
            'notes'           => ['nullable', 'string'],
            'status'          => ['sometimes', 'in:scheduled,in_progress,completed,cancelled'],
        ]);

        if (isset($data['status']) && $data['status'] === 'completed' && !$maintenance->completed_date) {
            $data['completed_date'] = now()->toDateString();
        }

        $maintenance->update($data);
        return response()->json($maintenance->load(['device','technician']));
    }

    public function destroy(Maintenance $maintenance): JsonResponse
    {
        $maintenance->delete();
        return response()->json(['message' => 'Jadwal maintenance dihapus.']);
    }
}
'@ | Set-Content -Path "app\Http\Controllers\Api\MaintenanceController.php" -Encoding ascii

Write-Host "Menulis ProfileController..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $request->user()->update($data);
        return response()->json(['user' => $request->user()]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'string', 'min:8', 'confirmed', Password::defaults()],
        ]);

        if (! Hash::check($request->current_password, $request->user()->password)) {
            return response()->json([
                'errors' => ['current_password' => ['Password saat ini salah.']],
            ], 422);
        }

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Password berhasil diubah.']);
    }
}
'@ | Set-Content -Path "app\Http\Controllers\Api\ProfileController.php" -Encoding ascii

Write-Host "Menulis DeviceDocumentController..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\DeviceDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DeviceDocumentController extends Controller
{
    public function store(Request $request, Device $device): JsonResponse
    {
        $request->validate([
            'document' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png,webp'],
            'name'     => ['nullable', 'string', 'max:255'],
        ]);

        $path = $request->file('document')->store("documents/device-{$device->id}", 'public');

        $doc = DeviceDocument::create([
            'device_id' => $device->id,
            'name'      => $request->name ?? $request->file('document')->getClientOriginalName(),
            'file_path' => $path,
            'type'      => $request->file('document')->getMimeType(),
        ]);

        return response()->json($doc, 201);
    }

    public function destroy(Device $device, DeviceDocument $document): JsonResponse
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
        return response()->json(['message' => 'Dokumen dihapus.']);
    }
}
'@ | Set-Content -Path "app\Http\Controllers\Api\DeviceDocumentController.php" -Encoding ascii

Write-Host "Update routes/api.php (final lengkap)..." -ForegroundColor Cyan

@'
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BuildingController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\DeviceDocumentController;
use App\Http\Controllers\Api\MappingController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\SimulationController;
use App\Http\Controllers\Api\DigitalTwinController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile
    Route::patch('/profile',          [ProfileController::class, 'update']);
    Route::patch('/profile/password', [ProfileController::class, 'changePassword']);

    // Buildings
    Route::get('/buildings',                   [BuildingController::class, 'index']);
    Route::get('/buildings/{building}',        [BuildingController::class, 'show']);
    Route::get('/buildings/{building}/floors', [BuildingController::class, 'floorIndex']);
    Route::get('/floors/{floor}/rooms',        [BuildingController::class, 'roomIndex']);
    Route::get('/rooms/{room}/racks',          [BuildingController::class, 'rackIndex']);

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

    // Simulation
    Route::get('/simulations',                     [SimulationController::class, 'index']);
    Route::get('/simulations/logs',                [SimulationController::class, 'logs']);
    Route::get('/simulations/{simulation}',        [SimulationController::class, 'show']);
    Route::post('/simulations/{simulation}/run',   [SimulationController::class, 'run']);
    Route::post('/simulation-logs/{log}/resolve',  [SimulationController::class, 'resolve']);

    // Digital Twin
    Route::get('/digital-twin/scene',                      [DigitalTwinController::class, 'scene']);
    Route::patch('/digital-twin/devices/{device}/status',  [DigitalTwinController::class, 'updateDeviceStatus']);

    // Maintenance — semua role bisa lihat
    Route::get('/maintenances', [MaintenanceController::class, 'index']);

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

        Route::post('/maintenances',                   [MaintenanceController::class, 'store']);
        Route::patch('/maintenances/{maintenance}',    [MaintenanceController::class, 'update']);
        Route::delete('/maintenances/{maintenance}',   [MaintenanceController::class, 'destroy']);

        Route::post('/devices/{device}/documents',              [DeviceDocumentController::class, 'store']);
        Route::delete('/devices/{device}/documents/{document}', [DeviceDocumentController::class, 'destroy']);
    });
});
'@ | Set-Content -Path "routes\api.php" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Backend polish-2 siap." -ForegroundColor Green
Write-Host "Lanjut jalankan polish-3.ps1 di folder frontend untuk Mapping animasi + Simulation timer + Digital Twin improvements." -ForegroundColor Yellow