<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SimulationScenario;
use App\Models\Device;

class NewScenariosSeeder extends Seeder
{
    public function run(): void
    {
        $router   = Device::where('type', 'router')->first();
        $switch   = Device::where('type', 'switch')->first();
        $server   = Device::where('type', 'server')->first();
        $ap       = Device::where('type', 'access_point')->orWhere('type', 'ap')->first();

        $fallback = Device::first();

        $r   = $router ?? $fallback;
        $sw  = $switch ?? $fallback;
        $srv = $server ?? $fallback;
        $apDev = $ap   ?? $fallback;

        $scenarios = [
            [
                'name'               => 'Serangan DDoS Volumetric pada Gateway ISP',
                'scenario_type'      => 'router_down',
                'device_id'          => $r?->id,
                'description'        => 'Gateway router ISP menerima traffic flood UDP/ICMP melebihi 10 Gbps dari botnet eksternal, menyebabkan CPU overload 100% dan tabel routing collapse.',
                'impact_description' => 'Seluruh trafik internet keluar-masuk kampus terhenti. Layanan cloud (Office365, e-Learning, SIAKAD) tidak dapat diakses oleh 15.000+ civitas akademika.',
                'affected_device_ids' => array_values(array_filter([$r?->id, $sw?->id])),
            ],
            [
                'name'               => 'Infeksi Ransomware pada File Server Akademik',
                'scenario_type'      => 'server_offline',
                'device_id'          => $srv?->id,
                'description'        => 'Ransomware varian LockBit 3.0 berhasil mengenkripsi partisi data server file sharing dan database akademik melalui celah RDP yang tidak di-patch.',
                'impact_description' => 'Seluruh data akademik, nilai mahasiswa, dan arsip penelitian terenkripsi dan tidak dapat diakses. Proses perkuliahan terhenti hingga recovery selesai.',
                'affected_device_ids' => array_values(array_filter([$srv?->id])),
            ],
            [
                'name'               => 'Broadcast Storm akibat VLAN Loop di Distribution Layer',
                'scenario_type'      => 'switch_down',
                'device_id'          => $sw?->id,
                'description'        => 'Konfigurasi STP (Spanning Tree Protocol) yang salah pada switch distribusi menyebabkan broadcast storm tidak terkontrol, membanjiri semua port dengan frame duplikat.',
                'impact_description' => 'Utilisasi bandwidth semua segmen LAN mencapai 100%. Seluruh jaringan intranet dan akses lab komputer lumpuh total.',
                'affected_device_ids' => array_values(array_filter([$sw?->id, $r?->id])),
            ],
            [
                'name'               => 'Kegagalan Sistem Pendingin (CRAC) Data Center',
                'scenario_type'      => 'server_offline',
                'device_id'          => $srv?->id,
                'description'        => 'Unit CRAC (Computer Room Air Conditioning) mengalami compressor failure. Suhu rack melampaui 35 derajat Celsius dan thermal protection aktif mematikan semua server.',
                'impact_description' => 'Server shut down otomatis akibat thermal protection. Layanan email, sistem presensi, dan portal akademik tidak beroperasi hingga suhu kembali normal.',
                'affected_device_ids' => array_values(array_filter([$srv?->id, $sw?->id])),
            ],
            [
                'name'               => 'BGP Route Hijacking pada Peering Point ISP',
                'scenario_type'      => 'router_down',
                'device_id'          => $r?->id,
                'description'        => 'Aktor eksternal mengumumkan prefix IP kampus ke internet melalui BGP route injection, sehingga trafik menuju kampus diarahkan ke jaringan tidak sah.',
                'impact_description' => 'Trafik menuju infrastruktur kampus dialihkan ke kendali penyerang. Potensi man-in-the-middle attack pada seluruh komunikasi data berlangsung.',
                'affected_device_ids' => array_values(array_filter([$r?->id])),
            ],
            [
                'name'               => 'Kegagalan Storage Array SAN - Double Disk Failure',
                'scenario_type'      => 'server_offline',
                'device_id'          => $srv?->id,
                'description'        => 'Dua disk drive dalam satu RAID-5 group pada SAN mengalami kegagalan bersamaan, melampaui kapasitas paritas RAID dan data tidak terbaca.',
                'impact_description' => 'Database produksi, backup, dan repository code source tidak dapat diakses. Risiko kehilangan data permanen hingga recovery media selesai.',
                'affected_device_ids' => array_values(array_filter([$srv?->id])),
            ],
            [
                'name'               => 'Kegagalan Massal Access Point - Wireless Controller Down',
                'scenario_type'      => 'switch_down',
                'device_id'          => $sw?->id,
                'description'        => 'Wireless LAN Controller (WLC) crash setelah firmware update gagal. Semua Access Point kehilangan asosiasi dan tidak dapat melayani klien wireless.',
                'impact_description' => 'Seluruh koneksi WiFi kampus mati. Mahasiswa, dosen, dan staf tidak dapat terhubung ke jaringan akademik secara nirkabel di seluruh gedung.',
                'affected_device_ids' => array_values(array_filter([$sw?->id, $apDev?->id])),
            ],
        ];

        foreach ($scenarios as $s) {
            SimulationScenario::updateOrCreate(['name' => $s['name']], $s);
        }
    }
}
