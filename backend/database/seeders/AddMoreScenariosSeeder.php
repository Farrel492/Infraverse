<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SimulationScenario;
use App\Models\Device;

class AddMoreScenariosSeeder extends Seeder
{
    public function run(): void
    {
        $d43 = Device::find(43);
        $d44 = Device::find(44);
        $d45 = Device::find(45);

        $scenarios = [
            [
                'name' => 'Server BAAK Region Kalimalang Offline',
                'scenario_type' => 'server_offline',
                'device_id' => $d44?->id,
                'description' => 'Server database & portal BAAK mati mendadak, portal akademik mahasiswa tidak merespons.',
                'impact_description' => 'Seluruh mahasiswa dan staf tidak dapat mengakses portal KRS dan presensi online.',
                'affected_device_ids' => $d44 ? [$d44->id] : [],
            ],
            [
                'name' => 'Core Switch NOC Cisco Catalyst 9500 Down',
                'scenario_type' => 'switch_down',
                'device_id' => $d45?->id,
                'description' => 'Core Switch mengalami packet storm dan kernel crash, lampu port oranye statis.',
                'impact_description' => 'Seluruh koneksi LAN dan distribusi jaringan ke Lantai 1-6 terputus total.',
                'affected_device_ids' => array_values(array_filter([$d43?->id, $d44?->id, $d45?->id])),
            ],
            [
                'name' => 'Virtualization Node Dell PowerEdge R750 Crash',
                'scenario_type' => 'server_offline',
                'device_id' => $d43?->id,
                'description' => 'Hypervisor node mengalami kernel panic, 12 mesin virtual guest terhenti.',
                'impact_description' => 'Layanan cloud internal, DNS lokal, dan file server departemen tidak dapat diakses.',
                'affected_device_ids' => $d43 ? [$d43->id] : [],
            ],
            [
                'name' => 'Fiber Optic Backbone Cut - Koridor Kalimalang',
                'scenario_type' => 'fiber_cut',
                'device_id' => $d45?->id,
                'description' => 'Kabel fiber optik single mode terputus karena pekerjaan perbaikan plafon gedung.',
                'impact_description' => 'Redundansi link hilang dan koneksi uplink terputus antar gedung kampus.',
                'affected_device_ids' => array_values(array_filter([$d44?->id, $d45?->id])),
            ],
            [
                'name' => 'Kegagalan Daya Cadangan UPS Rack Data Center',
                'scenario_type' => 'ups_failure',
                'device_id' => $d43?->id,
                'description' => 'Listrik PLN padam dan inverter baterai UPS gagal mentransfer beban daya cadangan.',
                'impact_description' => 'Semua server dan network switch pada Rack Server mati seketika tanpa safe shutdown.',
                'affected_device_ids' => array_values(array_filter([$d43?->id, $d44?->id, $d45?->id])),
            ],
            [
                'name' => 'Gateway Router Utama Border Gateway Down',
                'scenario_type' => 'router_down',
                'device_id' => $d45?->id,
                'description' => 'BGP peering dan interface WAN gateway down karena lonjakan lalu lintas ekstrem.',
                'impact_description' => 'Akses internet publik dan VPN kampus terputus untuk seluruh civitas akademika.',
                'affected_device_ids' => array_values(array_filter([$d43?->id, $d44?->id, $d45?->id])),
            ],
        ];

        foreach ($scenarios as $s) {
            SimulationScenario::updateOrCreate(['name' => $s['name']], $s);
        }
    }
}
