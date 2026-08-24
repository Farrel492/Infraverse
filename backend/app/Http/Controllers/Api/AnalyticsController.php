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
                if ($age >= 5) $reasons[] = "Usia perangkat {$age} tahun (???5 tahun)";
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
