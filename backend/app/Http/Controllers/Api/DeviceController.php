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
        if ($request->filled('building_id')) {
            $query->whereHas('rack.room.floor', fn($q) =>
                $q->where('building_id', $request->building_id)
            );
        }
        if ($request->filled('rack_id')) {
            $query->where('rack_id', $request->rack_id);
        }
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('ip_address', 'like', "%{$term}%")
                  ->orWhere('serial_number', 'like', "%{$term}%")
                  ->orWhere('vendor', 'like', "%{$term}%")
                  ->orWhere('model', 'like', "%{$term}%")
                  ->orWhere('type', 'like', "%{$term}%")
                  ->orWhereHas('rack', function ($rq) use ($term) {
                      $rq->where('name', 'like', "%{$term}%")
                        ->orWhereHas('room', function ($rmq) use ($term) {
                            $rmq->where('name', 'like', "%{$term}%")
                              ->orWhereHas('floor.building', function ($bq) use ($term) {
                                  $bq->where('name', 'like', "%{$term}%")
                                    ->orWhere('location', 'like', "%{$term}%");
                              });
                        });
                  });
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
