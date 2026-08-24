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
