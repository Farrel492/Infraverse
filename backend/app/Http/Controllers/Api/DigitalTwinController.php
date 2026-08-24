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
                        'id'         => $rack->id,
                        'name'       => $rack->name,
                        'total_u'    => $rack->total_u,
                        'position'   => $rack->position,
                        'x'          => $rack->pos_x ?: $rackX,
                        'y'          => $rack->pos_y ?: $rackY,
                        'z'          => $rack->pos_z ?: $rackZ,
                        'room_id'    => $room->id,
                        'room_name'  => $room->name,
                        'room_type'  => $room->type,
                        'floor_id'   => $floor->id,
                        'floor_name' => $floor->name,
                        'floor_number' => $floor->floor_number ?? ($fi + 1),
                        'devices'    => $devices3d,
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
