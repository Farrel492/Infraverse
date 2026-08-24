<?php

namespace Database\Seeders;

use App\Models\Building;
use App\Models\Device;
use App\Models\DeviceConnection;
use App\Models\Floor;
use App\Models\Maintenance;
use App\Models\Rack;
use App\Models\Room;
use App\Models\SimulationLog;
use App\Models\SimulationScenario;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InfraVerseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin Sistem',
            'email' => 'admin@infraverse.test',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $teknisi = User::create([
            'name' => 'Budi Santoso',
            'email' => 'teknisi@infraverse.test',
            'password' => Hash::make('password'),
            'role' => 'teknisi',
        ]);

        $viewer = User::create([
            'name' => 'Mahasiswa Demo',
            'email' => 'viewer@infraverse.test',
            'password' => Hash::make('password'),
            'role' => 'viewer',
        ]);

        $building = Building::create([
            'name' => 'Gedung Utama Kampus',
            'location' => 'Kampus Utama',
            'total_floors' => 3,
            'description' => 'Gedung pusat yang menampung ruang server dan jaringan inti kampus.',
        ]);

        $floor1 = Floor::create(['building_id' => $building->id, 'name' => 'Lantai 1', 'floor_number' => 1, 'pos_y' => 0]);
        Floor::create(['building_id' => $building->id, 'name' => 'Lantai 2', 'floor_number' => 2, 'pos_y' => 4]);
        Floor::create(['building_id' => $building->id, 'name' => 'Lantai 3', 'floor_number' => 3, 'pos_y' => 8]);

        $serverRoom = Room::create([
            'floor_id' => $floor1->id,
            'name' => 'Server Room A',
            'type' => 'server_room',
            'width' => 8, 'depth' => 6, 'height' => 3,
        ]);

        $rackA1 = Rack::create(['room_id' => $serverRoom->id, 'name' => 'Rack A1', 'position' => 'A1', 'total_u' => 42, 'pos_x' => -1.5]);
        $rackA2 = Rack::create(['room_id' => $serverRoom->id, 'name' => 'Rack A2', 'position' => 'A2', 'total_u' => 42, 'pos_x' => 1.5]);

        $router = Device::create([
            'rack_id' => $rackA1->id, 'name' => 'Router Utama', 'type' => 'router',
            'vendor' => 'MikroTik', 'model' => 'CCR2004-1G-12S+2XS', 'serial_number' => 'MKT-RT-0001',
            'ip_address' => '10.10.0.1', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addYear(),
            'rack_position' => 40, 'rack_units' => 1,
        ]);

        $firewall = Device::create([
            'rack_id' => $rackA1->id, 'name' => 'Firewall Utama', 'type' => 'firewall',
            'vendor' => 'Fortinet', 'model' => 'FortiGate 60F', 'serial_number' => 'FTN-FW-0001',
            'ip_address' => '10.10.0.2', 'status' => 'active',
            'purchase_date' => now()->subYears(3), 'warranty_expiry' => now()->subMonths(2),
            'rack_position' => 38, 'rack_units' => 1,
        ]);

        $coreSwitch = Device::create([
            'rack_id' => $rackA1->id, 'name' => 'Core Switch', 'type' => 'switch',
            'vendor' => 'Cisco', 'model' => 'Catalyst 9300', 'serial_number' => 'CSC-SW-0001',
            'ip_address' => '10.10.0.3', 'status' => 'active',
            'purchase_date' => now()->subYears(4), 'warranty_expiry' => now()->subYear(),
            'rack_position' => 34, 'rack_units' => 2,
        ]);

        $ups = Device::create([
            'rack_id' => $rackA1->id, 'name' => 'UPS Server Room', 'type' => 'ups',
            'vendor' => 'APC', 'model' => 'Smart-UPS 3000VA', 'serial_number' => 'APC-UPS-0001',
            'status' => 'active',
            'purchase_date' => now()->subYears(8), 'warranty_expiry' => now()->subYears(5),
            'rack_position' => 5, 'rack_units' => 3,
        ]);

        $distSwitch = Device::create([
            'rack_id' => $rackA2->id, 'name' => 'Distribution Switch', 'type' => 'switch',
            'vendor' => 'Cisco', 'model' => 'Catalyst 2960', 'serial_number' => 'CSC-SW-0002',
            'ip_address' => '10.10.1.1', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addMonths(6),
            'rack_position' => 38, 'rack_units' => 1,
        ]);

        $accessSwitch = Device::create([
            'rack_id' => $rackA2->id, 'name' => 'Access Switch Lt.1', 'type' => 'switch',
            'vendor' => 'TP-Link', 'model' => 'TL-SG1024', 'serial_number' => 'TPL-SW-0001',
            'ip_address' => '10.10.1.2', 'status' => 'active',
            'purchase_date' => now()->subMonths(10), 'warranty_expiry' => now()->addYears(2),
            'rack_position' => 35, 'rack_units' => 1,
        ]);

        $server = Device::create([
            'rack_id' => $rackA2->id, 'name' => 'Server Aplikasi', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R740', 'serial_number' => 'DELL-SRV-0001',
            'ip_address' => '10.10.2.10', 'status' => 'active',
            'purchase_date' => now()->subYear(), 'warranty_expiry' => now()->addYears(2),
            'rack_position' => 28, 'rack_units' => 2,
        ]);

        $ap = Device::create([
            'rack_id' => null, 'name' => 'Access Point Lt.1', 'type' => 'access_point',
            'vendor' => 'Ubiquiti', 'model' => 'UniFi U6-Pro', 'serial_number' => 'UBNT-AP-0001',
            'ip_address' => '10.10.1.50', 'status' => 'active',
            'purchase_date' => now()->subMonths(6), 'warranty_expiry' => now()->addMonths(18),
        ]);

        DeviceConnection::create(['source_device_id' => $router->id, 'target_device_id' => $firewall->id, 'connection_type' => 'utp', 'port_source' => 'ether1', 'port_target' => 'wan1']);
        DeviceConnection::create(['source_device_id' => $firewall->id, 'target_device_id' => $coreSwitch->id, 'connection_type' => 'utp', 'port_source' => 'internal', 'port_target' => 'gi1/0/1']);
        DeviceConnection::create(['source_device_id' => $coreSwitch->id, 'target_device_id' => $distSwitch->id, 'connection_type' => 'fiber', 'port_source' => 'gi1/0/24', 'port_target' => 'gi0/1']);
        DeviceConnection::create(['source_device_id' => $distSwitch->id, 'target_device_id' => $accessSwitch->id, 'connection_type' => 'utp', 'port_source' => 'gi0/2', 'port_target' => 'port1']);
        DeviceConnection::create(['source_device_id' => $accessSwitch->id, 'target_device_id' => $ap->id, 'connection_type' => 'utp', 'port_source' => 'port10', 'port_target' => 'eth0']);
        DeviceConnection::create(['source_device_id' => $coreSwitch->id, 'target_device_id' => $server->id, 'connection_type' => 'utp', 'port_source' => 'gi1/0/12', 'port_target' => 'nic1']);

        Maintenance::create([
            'device_id' => $ups->id, 'technician_id' => $teknisi->id, 'type' => 'preventive',
            'scheduled_date' => now()->addWeek(), 'status' => 'scheduled',
            'notes' => 'Cek kapasitas baterai UPS, ganti jika di bawah 80 persen.',
        ]);

        Maintenance::create([
            'device_id' => $router->id, 'technician_id' => $teknisi->id, 'type' => 'corrective',
            'scheduled_date' => now()->subDays(10), 'completed_date' => now()->subDays(9), 'status' => 'completed',
            'notes' => 'Restart router karena firmware freeze, sudah update ke versi terbaru.',
        ]);

        $scenarioRouter = SimulationScenario::create([
            'device_id' => $router->id, 'name' => 'Router Utama Down', 'scenario_type' => 'router_down',
            'description' => 'Simulasi ketika router utama berhenti merespons total.',
            'impact_description' => 'Seluruh jaringan kampus kehilangan akses internet.',
            'affected_device_ids' => [$firewall->id, $coreSwitch->id, $distSwitch->id, $accessSwitch->id, $ap->id],
        ]);

        SimulationScenario::create([
            'device_id' => $coreSwitch->id, 'name' => 'Core Switch Down', 'scenario_type' => 'switch_down',
            'description' => 'Simulasi core switch mati mendadak.',
            'impact_description' => 'Distribusi jaringan ke semua lantai terputus.',
            'affected_device_ids' => [$distSwitch->id, $accessSwitch->id, $ap->id, $server->id],
        ]);

        SimulationScenario::create([
            'device_id' => $distSwitch->id, 'name' => 'Fiber Optik Putus Core-Distribution', 'scenario_type' => 'fiber_cut',
            'description' => 'Simulasi kabel fiber optik antara core switch dan distribution switch terputus.',
            'impact_description' => 'Lantai yang terhubung ke distribution switch kehilangan koneksi.',
            'affected_device_ids' => [$accessSwitch->id, $ap->id],
        ]);

        SimulationScenario::create([
            'device_id' => $ups->id, 'name' => 'UPS Gagal Berfungsi', 'scenario_type' => 'ups_failure',
            'description' => 'Simulasi UPS gagal menyuplai daya cadangan saat listrik padam.',
            'impact_description' => 'Seluruh perangkat di rack berisiko mati mendadak.',
            'affected_device_ids' => [$router->id, $firewall->id, $coreSwitch->id],
        ]);

        SimulationScenario::create([
            'device_id' => $server->id, 'name' => 'Server Aplikasi Offline', 'scenario_type' => 'server_offline',
            'description' => 'Simulasi server aplikasi tidak dapat diakses.',
            'impact_description' => 'Layanan akademik online tidak dapat diakses pengguna.',
            'affected_device_ids' => [],
        ]);

        SimulationLog::create([
            'scenario_id' => $scenarioRouter->id, 'user_id' => $viewer->id,
            'started_at' => now()->subDay(), 'ended_at' => now()->subDay()->addMinutes(15),
            'steps' => [
                'Memeriksa status LED pada router',
                'Melakukan power cycle pada router',
                'Memeriksa kabel WAN dari ISP',
                'Menghubungi ISP untuk validasi jalur',
            ],
            'resolved' => true,
        ]);
    }
}
