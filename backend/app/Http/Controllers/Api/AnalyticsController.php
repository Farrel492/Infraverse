<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Building;
use App\Models\Device;
use App\Models\Maintenance;
use App\Models\SimulationLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $maintenances = Maintenance::whereHas('device')->with('device')->get();

        $upcoming = $maintenances
            ->filter(fn($m) => $m->status === 'scheduled'
                && Carbon::parse($m->scheduled_date)->gte($today)
                && Carbon::parse($m->scheduled_date)->lte($nextMonth))
            ->values()
            ->map(fn($m) => [
                'id'             => $m->id,
                'device'         => $m->device?->name,
                'type'           => $m->type,
                'scheduled_date' => $m->scheduled_date,
                'status'         => $m->status,
            ]);

        $overdue = $maintenances
            ->filter(fn($m) => $m->status === 'scheduled'
                && Carbon::parse($m->scheduled_date)->lt($today))
            ->values()
            ->map(fn($m) => [
                'id'             => $m->id,
                'device'         => $m->device?->name,
                'type'           => $m->type,
                'scheduled_date' => $m->scheduled_date,
                'status'         => $m->status,
            ]);

        $downDevices = $devices->where('status', 'down')->values()->map(fn($d) => [
            'id'         => $d->id,
            'name'       => $d->name,
            'type'       => $d->type,
            'ip_address' => $d->ip_address,
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
            'overdue_maintenances'   => $overdue,
            'down_devices'           => $downDevices,
            'total_maintenances'     => $maintenances->count(),
            'simulations_run'        => $simLogs->count(),
            'simulations_resolved'   => $simLogs->where('resolved', true)->count(),
        ]);
    }

    /**
     * Power consumption with filters for building, device, and time period (day, week, month, year).
     */
    public function powerByBuilding(Request $request): JsonResponse
    {
        $buildings = Building::with([
            'floors.rooms.racks.devices'
        ])->get();

        $period     = $request->query('period', 'week'); // day | week | month | year
        $buildingId = $request->query('building_id');     // optional filter
        $deviceId   = $request->query('device_id');       // optional filter

        // Build list of all buildings & devices with their relationships
        $allBuildings = [];
        $allDevices   = [];
        $buildingDevicesMap = [];

        foreach ($buildings as $b) {
            $bDevices = collect();
            foreach ($b->floors as $floor) {
                foreach ($floor->rooms as $room) {
                    foreach ($room->racks as $rack) {
                        $bDevices = $bDevices->merge($rack->devices);
                    }
                }
            }

            $allBuildings[] = [
                'id'            => $b->id,
                'name'          => $b->name,
                'device_count'  => $bDevices->count(),
                'total_watt'    => $bDevices->sum('power_consumption_w'),
            ];

            foreach ($bDevices as $dev) {
                $devWatt = $dev->power_consumption_w;
                $devItem = [
                    'id'            => $dev->id,
                    'name'          => $dev->name,
                    'type'          => $dev->type,
                    'building_id'   => $b->id,
                    'building_name' => $b->name,
                    'watt'          => $devWatt,
                    'status'        => $dev->status,
                ];
                $allDevices[] = $devItem;
            }

            $buildingDevicesMap[$b->id] = $bDevices;
        }

        // Filter devices based on building_id & device_id
        $filteredDevices = collect();

        if ($deviceId && $deviceId !== 'all') {
            // Find specific device
            $singleDev = Device::find($deviceId);
            if ($singleDev) {
                $filteredDevices->push($singleDev);
            }
        } elseif ($buildingId && $buildingId !== 'all') {
            if (isset($buildingDevicesMap[$buildingId])) {
                $filteredDevices = $buildingDevicesMap[$buildingId];
            }
        } else {
            // All devices from all buildings
            foreach ($buildingDevicesMap as $bDevs) {
                $filteredDevices = $filteredDevices->merge($bDevs);
            }
        }

        $totalWatt = $filteredDevices->sum('power_consumption_w');

        // Build time-series labels and points
        $today = Carbon::today();
        $labels = [];
        $points = 0;
        $chartData = [];

        if ($period === 'day') {
            // 24 Hours
            $points = 24;
            $hourlyBaseKwh = $totalWatt / 1000;
            // Realistic diurnal curve: lowest around 03:00-04:00, peak 10:00-16:00
            for ($h = 0; $h < 24; $h++) {
                $label = sprintf('%02d:00', $h);
                $labels[] = $label;

                if ($h >= 8 && $h <= 18) {
                    $variation = 1.05 + 0.15 * sin(($h - 8) / 10 * M_PI);
                } else {
                    $variation = 0.72 + 0.10 * sin($h / 8 * M_PI);
                }
                $kwh = round($hourlyBaseKwh * $variation, 3);
                $w   = round($totalWatt * $variation, 1);
                $chartData[] = [
                    'label' => $label,
                    'kwh'   => $kwh,
                    'watt'  => $w,
                ];
            }
        } elseif ($period === 'week') {
            // 7 Days
            $points = 7;
            $dailyBaseKwh = ($totalWatt * 24) / 1000;
            for ($i = 6; $i >= 0; $i--) {
                $dayObj = $today->copy()->subDays($i);
                $label  = $dayObj->translatedFormat('D');
                $labels[] = $label;

                // Weekday vs Weekend variation
                $isWeekend = $dayObj->isWeekend();
                $factor    = $isWeekend ? 0.78 : (0.95 + (($i % 4) * 0.05));
                $kwh = round($dailyBaseKwh * $factor, 2);
                $w   = round($totalWatt * $factor, 1);
                $chartData[] = [
                    'label' => $label,
                    'kwh'   => $kwh,
                    'watt'  => $w,
                ];
            }
        } elseif ($period === 'month') {
            // 30 Days
            $points = 30;
            $dailyBaseKwh = ($totalWatt * 24) / 1000;
            for ($i = 29; $i >= 0; $i--) {
                $dayObj = $today->copy()->subDays($i);
                $label  = $dayObj->format('d/m');
                $labels[] = $label;

                $isWeekend = $dayObj->isWeekend();
                $factor    = $isWeekend ? 0.80 : (0.92 + (($i % 5) * 0.04));
                $kwh = round($dailyBaseKwh * $factor, 2);
                $w   = round($totalWatt * $factor, 1);
                $chartData[] = [
                    'label' => $label,
                    'kwh'   => $kwh,
                    'watt'  => $w,
                ];
            }
        } else { // year
            // 12 Months
            $points = 12;
            $monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
            $monthlyBaseKwh = ($totalWatt * 24 * 30.4) / 1000;
            for ($i = 11; $i >= 0; $i--) {
                $mIndex = $today->copy()->subMonths($i)->month - 1;
                $label  = $monthNames[$mIndex];
                $labels[] = $label;

                $factor = 0.88 + (($i % 6) * 0.045);
                $kwh = round($monthlyBaseKwh * $factor, 1);
                $w   = round($totalWatt * $factor, 1);
                $chartData[] = [
                    'label' => $label,
                    'kwh'   => $kwh,
                    'watt'  => $w,
                ];
            }
        }

        $totalKwhPeriod = round(collect($chartData)->sum('kwh'), 2);

        // Building breakdown
        $buildingBreakdown = [];
        foreach ($allBuildings as $b) {
            if ($buildingId && $buildingId !== 'all' && $b['id'] != $buildingId) continue;
            $bKwh = round(($b['total_watt'] * 24) / 1000, 2);
            $buildingBreakdown[] = [
                'building_id'   => $b['id'],
                'building_name' => $b['name'],
                'total_devices' => $b['device_count'],
                'total_watt'    => $b['total_watt'],
                'total_kwh'     => $bKwh,
            ];
        }

        return response()->json([
            'labels'             => $labels,
            'period'             => $period,
            'building_id'        => $buildingId ?: 'all',
            'device_id'          => $deviceId ?: 'all',
            'total_watt'         => $totalWatt,
            'total_kwh'          => $totalKwhPeriod,
            'chart_data'         => $chartData,
            'buildings'          => $buildingBreakdown,
            'all_buildings'      => $allBuildings,
            'all_devices'        => $allDevices,
            'filtered_count'     => $filteredDevices->count(),
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
