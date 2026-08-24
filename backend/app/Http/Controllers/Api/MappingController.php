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
