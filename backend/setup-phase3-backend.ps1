if (-not (Test-Path "artisan")) {
    Write-Host "ERROR: jalankan dari folder backend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "app\Http\Controllers\Api","app\Http\Requests" | Out-Null

Write-Host "Menulis Form Requests..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BuildingRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'location'     => ['nullable', 'string', 'max:255'],
            'total_floors' => ['nullable', 'integer', 'min:1'],
            'description'  => ['nullable', 'string'],
            'image'        => ['nullable', 'image', 'max:2048'],
        ];
    }
}
'@ | Set-Content -Path "app\Http\Requests\BuildingRequest.php" -Encoding ascii

@'
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FloorRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'building_id'  => ['required', 'exists:buildings,id'],
            'name'         => ['required', 'string', 'max:255'],
            'floor_number' => ['required', 'integer'],
        ];
    }
}
'@ | Set-Content -Path "app\Http\Requests\FloorRequest.php" -Encoding ascii

@'
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoomRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'floor_id' => ['required', 'exists:floors,id'],
            'name'     => ['required', 'string', 'max:255'],
            'type'     => ['required', 'in:server_room,office,classroom,lab,storage,other'],
            'width'    => ['nullable', 'numeric', 'min:0'],
            'depth'    => ['nullable', 'numeric', 'min:0'],
            'height'   => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
'@ | Set-Content -Path "app\Http\Requests\RoomRequest.php" -Encoding ascii

@'
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RackRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'room_id'  => ['required', 'exists:rooms,id'],
            'name'     => ['required', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:50'],
            'total_u'  => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
'@ | Set-Content -Path "app\Http\Requests\RackRequest.php" -Encoding ascii

@'
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeviceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'rack_id'        => ['nullable', 'exists:racks,id'],
            'name'           => ['required', 'string', 'max:255'],
            'type'           => ['required', 'in:router,switch,firewall,server,access_point,ups,other'],
            'vendor'         => ['nullable', 'string', 'max:255'],
            'model'          => ['nullable', 'string', 'max:255'],
            'serial_number'  => ['nullable', 'string', 'max:255'],
            'ip_address'     => ['nullable', 'ip'],
            'mac_address'    => ['nullable', 'string', 'max:17'],
            'status'         => ['nullable', 'in:active,inactive,maintenance,down'],
            'purchase_date'  => ['nullable', 'date'],
            'warranty_expiry'=> ['nullable', 'date'],
            'rack_position'  => ['nullable', 'integer', 'min:1'],
            'rack_units'     => ['nullable', 'integer', 'min:1'],
            'photo'          => ['nullable', 'image', 'max:2048'],
        ];
    }
}
'@ | Set-Content -Path "app\Http\Requests\DeviceRequest.php" -Encoding ascii

Write-Host "Menulis BuildingController..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BuildingRequest;
use App\Http\Requests\FloorRequest;
use App\Http\Requests\RoomRequest;
use App\Http\Requests\RackRequest;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Room;
use App\Models\Rack;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class BuildingController extends Controller
{
    // ── BUILDINGS ──────────────────────────────────────────
    public function index(): JsonResponse
    {
        $buildings = Building::withCount(['floors'])->orderBy('name')->get();
        return response()->json($buildings);
    }

    public function store(BuildingRequest $request): JsonResponse
    {
        $data = $request->validated();
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('buildings', 'public');
        }
        $building = Building::create($data);
        return response()->json($building, 201);
    }

    public function show(Building $building): JsonResponse
    {
        $building->load(['floors.rooms.racks.devices']);
        return response()->json($building);
    }

    public function update(BuildingRequest $request, Building $building): JsonResponse
    {
        $data = $request->validated();
        if ($request->hasFile('image')) {
            if ($building->image) Storage::disk('public')->delete($building->image);
            $data['image'] = $request->file('image')->store('buildings', 'public');
        }
        $building->update($data);
        return response()->json($building);
    }

    public function destroy(Building $building): JsonResponse
    {
        if ($building->image) Storage::disk('public')->delete($building->image);
        $building->delete();
        return response()->json(['message' => 'Gedung berhasil dihapus.']);
    }

    // ── FLOORS ─────────────────────────────────────────────
    public function floorIndex(Building $building): JsonResponse
    {
        return response()->json($building->floors()->withCount('rooms')->orderBy('floor_number')->get());
    }

    public function floorStore(FloorRequest $request, Building $building): JsonResponse
    {
        $floor = $building->floors()->create($request->validated());
        return response()->json($floor, 201);
    }

    public function floorUpdate(FloorRequest $request, Building $building, Floor $floor): JsonResponse
    {
        $floor->update($request->validated());
        return response()->json($floor);
    }

    public function floorDestroy(Building $building, Floor $floor): JsonResponse
    {
        $floor->delete();
        return response()->json(['message' => 'Lantai berhasil dihapus.']);
    }

    // ── ROOMS ──────────────────────────────────────────────
    public function roomIndex(Floor $floor): JsonResponse
    {
        return response()->json($floor->rooms()->withCount('racks')->get());
    }

    public function roomStore(RoomRequest $request, Floor $floor): JsonResponse
    {
        $room = $floor->rooms()->create($request->validated());
        return response()->json($room, 201);
    }

    public function roomUpdate(RoomRequest $request, Floor $floor, Room $room): JsonResponse
    {
        $room->update($request->validated());
        return response()->json($room);
    }

    public function roomDestroy(Floor $floor, Room $room): JsonResponse
    {
        $room->delete();
        return response()->json(['message' => 'Ruangan berhasil dihapus.']);
    }

    // ── RACKS ──────────────────────────────────────────────
    public function rackIndex(Room $room): JsonResponse
    {
        return response()->json($room->racks()->withCount('devices')->get());
    }

    public function rackStore(RackRequest $request, Room $room): JsonResponse
    {
        $rack = $room->racks()->create($request->validated());
        return response()->json($rack, 201);
    }

    public function rackUpdate(RackRequest $request, Room $room, Rack $rack): JsonResponse
    {
        $rack->update($request->validated());
        return response()->json($rack);
    }

    public function rackDestroy(Room $room, Rack $rack): JsonResponse
    {
        $rack->delete();
        return response()->json(['message' => 'Rack berhasil dihapus.']);
    }
}
'@ | Set-Content -Path "app\Http\Controllers\Api\BuildingController.php" -Encoding ascii

Write-Host "Menulis DeviceController..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeviceRequest;
use App\Models\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DeviceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Device::with(['rack.room.floor.building']);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('ip_address', 'like', "%{$request->search}%")
                  ->orWhere('serial_number', 'like', "%{$request->search}%")
                  ->orWhere('vendor', 'like', "%{$request->search}%");
            });
        }

        $devices = $query->orderBy('name')->get()->map(function ($device) {
            $device->age_in_years     = $device->age_in_years;
            $device->is_under_warranty = $device->is_under_warranty;
            return $device;
        });

        return response()->json($devices);
    }

    public function store(DeviceRequest $request): JsonResponse
    {
        $data = $request->validated();
        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('devices', 'public');
        }
        $device = Device::create($data);
        return response()->json($device->load('rack.room.floor.building'), 201);
    }

    public function show(Device $device): JsonResponse
    {
        $device->load(['rack.room.floor.building', 'documents', 'maintenances.technician', 'sourceConnections.targetDevice', 'targetConnections.sourceDevice']);
        $device->age_in_years      = $device->age_in_years;
        $device->is_under_warranty = $device->is_under_warranty;
        return response()->json($device);
    }

    public function update(DeviceRequest $request, Device $device): JsonResponse
    {
        $data = $request->validated();
        if ($request->hasFile('photo')) {
            if ($device->photo) Storage::disk('public')->delete($device->photo);
            $data['photo'] = $request->file('photo')->store('devices', 'public');
        }
        $device->update($data);
        return response()->json($device->load('rack.room.floor.building'));
    }

    public function destroy(Device $device): JsonResponse
    {
        if ($device->photo) Storage::disk('public')->delete($device->photo);
        $device->delete();
        return response()->json(['message' => 'Perangkat berhasil dihapus.']);
    }

    public function byRack(int $rackId): JsonResponse
    {
        $devices = Device::where('rack_id', $rackId)
            ->orderBy('rack_position')
            ->get()
            ->map(function ($device) {
                $device->is_under_warranty = $device->is_under_warranty;
                return $device;
            });
        return response()->json($devices);
    }
}
'@ | Set-Content -Path "app\Http\Controllers\Api\DeviceController.php" -Encoding ascii

Write-Host "Menulis routes/api.php (update)..." -ForegroundColor Cyan

@'
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BuildingController;
use App\Http\Controllers\Api\DeviceController;
use Illuminate\Support\Facades\Route;

// ── Public ──────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Authenticated ────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me',     [AuthController::class, 'me']);
    Route::post('/logout',[AuthController::class, 'logout']);

    // Buildings & hierarchy (semua role bisa read)
    Route::get('/buildings',                                    [BuildingController::class, 'index']);
    Route::get('/buildings/{building}',                         [BuildingController::class, 'show']);
    Route::get('/buildings/{building}/floors',                  [BuildingController::class, 'floorIndex']);
    Route::get('/floors/{floor}/rooms',                         [BuildingController::class, 'roomIndex']);
    Route::get('/rooms/{room}/racks',                           [BuildingController::class, 'rackIndex']);

    // Devices (semua role bisa read)
    Route::get('/devices',           [DeviceController::class, 'index']);
    Route::get('/devices/{device}',  [DeviceController::class, 'show']);
    Route::get('/racks/{rack}/devices', [DeviceController::class, 'byRack']);

    // Write operations — hanya admin & teknisi
    Route::middleware('role:admin,teknisi')->group(function () {
        Route::post('/buildings',                               [BuildingController::class, 'store']);
        Route::post('/buildings/{building}',                    [BuildingController::class, 'update']);
        Route::delete('/buildings/{building}',                  [BuildingController::class, 'destroy']);

        Route::post('/buildings/{building}/floors',             [BuildingController::class, 'floorStore']);
        Route::post('/buildings/{building}/floors/{floor}',     [BuildingController::class, 'floorUpdate']);
        Route::delete('/buildings/{building}/floors/{floor}',   [BuildingController::class, 'floorDestroy']);

        Route::post('/floors/{floor}/rooms',                    [BuildingController::class, 'roomStore']);
        Route::post('/floors/{floor}/rooms/{room}',             [BuildingController::class, 'roomUpdate']);
        Route::delete('/floors/{floor}/rooms/{room}',           [BuildingController::class, 'roomDestroy']);

        Route::post('/rooms/{room}/racks',                      [BuildingController::class, 'rackStore']);
        Route::post('/rooms/{room}/racks/{rack}',               [BuildingController::class, 'rackUpdate']);
        Route::delete('/rooms/{room}/racks/{rack}',             [BuildingController::class, 'rackDestroy']);

        Route::post('/devices',          [DeviceController::class, 'store']);
        Route::post('/devices/{device}', [DeviceController::class, 'update']);
        Route::delete('/devices/{device}',[DeviceController::class, 'destroy']);
    });
});
'@ | Set-Content -Path "routes\api.php" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Backend Phase 3 siap." -ForegroundColor Green
Write-Host "Lanjut jalankan setup-phase3-frontend.ps1 di folder frontend." -ForegroundColor Yellow