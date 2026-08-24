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
