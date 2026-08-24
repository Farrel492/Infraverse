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
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // -- USERS ------------------------------------------------
        $admin = User::firstOrCreate(
            ['email' => 'admin@infraverse.test'],
            ['name' => 'Admin Sistem', 'password' => Hash::make('password'), 'role' => 'admin']
        );
        $teknisi1 = User::firstOrCreate(
            ['email' => 'teknisi@infraverse.test'],
            ['name' => 'Budi Santoso', 'password' => Hash::make('password'), 'role' => 'teknisi', 'phone' => '081234567890']
        );
        $teknisi2 = User::firstOrCreate(
            ['email' => 'teknisi2@infraverse.test'],
            ['name' => 'Sari Dewi', 'password' => Hash::make('password'), 'role' => 'teknisi', 'phone' => '082345678901']
        );
        $viewer = User::firstOrCreate(
            ['email' => 'viewer@infraverse.test'],
            ['name' => 'Mahasiswa Demo', 'password' => Hash::make('password'), 'role' => 'viewer']
        );

        // --------------------------------------------------------
        // GEDUNG A - Gedung Rektorat (Pusat Data Utama)
        // --------------------------------------------------------
        $gA = Building::create([
            'name'         => 'Gedung Rektorat',
            'location'     => 'Kampus Utama - Zona A',
            'total_floors' => 4,
            'description'  => 'Pusat administrasi dan data center utama kampus. Menampung NOC, server produksi, dan perangkat core network.',
        ]);

        $gA_f1 = Floor::create(['building_id' => $gA->id, 'name' => 'Lantai 1 - Lobby & NOC', 'floor_number' => 1, 'pos_y' => 0]);
        $gA_f2 = Floor::create(['building_id' => $gA->id, 'name' => 'Lantai 2 - Data Center', 'floor_number' => 2, 'pos_y' => 4]);
        $gA_f3 = Floor::create(['building_id' => $gA->id, 'name' => 'Lantai 3 - Server Farm', 'floor_number' => 3, 'pos_y' => 8]);
        $gA_f4 = Floor::create(['building_id' => $gA->id, 'name' => 'Lantai 4 - Office IT',   'floor_number' => 4, 'pos_y' => 12]);

        // Lantai 1 - NOC Room
        $noc = Room::create(['floor_id' => $gA_f1->id, 'name' => 'NOC Room', 'type' => 'server_room', 'width' => 6, 'depth' => 5, 'height' => 3]);

        // Lantai 2 - Data Center
        $dc_main = Room::create(['floor_id' => $gA_f2->id, 'name' => 'Data Center Utama', 'type' => 'server_room', 'width' => 12, 'depth' => 8, 'height' => 3.5]);
        $dc_cold = Room::create(['floor_id' => $gA_f2->id, 'name' => 'Cold Aisle Room',    'type' => 'server_room', 'width' => 8,  'depth' => 5, 'height' => 3.5]);

        // Lantai 3 - Server Farm
        $sf_main = Room::create(['floor_id' => $gA_f3->id, 'name' => 'Server Farm A', 'type' => 'server_room', 'width' => 10, 'depth' => 8, 'height' => 3.5]);

        // Lantai 4 - Office
        $it_office = Room::create(['floor_id' => $gA_f4->id, 'name' => 'Ruang IT Support', 'type' => 'office', 'width' => 8, 'depth' => 6, 'height' => 3]);

        // -- RACKS Gedung A ---------------------------------------
        $rack_noc1  = Rack::create(['room_id' => $noc->id,     'name' => 'NOC-R1',  'position' => 'N1', 'total_u' => 42, 'pos_x' => 0.5]);
        $rack_dc1   = Rack::create(['room_id' => $dc_main->id, 'name' => 'DC-R1',   'position' => 'A1', 'total_u' => 42, 'pos_x' => 1.0]);
        $rack_dc2   = Rack::create(['room_id' => $dc_main->id, 'name' => 'DC-R2',   'position' => 'A2', 'total_u' => 42, 'pos_x' => 2.5]);
        $rack_dc3   = Rack::create(['room_id' => $dc_main->id, 'name' => 'DC-R3',   'position' => 'A3', 'total_u' => 42, 'pos_x' => 4.0]);
        $rack_cold1 = Rack::create(['room_id' => $dc_cold->id, 'name' => 'COLD-R1', 'position' => 'C1', 'total_u' => 42, 'pos_x' => 1.0]);
        $rack_sf1   = Rack::create(['room_id' => $sf_main->id, 'name' => 'SF-R1',   'position' => 'S1', 'total_u' => 42, 'pos_x' => 1.0]);
        $rack_sf2   = Rack::create(['room_id' => $sf_main->id, 'name' => 'SF-R2',   'position' => 'S2', 'total_u' => 42, 'pos_x' => 2.5]);

        // -- DEVICES - NOC Rack (Core Network) -------------------
        $isp_router = Device::create([
            'rack_id' => $rack_noc1->id, 'name' => 'ISP Router Utama', 'type' => 'router',
            'vendor' => 'Cisco', 'model' => 'ASR 1001-X', 'serial_number' => 'CSC-ASR-0001',
            'ip_address' => '103.28.16.1', 'mac_address' => 'AA:BB:CC:00:00:01',
            'status' => 'active', 'purchase_date' => now()->subYears(3),
            'warranty_expiry' => now()->addMonths(9),
            'rack_position' => 40, 'rack_units' => 2,
        ]);
        $firewall_main = Device::create([
            'rack_id' => $rack_noc1->id, 'name' => 'Firewall Utama', 'type' => 'firewall',
            'vendor' => 'Fortinet', 'model' => 'FortiGate 200F', 'serial_number' => 'FTN-FW-0001',
            'ip_address' => '10.0.0.1', 'mac_address' => 'AA:BB:CC:00:00:02',
            'status' => 'active', 'purchase_date' => now()->subYears(2),
            'warranty_expiry' => now()->addYears(1),
            'rack_position' => 37, 'rack_units' => 2,
        ]);
        $core_sw1 = Device::create([
            'rack_id' => $rack_noc1->id, 'name' => 'Core Switch L3 - A', 'type' => 'switch',
            'vendor' => 'Cisco', 'model' => 'Catalyst 9500', 'serial_number' => 'CSC-C9500-0001',
            'ip_address' => '10.0.1.1', 'mac_address' => 'AA:BB:CC:00:01:01',
            'status' => 'active', 'purchase_date' => now()->subYears(4),
            'warranty_expiry' => now()->subMonths(4),
            'rack_position' => 33, 'rack_units' => 2,
        ]);
        $core_sw2 = Device::create([
            'rack_id' => $rack_noc1->id, 'name' => 'Core Switch L3 - B', 'type' => 'switch',
            'vendor' => 'Cisco', 'model' => 'Catalyst 9500', 'serial_number' => 'CSC-C9500-0002',
            'ip_address' => '10.0.1.2', 'mac_address' => 'AA:BB:CC:00:01:02',
            'status' => 'active', 'purchase_date' => now()->subYears(4),
            'warranty_expiry' => now()->subMonths(4),
            'rack_position' => 30, 'rack_units' => 2,
        ]);
        $ups_noc = Device::create([
            'rack_id' => $rack_noc1->id, 'name' => 'UPS NOC 10KVA', 'type' => 'ups',
            'vendor' => 'APC', 'model' => 'Symmetra LX 10kVA', 'serial_number' => 'APC-SLX-0001',
            'status' => 'active', 'purchase_date' => now()->subYears(7),
            'warranty_expiry' => now()->subYears(4),
            'rack_position' => 2, 'rack_units' => 6,
        ]);

        // -- DEVICES - DC Rack 1 (Distribution) ------------------
        $dist_sw_a = Device::create([
            'rack_id' => $rack_dc1->id, 'name' => 'Distribution SW - DC-A', 'type' => 'switch',
            'vendor' => 'Cisco', 'model' => 'Catalyst 9300L', 'serial_number' => 'CSC-9300-0001',
            'ip_address' => '10.1.0.1', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addYear(),
            'rack_position' => 40, 'rack_units' => 1,
        ]);
        $lb_main = Device::create([
            'rack_id' => $rack_dc1->id, 'name' => 'Load Balancer Utama', 'type' => 'other',
            'vendor' => 'F5', 'model' => 'BIG-IP 2200s', 'serial_number' => 'F5-LB-0001',
            'ip_address' => '10.1.0.5', 'status' => 'active',
            'purchase_date' => now()->subYears(3), 'warranty_expiry' => now()->addMonths(3),
            'rack_position' => 36, 'rack_units' => 2,
        ]);
        $ups_dc1 = Device::create([
            'rack_id' => $rack_dc1->id, 'name' => 'UPS DC Rack-1', 'type' => 'ups',
            'vendor' => 'APC', 'model' => 'Smart-UPS 3000VA', 'serial_number' => 'APC-SU-0001',
            'status' => 'active', 'purchase_date' => now()->subYears(6),
            'warranty_expiry' => now()->subYears(3),
            'rack_position' => 2, 'rack_units' => 3,
        ]);

        // -- DEVICES - DC Rack 2 (Servers Produksi) --------------
        $srv_web1 = Device::create([
            'rack_id' => $rack_dc2->id, 'name' => 'Server Web - PROD-01', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R750', 'serial_number' => 'DELL-R750-0001',
            'ip_address' => '10.2.0.10', 'status' => 'active',
            'purchase_date' => now()->subYear(), 'warranty_expiry' => now()->addYears(2),
            'rack_position' => 40, 'rack_units' => 2,
        ]);
        $srv_web2 = Device::create([
            'rack_id' => $rack_dc2->id, 'name' => 'Server Web - PROD-02', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R750', 'serial_number' => 'DELL-R750-0002',
            'ip_address' => '10.2.0.11', 'status' => 'active',
            'purchase_date' => now()->subYear(), 'warranty_expiry' => now()->addYears(2),
            'rack_position' => 37, 'rack_units' => 2,
        ]);
        $srv_db = Device::create([
            'rack_id' => $rack_dc2->id, 'name' => 'Server Database Utama', 'type' => 'server',
            'vendor' => 'HPE', 'model' => 'ProLiant DL380 Gen10', 'serial_number' => 'HPE-DL380-0001',
            'ip_address' => '10.2.0.20', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addMonths(10),
            'rack_position' => 34, 'rack_units' => 2,
        ]);
        $srv_db_slave = Device::create([
            'rack_id' => $rack_dc2->id, 'name' => 'Server Database Slave', 'type' => 'server',
            'vendor' => 'HPE', 'model' => 'ProLiant DL380 Gen10', 'serial_number' => 'HPE-DL380-0002',
            'ip_address' => '10.2.0.21', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addMonths(10),
            'rack_position' => 31, 'rack_units' => 2,
        ]);
        $srv_mail = Device::create([
            'rack_id' => $rack_dc2->id, 'name' => 'Mail Server', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R640', 'serial_number' => 'DELL-R640-0001',
            'ip_address' => '10.2.0.30', 'status' => 'maintenance',
            'purchase_date' => now()->subYears(5), 'warranty_expiry' => now()->subYears(2),
            'rack_position' => 28, 'rack_units' => 1,
        ]);
        $ups_dc2 = Device::create([
            'rack_id' => $rack_dc2->id, 'name' => 'UPS DC Rack-2', 'type' => 'ups',
            'vendor' => 'Eaton', 'model' => '9PX 6000i', 'serial_number' => 'ETN-9PX-0001',
            'status' => 'active', 'purchase_date' => now()->subYears(4),
            'warranty_expiry' => now()->subYear(),
            'rack_position' => 2, 'rack_units' => 3,
        ]);

        // -- DEVICES - DC Rack 3 (Virtualization) ----------------
        $vmhost1 = Device::create([
            'rack_id' => $rack_dc3->id, 'name' => 'VMware Host ESXi-01', 'type' => 'server',
            'vendor' => 'HPE', 'model' => 'ProLiant DL560 Gen10', 'serial_number' => 'HPE-DL560-0001',
            'ip_address' => '10.3.0.10', 'status' => 'active',
            'purchase_date' => now()->subMonths(18), 'warranty_expiry' => now()->addMonths(18),
            'rack_position' => 40, 'rack_units' => 4,
        ]);
        $vmhost2 = Device::create([
            'rack_id' => $rack_dc3->id, 'name' => 'VMware Host ESXi-02', 'type' => 'server',
            'vendor' => 'HPE', 'model' => 'ProLiant DL560 Gen10', 'serial_number' => 'HPE-DL560-0002',
            'ip_address' => '10.3.0.11', 'status' => 'active',
            'purchase_date' => now()->subMonths(18), 'warranty_expiry' => now()->addMonths(18),
            'rack_position' => 35, 'rack_units' => 4,
        ]);
        $san = Device::create([
            'rack_id' => $rack_dc3->id, 'name' => 'SAN Storage Array', 'type' => 'other',
            'vendor' => 'NetApp', 'model' => 'AFF A400', 'serial_number' => 'NTA-AFF-0001',
            'ip_address' => '10.3.0.50', 'status' => 'active',
            'purchase_date' => now()->subMonths(12), 'warranty_expiry' => now()->addYears(2),
            'rack_position' => 28, 'rack_units' => 4,
        ]);

        // -- DEVICES - Cold Aisle (Backup & Security) ------------
        $backup_srv = Device::create([
            'rack_id' => $rack_cold1->id, 'name' => 'Backup Server Veeam', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R540', 'serial_number' => 'DELL-R540-0001',
            'ip_address' => '10.4.0.10', 'status' => 'active',
            'purchase_date' => now()->subYears(3), 'warranty_expiry' => now()->subMonths(6),
            'rack_position' => 40, 'rack_units' => 2,
        ]);
        $nms = Device::create([
            'rack_id' => $rack_cold1->id, 'name' => 'NMS Server (Zabbix)', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R440', 'serial_number' => 'DELL-R440-0001',
            'ip_address' => '10.4.0.20', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addMonths(6),
            'rack_position' => 37, 'rack_units' => 1,
        ]);
        $ids = Device::create([
            'rack_id' => $rack_cold1->id, 'name' => 'IDS/IPS Sensor', 'type' => 'firewall',
            'vendor' => 'Cisco', 'model' => 'Firepower 1120', 'serial_number' => 'CSC-FP-0001',
            'ip_address' => '10.4.0.30', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addMonths(4),
            'rack_position' => 35, 'rack_units' => 1,
        ]);

        // -- DEVICES - Server Farm --------------------------------
        $srv_lms = Device::create([
            'rack_id' => $rack_sf1->id, 'name' => 'Server LMS (Moodle)', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R750xs', 'serial_number' => 'DELL-R750X-0001',
            'ip_address' => '10.5.0.10', 'status' => 'active',
            'purchase_date' => now()->subMonths(8), 'warranty_expiry' => now()->addYears(2),
            'rack_position' => 40, 'rack_units' => 2,
        ]);
        $srv_sia = Device::create([
            'rack_id' => $rack_sf1->id, 'name' => 'Server SIAKAD', 'type' => 'server',
            'vendor' => 'HPE', 'model' => 'ProLiant DL360 Gen10', 'serial_number' => 'HPE-DL360-0001',
            'ip_address' => '10.5.0.20', 'status' => 'active',
            'purchase_date' => now()->subYears(3), 'warranty_expiry' => now()->subMonths(3),
            'rack_position' => 37, 'rack_units' => 1,
        ]);
        $srv_lib = Device::create([
            'rack_id' => $rack_sf1->id, 'name' => 'Server Perpustakaan Digital', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R640', 'serial_number' => 'DELL-R640-0002',
            'ip_address' => '10.5.0.30', 'status' => 'down',
            'purchase_date' => now()->subYears(6), 'warranty_expiry' => now()->subYears(3),
            'rack_position' => 35, 'rack_units' => 1,
        ]);
        $sw_sf1 = Device::create([
            'rack_id' => $rack_sf1->id, 'name' => 'Access Switch SF-1', 'type' => 'switch',
            'vendor' => 'HP', 'model' => 'Aruba 2930F', 'serial_number' => 'HPE-2930-0001',
            'ip_address' => '10.5.0.2', 'status' => 'active',
            'purchase_date' => now()->subYears(3), 'warranty_expiry' => now()->addMonths(9),
            'rack_position' => 33, 'rack_units' => 1,
        ]);

        $srv_fin = Device::create([
            'rack_id' => $rack_sf2->id, 'name' => 'Server Keuangan', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R450', 'serial_number' => 'DELL-R450-0001',
            'ip_address' => '10.5.1.10', 'status' => 'active',
            'purchase_date' => now()->subMonths(14), 'warranty_expiry' => now()->addMonths(22),
            'rack_position' => 40, 'rack_units' => 1,
        ]);
        $srv_hr = Device::create([
            'rack_id' => $rack_sf2->id, 'name' => 'Server SDM (HRIS)', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R450', 'serial_number' => 'DELL-R450-0002',
            'ip_address' => '10.5.1.20', 'status' => 'active',
            'purchase_date' => now()->subMonths(14), 'warranty_expiry' => now()->addMonths(22),
            'rack_position' => 38, 'rack_units' => 1,
        ]);
        $sw_sf2 = Device::create([
            'rack_id' => $rack_sf2->id, 'name' => 'Access Switch SF-2', 'type' => 'switch',
            'vendor' => 'HP', 'model' => 'Aruba 2930F', 'serial_number' => 'HPE-2930-0002',
            'ip_address' => '10.5.1.2', 'status' => 'active',
            'purchase_date' => now()->subYears(3), 'warranty_expiry' => now()->addMonths(9),
            'rack_position' => 35, 'rack_units' => 1,
        ]);
        $ups_sf = Device::create([
            'rack_id' => $rack_sf2->id, 'name' => 'UPS Server Farm', 'type' => 'ups',
            'vendor' => 'APC', 'model' => 'Smart-UPS 5000VA', 'serial_number' => 'APC-SU-5000-0001',
            'status' => 'active', 'purchase_date' => now()->subYears(5),
            'warranty_expiry' => now()->subYears(2),
            'rack_position' => 2, 'rack_units' => 4,
        ]);

        // --------------------------------------------------------
        // GEDUNG B - Gedung Fakultas Teknik
        // --------------------------------------------------------
        $gB = Building::create([
            'name'         => 'Gedung Fakultas Teknik',
            'location'     => 'Kampus Utama - Zona B',
            'total_floors' => 5,
            'description'  => 'Gedung perkuliahan Fakultas Teknik. Dilengkapi lab komputer, ruang kuliah ber-WiFi, dan server lokal fakultas.',
        ]);

        $gB_f1 = Floor::create(['building_id' => $gB->id, 'name' => 'Lantai 1 - Lobby & Lab', 'floor_number' => 1, 'pos_y' => 0]);
        $gB_f2 = Floor::create(['building_id' => $gB->id, 'name' => 'Lantai 2 - Lab Komputer', 'floor_number' => 2, 'pos_y' => 4]);
        $gB_f3 = Floor::create(['building_id' => $gB->id, 'name' => 'Lantai 3 - Ruang Kuliah', 'floor_number' => 3, 'pos_y' => 8]);
        $gB_f4 = Floor::create(['building_id' => $gB->id, 'name' => 'Lantai 4 - Ruang Kuliah', 'floor_number' => 4, 'pos_y' => 12]);
        $gB_f5 = Floor::create(['building_id' => $gB->id, 'name' => 'Lantai 5 - MDF Room',    'floor_number' => 5, 'pos_y' => 16]);

        $mdf_b  = Room::create(['floor_id' => $gB_f5->id, 'name' => 'MDF Room FT',     'type' => 'server_room', 'width' => 5, 'depth' => 4, 'height' => 3]);
        $lab_1  = Room::create(['floor_id' => $gB_f1->id, 'name' => 'Lab Jaringan',    'type' => 'lab',         'width' => 8, 'depth' => 6, 'height' => 3]);
        $lab_2  = Room::create(['floor_id' => $gB_f2->id, 'name' => 'Lab Komputer A',  'type' => 'lab',         'width' => 10,'depth' => 7, 'height' => 3]);
        $lab_3  = Room::create(['floor_id' => $gB_f2->id, 'name' => 'Lab Komputer B',  'type' => 'lab',         'width' => 10,'depth' => 7, 'height' => 3]);
        $kul_3  = Room::create(['floor_id' => $gB_f3->id, 'name' => 'Ruang Kuliah 3A', 'type' => 'classroom',   'width' => 12,'depth' => 8, 'height' => 3]);
        $kul_4  = Room::create(['floor_id' => $gB_f4->id, 'name' => 'Ruang Kuliah 4A', 'type' => 'classroom',   'width' => 12,'depth' => 8, 'height' => 3]);

        $rack_mdf_b  = Rack::create(['room_id' => $mdf_b->id, 'name' => 'MDF-FT-R1', 'position' => 'M1', 'total_u' => 42, 'pos_x' => 0.5]);
        $rack_lab1   = Rack::create(['room_id' => $lab_1->id, 'name' => 'LAB-NET-R1','position' => 'L1', 'total_u' => 24, 'pos_x' => 0.5]);

        $dist_sw_b = Device::create([
            'rack_id' => $rack_mdf_b->id, 'name' => 'Distribution SW - FT', 'type' => 'switch',
            'vendor' => 'Cisco', 'model' => 'Catalyst 9300', 'serial_number' => 'CSC-9300-0002',
            'ip_address' => '10.10.0.1', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addYear(),
            'rack_position' => 40, 'rack_units' => 1,
        ]);
        $acc_sw_ft1 = Device::create([
            'rack_id' => $rack_mdf_b->id, 'name' => 'Access Switch FT - Lt.1-2', 'type' => 'switch',
            'vendor' => 'TP-Link', 'model' => 'TL-SG1048', 'serial_number' => 'TPL-1048-0001',
            'ip_address' => '10.10.0.2', 'status' => 'active',
            'purchase_date' => now()->subMonths(18), 'warranty_expiry' => now()->addMonths(18),
            'rack_position' => 38, 'rack_units' => 1,
        ]);
        $acc_sw_ft2 = Device::create([
            'rack_id' => $rack_mdf_b->id, 'name' => 'Access Switch FT - Lt.3-5', 'type' => 'switch',
            'vendor' => 'TP-Link', 'model' => 'TL-SG1048', 'serial_number' => 'TPL-1048-0002',
            'ip_address' => '10.10.0.3', 'status' => 'active',
            'purchase_date' => now()->subMonths(18), 'warranty_expiry' => now()->addMonths(18),
            'rack_position' => 36, 'rack_units' => 1,
        ]);
        $ap_ft_lb1 = Device::create([
            'rack_id' => null, 'name' => 'AP WiFi - Lobby FT', 'type' => 'access_point',
            'vendor' => 'Ubiquiti', 'model' => 'UniFi U6-LR', 'serial_number' => 'UBNT-U6-0001',
            'ip_address' => '10.10.1.10', 'status' => 'active',
            'purchase_date' => now()->subMonths(12), 'warranty_expiry' => now()->addYear(),
        ]);
        $ap_ft_lab2 = Device::create([
            'rack_id' => null, 'name' => 'AP WiFi - Lab Komputer A', 'type' => 'access_point',
            'vendor' => 'Ubiquiti', 'model' => 'UniFi U6-Pro', 'serial_number' => 'UBNT-U6-0002',
            'ip_address' => '10.10.1.11', 'status' => 'active',
            'purchase_date' => now()->subMonths(12), 'warranty_expiry' => now()->addYear(),
        ]);
        $ap_ft_kul3 = Device::create([
            'rack_id' => null, 'name' => 'AP WiFi - Ruang Kuliah 3A', 'type' => 'access_point',
            'vendor' => 'Ubiquiti', 'model' => 'UniFi U6-Pro', 'serial_number' => 'UBNT-U6-0003',
            'ip_address' => '10.10.1.12', 'status' => 'inactive',
            'purchase_date' => now()->subYears(3), 'warranty_expiry' => now()->subYear(),
        ]);
        $srv_ft = Device::create([
            'rack_id' => $rack_lab1->id, 'name' => 'Server Lab Jaringan', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge T350', 'serial_number' => 'DELL-T350-0001',
            'ip_address' => '10.10.2.10', 'status' => 'active',
            'purchase_date' => now()->subMonths(6), 'warranty_expiry' => now()->addYears(2),
            'rack_position' => 20, 'rack_units' => 2,
        ]);
        $router_ft = Device::create([
            'rack_id' => $rack_lab1->id, 'name' => 'Router Lab - MikroTik', 'type' => 'router',
            'vendor' => 'MikroTik', 'model' => 'CCR2004-16G', 'serial_number' => 'MKT-CCR-0001',
            'ip_address' => '10.10.2.1', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addMonths(10),
            'rack_position' => 18, 'rack_units' => 1,
        ]);

        // --------------------------------------------------------
        // GEDUNG C - Perpustakaan & Pusat Riset
        // --------------------------------------------------------
        $gC = Building::create([
            'name'         => 'Gedung Perpustakaan & Pusat Riset',
            'location'     => 'Kampus Utama - Zona C',
            'total_floors' => 3,
            'description'  => 'Perpustakaan pusat dan ruang riset digital. Dilengkapi WiFi 6 di seluruh area dan server repositori digital.',
        ]);

        $gC_f1 = Floor::create(['building_id' => $gC->id, 'name' => 'Lantai 1 - Area Baca Umum', 'floor_number' => 1, 'pos_y' => 0]);
        $gC_f2 = Floor::create(['building_id' => $gC->id, 'name' => 'Lantai 2 - Koleksi Digital',  'floor_number' => 2, 'pos_y' => 4]);
        $gC_f3 = Floor::create(['building_id' => $gC->id, 'name' => 'Lantai 3 - Ruang Riset',     'floor_number' => 3, 'pos_y' => 8]);

        $mdf_c   = Room::create(['floor_id' => $gC_f1->id, 'name' => 'MDF Room Perpustakaan', 'type' => 'server_room', 'width' => 4, 'depth' => 4, 'height' => 3]);
        $area_baca = Room::create(['floor_id' => $gC_f1->id, 'name' => 'Area Baca Umum', 'type' => 'office', 'width' => 20, 'depth' => 15, 'height' => 4]);
        $lab_dig = Room::create(['floor_id' => $gC_f2->id, 'name' => 'Lab Digital & E-Learning', 'type' => 'lab', 'width' => 10, 'depth' => 8, 'height' => 3]);
        $r_riset = Room::create(['floor_id' => $gC_f3->id, 'name' => 'Ruang Riset AI & Data Science', 'type' => 'lab', 'width' => 12, 'depth' => 8, 'height' => 3]);

        $rack_mdf_c  = Rack::create(['room_id' => $mdf_c->id,  'name' => 'MDF-PERPUS-R1', 'position' => 'P1', 'total_u' => 24, 'pos_x' => 0.5]);
        $rack_riset  = Rack::create(['room_id' => $r_riset->id, 'name' => 'RISET-R1',      'position' => 'R1', 'total_u' => 24, 'pos_x' => 0.5]);

        $dist_sw_c = Device::create([
            'rack_id' => $rack_mdf_c->id, 'name' => 'Distribution SW - Perpus', 'type' => 'switch',
            'vendor' => 'HP', 'model' => 'Aruba 2530', 'serial_number' => 'HPE-2530-0001',
            'ip_address' => '10.20.0.1', 'status' => 'active',
            'purchase_date' => now()->subYears(4), 'warranty_expiry' => now()->subYear(),
            'rack_position' => 22, 'rack_units' => 1,
        ]);
        $ap_perpus1 = Device::create([
            'rack_id' => null, 'name' => 'AP WiFi - Area Baca Lt.1', 'type' => 'access_point',
            'vendor' => 'Ubiquiti', 'model' => 'UniFi U6-Mesh', 'serial_number' => 'UBNT-MESH-0001',
            'ip_address' => '10.20.1.10', 'status' => 'active',
            'purchase_date' => now()->subMonths(8), 'warranty_expiry' => now()->addMonths(16),
        ]);
        $ap_perpus2 = Device::create([
            'rack_id' => null, 'name' => 'AP WiFi - Lab Digital Lt.2', 'type' => 'access_point',
            'vendor' => 'Ubiquiti', 'model' => 'UniFi U6-Mesh', 'serial_number' => 'UBNT-MESH-0002',
            'ip_address' => '10.20.1.11', 'status' => 'active',
            'purchase_date' => now()->subMonths(8), 'warranty_expiry' => now()->addMonths(16),
        ]);
        $srv_repo = Device::create([
            'rack_id' => $rack_riset->id, 'name' => 'Server Repositori Ilmiah', 'type' => 'server',
            'vendor' => 'Dell', 'model' => 'PowerEdge R740xd', 'serial_number' => 'DELL-R740XD-0001',
            'ip_address' => '10.20.2.10', 'status' => 'active',
            'purchase_date' => now()->subYears(2), 'warranty_expiry' => now()->addMonths(12),
            'rack_position' => 20, 'rack_units' => 2,
        ]);
        $srv_ai = Device::create([
            'rack_id' => $rack_riset->id, 'name' => 'GPU Server - AI Research', 'type' => 'server',
            'vendor' => 'NVIDIA', 'model' => 'DGX A100', 'serial_number' => 'NV-DGX-0001',
            'ip_address' => '10.20.2.20', 'status' => 'active',
            'purchase_date' => now()->subMonths(6), 'warranty_expiry' => now()->addYears(2),
            'rack_position' => 17, 'rack_units' => 4,
        ]);
        $sw_riset = Device::create([
            'rack_id' => $rack_riset->id, 'name' => 'Switch Riset 10GbE', 'type' => 'switch',
            'vendor' => 'Cisco', 'model' => 'Nexus 3048', 'serial_number' => 'CSC-N3048-0001',
            'ip_address' => '10.20.2.1', 'status' => 'active',
            'purchase_date' => now()->subYear(), 'warranty_expiry' => now()->addYear(),
            'rack_position' => 14, 'rack_units' => 1,
        ]);

        // --------------------------------------------------------
        // KONEKSI TOPOLOGI LENGKAP
        // --------------------------------------------------------

        // Tier 1: ISP - Firewall - Core Switches
        DeviceConnection::create(['source_device_id' => $isp_router->id,    'target_device_id' => $firewall_main->id, 'connection_type' => 'fiber',    'port_source' => 'Gi0/0/0', 'port_target' => 'WAN1',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $firewall_main->id, 'target_device_id' => $core_sw1->id,      'connection_type' => 'fiber',    'port_source' => 'internal', 'port_target' => 'Te1/0/1',  'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $firewall_main->id, 'target_device_id' => $core_sw2->id,      'connection_type' => 'fiber',    'port_source' => 'internal', 'port_target' => 'Te1/0/1',  'status' => 'active']);

        // Core Switch redundancy
        DeviceConnection::create(['source_device_id' => $core_sw1->id,     'target_device_id' => $core_sw2->id,       'connection_type' => 'fiber',    'port_source' => 'Te1/0/48','port_target' => 'Te1/0/48', 'status' => 'active']);

        // Tier 2: Core - Distribution (masing-masing gedung)
        DeviceConnection::create(['source_device_id' => $core_sw1->id,     'target_device_id' => $dist_sw_a->id,      'connection_type' => 'fiber',    'port_source' => 'Te1/0/2', 'port_target' => 'Gi1/0/1',  'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $core_sw1->id,     'target_device_id' => $dist_sw_b->id,      'connection_type' => 'fiber',    'port_source' => 'Te1/0/3', 'port_target' => 'Gi1/0/1',  'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $core_sw2->id,     'target_device_id' => $dist_sw_c->id,      'connection_type' => 'fiber',    'port_source' => 'Te1/0/3', 'port_target' => 'Gi1/0/1',  'status' => 'active']);

        // DC Connections (Distribution - Servers via LB)
        DeviceConnection::create(['source_device_id' => $dist_sw_a->id,    'target_device_id' => $lb_main->id,        'connection_type' => 'utp',      'port_source' => 'Gi1/0/2', 'port_target' => 'port1.1',  'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $lb_main->id,      'target_device_id' => $srv_web1->id,       'connection_type' => 'utp',      'port_source' => 'port2.1', 'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $lb_main->id,      'target_device_id' => $srv_web2->id,       'connection_type' => 'utp',      'port_source' => 'port2.2', 'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $dist_sw_a->id,    'target_device_id' => $srv_db->id,         'connection_type' => 'utp',      'port_source' => 'Gi1/0/5', 'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $srv_db->id,       'target_device_id' => $srv_db_slave->id,   'connection_type' => 'utp',      'port_source' => 'eth1',    'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $dist_sw_a->id,    'target_device_id' => $vmhost1->id,        'connection_type' => 'fiber',    'port_source' => 'Gi1/0/8', 'port_target' => 'vmnic0',   'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $dist_sw_a->id,    'target_device_id' => $vmhost2->id,        'connection_type' => 'fiber',    'port_source' => 'Gi1/0/9', 'port_target' => 'vmnic0',   'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $vmhost1->id,      'target_device_id' => $san->id,            'connection_type' => 'fiber',    'port_source' => 'hba0',    'port_target' => 'fc1',      'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $vmhost2->id,      'target_device_id' => $san->id,            'connection_type' => 'fiber',    'port_source' => 'hba0',    'port_target' => 'fc2',      'status' => 'active']);

        // NMS & IDS
        DeviceConnection::create(['source_device_id' => $dist_sw_a->id,    'target_device_id' => $nms->id,            'connection_type' => 'utp',      'port_source' => 'Gi1/0/20','port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $dist_sw_a->id,    'target_device_id' => $ids->id,            'connection_type' => 'utp',      'port_source' => 'Gi1/0/21','port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $dist_sw_a->id,    'target_device_id' => $backup_srv->id,     'connection_type' => 'utp',      'port_source' => 'Gi1/0/22','port_target' => 'eth0',     'status' => 'active']);

        // Server Farm
        DeviceConnection::create(['source_device_id' => $core_sw2->id,     'target_device_id' => $sw_sf1->id,         'connection_type' => 'fiber',    'port_source' => 'Te1/0/4', 'port_target' => 'Gi1/0/1',  'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $sw_sf1->id,       'target_device_id' => $srv_lms->id,        'connection_type' => 'utp',      'port_source' => 'Gi1/0/2', 'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $sw_sf1->id,       'target_device_id' => $srv_sia->id,        'connection_type' => 'utp',      'port_source' => 'Gi1/0/3', 'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $sw_sf1->id,       'target_device_id' => $srv_lib->id,        'connection_type' => 'utp',      'port_source' => 'Gi1/0/4', 'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $sw_sf2->id,       'target_device_id' => $srv_fin->id,        'connection_type' => 'utp',      'port_source' => 'Gi1/0/2', 'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $sw_sf2->id,       'target_device_id' => $srv_hr->id,         'connection_type' => 'utp',      'port_source' => 'Gi1/0/3', 'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $sw_sf1->id,       'target_device_id' => $sw_sf2->id,         'connection_type' => 'utp',      'port_source' => 'Gi1/0/24','port_target' => 'Gi1/0/24', 'status' => 'active']);

        // Gedung B FT Access
        DeviceConnection::create(['source_device_id' => $dist_sw_b->id,    'target_device_id' => $acc_sw_ft1->id,     'connection_type' => 'utp',      'port_source' => 'Gi1/0/2', 'port_target' => 'port1',    'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $dist_sw_b->id,    'target_device_id' => $acc_sw_ft2->id,     'connection_type' => 'utp',      'port_source' => 'Gi1/0/3', 'port_target' => 'port1',    'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $acc_sw_ft1->id,   'target_device_id' => $ap_ft_lb1->id,      'connection_type' => 'utp',      'port_source' => 'port5',   'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $acc_sw_ft1->id,   'target_device_id' => $ap_ft_lab2->id,     'connection_type' => 'utp',      'port_source' => 'port6',   'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $acc_sw_ft2->id,   'target_device_id' => $ap_ft_kul3->id,     'connection_type' => 'utp',      'port_source' => 'port5',   'port_target' => 'eth0',     'status' => 'inactive']);
        DeviceConnection::create(['source_device_id' => $dist_sw_b->id,    'target_device_id' => $router_ft->id,      'connection_type' => 'utp',      'port_source' => 'Gi1/0/5', 'port_target' => 'ether1',   'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $router_ft->id,    'target_device_id' => $srv_ft->id,         'connection_type' => 'utp',      'port_source' => 'ether2',  'port_target' => 'eth0',     'status' => 'active']);

        // Gedung C Perpustakaan
        DeviceConnection::create(['source_device_id' => $dist_sw_c->id,    'target_device_id' => $ap_perpus1->id,     'connection_type' => 'utp',      'port_source' => 'port2',   'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $dist_sw_c->id,    'target_device_id' => $ap_perpus2->id,     'connection_type' => 'utp',      'port_source' => 'port3',   'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $dist_sw_c->id,    'target_device_id' => $sw_riset->id,       'connection_type' => 'fiber',    'port_source' => 'port10',  'port_target' => 'Te1/0/1',  'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $sw_riset->id,     'target_device_id' => $srv_repo->id,       'connection_type' => 'utp',      'port_source' => 'Te1/0/2', 'port_target' => 'eth0',     'status' => 'active']);
        DeviceConnection::create(['source_device_id' => $sw_riset->id,     'target_device_id' => $srv_ai->id,         'connection_type' => 'fiber',    'port_source' => 'Te1/0/3', 'port_target' => 'eth0',     'status' => 'active']);

        // --------------------------------------------------------
        // MAINTENANCE RECORDS
        // --------------------------------------------------------
        $maintenances = [
            ['device_id' => $ups_noc->id,   'technician_id' => $teknisi1->id, 'type' => 'preventive', 'scheduled_date' => now()->addDays(3),   'status' => 'scheduled',   'notes' => 'Cek kapasitas baterai UPS NOC 10KVA, target runtime minimum 2 jam.'],
            ['device_id' => $ups_dc1->id,   'technician_id' => $teknisi1->id, 'type' => 'preventive', 'scheduled_date' => now()->addDays(5),   'status' => 'scheduled',   'notes' => 'Penggantian baterai UPS DC-R1. Baterai sudah 6 tahun, di bawah threshold.'],
            ['device_id' => $ups_dc2->id,   'technician_id' => $teknisi2->id, 'type' => 'preventive', 'scheduled_date' => now()->addDays(7),   'status' => 'scheduled',   'notes' => 'Ganti baterai UPS Eaton DC-R2, kapasitas drop ke 65%.'],
            ['device_id' => $core_sw1->id,  'technician_id' => $teknisi1->id, 'type' => 'preventive', 'scheduled_date' => now()->addDays(14),  'status' => 'scheduled',   'notes' => 'Update firmware Cisco Catalyst 9500 ke versi terbaru. Window: 02:00-04:00 WIB.'],
            ['device_id' => $core_sw2->id,  'technician_id' => $teknisi1->id, 'type' => 'preventive', 'scheduled_date' => now()->addDays(14),  'status' => 'scheduled',   'notes' => 'Update firmware bersamaan dengan Core SW-A. Pastikan redundancy aktif.'],
            ['device_id' => $srv_mail->id,  'technician_id' => $teknisi2->id, 'type' => 'corrective', 'scheduled_date' => now()->addDays(1),   'status' => 'in_progress', 'notes' => 'Mail server crash - disk usage 98%. Cleanup log & expand storage.'],
            ['device_id' => $srv_lib->id,   'technician_id' => $teknisi1->id, 'type' => 'corrective', 'scheduled_date' => now(),               'status' => 'in_progress', 'notes' => 'Server perpustakaan DOWN. Investigasi kernel panic, restore dari backup Veeam.'],
            ['device_id' => $dist_sw_c->id, 'technician_id' => $teknisi2->id, 'type' => 'preventive', 'scheduled_date' => now()->addDays(21),  'status' => 'scheduled',   'notes' => 'Garansi habis bulan lalu. Cek kondisi fisik dan pertimbangkan refresh.'],
            ['device_id' => $ups_sf->id,    'technician_id' => $teknisi1->id, 'type' => 'preventive', 'scheduled_date' => now()->addDays(10),  'status' => 'scheduled',   'notes' => 'UPS Server Farm usia 5 tahun. Penggantian baterai dan load test.'],
            ['device_id' => $isp_router->id,'technician_id' => $teknisi1->id, 'type' => 'preventive', 'scheduled_date' => now()->subDays(30),  'status' => 'completed', 'completed_date' => now()->subDays(29), 'notes' => 'Upgrade IOS XE ke 17.9.3a berhasil. Tidak ada downtime.'],
            ['device_id' => $vmhost1->id,   'technician_id' => $teknisi2->id, 'type' => 'preventive', 'scheduled_date' => now()->subDays(15),  'status' => 'completed', 'completed_date' => now()->subDays(14), 'notes' => 'Update VMware ESXi 8.0 Update 2. Migrasi VM ke host-2 saat maintenance.'],
        ];
        foreach ($maintenances as $m) {
            Maintenance::create($m);
        }

        // --------------------------------------------------------
        // SIMULATION SCENARIOS
        // --------------------------------------------------------
        $sc1 = SimulationScenario::create([
            'device_id' => $isp_router->id, 'name' => 'ISP Router Utama Down',
            'scenario_type' => 'router_down',
            'description' => 'Simulasi kegagalan total ISP Router - seluruh akses internet kampus terputus.',
            'impact_description' => 'Seluruh kampus kehilangan akses internet. LMS, SIAKAD, email, dan semua layanan cloud tidak dapat diakses oleh 15.000+ pengguna.',
            'affected_device_ids' => [$firewall_main->id, $core_sw1->id, $core_sw2->id, $dist_sw_a->id, $dist_sw_b->id, $dist_sw_c->id],
        ]);
        $sc2 = SimulationScenario::create([
            'device_id' => $core_sw1->id, 'name' => 'Core Switch A - Hardware Failure',
            'scenario_type' => 'switch_down',
            'description' => 'Core Switch A mengalami kegagalan hardware. Core Switch B (redundant) masih aktif sebagai failover.',
            'impact_description' => 'Sekitar 50% traffic terganggu selama failover berlangsung (estimasi 30-60 detik). Gedung yang terhubung ke Core-A mengalami packet loss tinggi.',
            'affected_device_ids' => [$dist_sw_a->id, $srv_web1->id, $srv_web2->id, $srv_db->id],
        ]);
        $sc3 = SimulationScenario::create([
            'device_id' => $dist_sw_b->id, 'name' => 'Fiber Cut - Core ke Gedung FT',
            'scenario_type' => 'fiber_cut',
            'description' => 'Kabel fiber optik dari Core Switch ke Distribution Switch Gedung Fakultas Teknik terputus akibat pekerjaan konstruksi.',
            'impact_description' => 'Seluruh Gedung Fakultas Teknik kehilangan koneksi jaringan. Lab komputer, WiFi, dan server lokal FT tidak bisa diakses.',
            'affected_device_ids' => [$acc_sw_ft1->id, $acc_sw_ft2->id, $ap_ft_lb1->id, $ap_ft_lab2->id, $srv_ft->id, $router_ft->id],
        ]);
        $sc4 = SimulationScenario::create([
            'device_id' => $ups_noc->id, 'name' => 'UPS NOC Gagal - Blackout PLN',
            'scenario_type' => 'ups_failure',
            'description' => 'PLN mengalami pemadaman dan UPS NOC gagal menyuplai daya cadangan akibat baterai drop.',
            'impact_description' => 'ISP Router, Firewall, dan Core Switch berisiko mati mendadak tanpa shutdown prosedur. Potensi korupsi data dan hardware damage.',
            'affected_device_ids' => [$isp_router->id, $firewall_main->id, $core_sw1->id, $core_sw2->id],
        ]);
        $sc5 = SimulationScenario::create([
            'device_id' => $srv_sia->id, 'name' => 'Server SIAKAD - Database Connection Failure',
            'scenario_type' => 'server_offline',
            'description' => 'Server SIAKAD tidak dapat terhubung ke database server. Terjadi saat periode pengisian KRS.',
            'impact_description' => 'Sistem akademik (SIAKAD) tidak bisa diakses oleh seluruh mahasiswa dan dosen. Pengisian KRS, lihat nilai, dan presensi online terganggu.',
            'affected_device_ids' => [$srv_db->id],
        ]);

        // Simulation Logs (riwayat demo)
        SimulationLog::create([
            'scenario_id' => $sc1->id, 'user_id' => $viewer->id,
            'started_at' => now()->subDays(5), 'ended_at' => now()->subDays(5)->addMinutes(18),
            'steps' => ['Deteksi ISP Router down', 'Notifikasi tim NOC', 'Cek koneksi WAN', 'Koordinasi ISP', 'Aktivasi backup link', 'Konfirmasi jaringan pulih'],
            'resolved' => true,
        ]);
        SimulationLog::create([
            'scenario_id' => $sc3->id, 'user_id' => $admin->id,
            'started_at' => now()->subDays(2), 'ended_at' => now()->subDays(2)->addMinutes(25),
            'steps' => ['Deteksi fiber cut', 'Dispatch teknisi lapangan', 'Aktivasi jalur backup', 'Perbaikan kabel fiber', 'Test konektivitas'],
            'resolved' => true,
        ]);
        SimulationLog::create([
            'scenario_id' => $sc5->id, 'user_id' => $teknisi1->id,
            'started_at' => now()->subHours(3), 'ended_at' => null,
            'steps' => ['Cek status server SIAKAD', 'Investigasi database connection', 'Restart service MySQL'],
            'resolved' => false,
        ]);
    }
}

