<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SimulationLog;
use App\Models\SimulationScenario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SimulationController extends Controller
{
    public function index(): JsonResponse
    {
        $scenarios = SimulationScenario::with(['device', 'logs' => function ($q) {
            $q->latest()->limit(1);
        }])->get()->map(function ($s) {
            return [
                'id'                 => $s->id,
                'name'               => $s->name,
                'scenario_type'      => $s->scenario_type,
                'description'        => $s->description,
                'impact_description' => $s->impact_description,
                'affected_device_ids'=> $s->affected_device_ids ?? [],
                'device'             => $s->device ? [
                    'id'   => $s->device->id,
                    'name' => $s->device->name,
                    'type' => $s->device->type,
                ] : null,
                'times_run'   => $s->logs->count(),
                'last_run'    => $s->logs->first()?->created_at,
            ];
        });

        return response()->json($scenarios);
    }

    public function show(SimulationScenario $simulation): JsonResponse
    {
        $simulation->load(['device', 'logs.user']);
        return response()->json($simulation);
    }

    public function run(SimulationScenario $simulation): JsonResponse
    {
        $steps = $this->generateSteps($simulation->scenario_type, $simulation->device);

        $log = SimulationLog::create([
            'scenario_id' => $simulation->id,
            'user_id'     => auth()->id(),
            'started_at'  => Carbon::now(),
            'steps'       => $steps,
            'resolved'    => false,
        ]);

        return response()->json([
            'log_id'   => $log->id,
            'steps'    => $steps,
            'scenario' => [
                'name'               => $simulation->name,
                'scenario_type'      => $simulation->scenario_type,
                'impact_description' => $simulation->impact_description,
                'affected_device_ids'=> $simulation->affected_device_ids ?? [],
            ],
        ]);
    }

    public function resolve(SimulationLog $log): JsonResponse
    {
        $log->update([
            'resolved' => true,
            'ended_at' => Carbon::now(),
        ]);

        return response()->json([
            'message'     => 'Simulasi berhasil diselesaikan.',
            'duration_seconds' => $log->started_at
                ? Carbon::parse($log->started_at)->diffInSeconds(Carbon::now())
                : null,
        ]);
    }

    public function logs(): JsonResponse
    {
        $logs = SimulationLog::with(['scenario', 'user'])
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn($l) => [
                'id'          => $l->id,
                'scenario'    => $l->scenario?->name,
                'type'        => $l->scenario?->scenario_type,
                'user'        => $l->user?->name,
                'started_at'  => $l->started_at,
                'ended_at'    => $l->ended_at,
                'resolved'    => $l->resolved,
                'duration'    => $l->started_at && $l->ended_at
                    ? Carbon::parse($l->started_at)->diffInSeconds($l->ended_at)
                    : null,
            ]);

        return response()->json($logs);
    }

    private function generateSteps(string $type, $device): array
    {
        $name = $device?->name ?? 'perangkat';

        $playbooks = [
            'router_down' => [
                "[Deteksi] {$name} tidak merespons ping dari sistem monitoring",
                "[Catat] Waktu kejadian dan dampak pada koneksi downstream",
                "[Periksa] Koneksi fisik kabel WAN dan power supply {$name}",
                "[Akses] Console port atau manajemen out-of-band jika tersedia",
                "[Restart] Coba restart service routing via CLI pada {$name}",
                "[Verifikasi] Routing table dan BGP/OSPF neighbor setelah restart",
                "[Test] Konektivitas internet dari beberapa client internal",
                "[Eskalasi] Hubungi ISP jika masalah ada di sisi upstream",
                "[Dokumentasi] Catat root cause dan buat laporan insiden",
                "[Konfirmasi] Pastikan semua layanan kembali normal",
            ],
            'switch_down' => [
                "[Deteksi] {$name} tidak merespons SNMP polling",
                "[Periksa] Lampu indikator power dan port di {$name}",
                "[Cek] Kondisi power supply dan kabel power {$name}",
                "[Identifikasi] Port dan VLAN yang terdampak",
                "[Restart] Hard reset {$name} jika soft reboot tidak berhasil",
                "[Restore] Konfigurasi dari backup jika diperlukan",
                "[Verifikasi] Spanning Tree Protocol tidak loop setelah online",
                "[Analisis] Log error switch untuk identifikasi penyebab",
                "[Test] Konektivitas semua port yang terhubung",
                "[Dokumentasi] Update dan jadwal preventive maintenance",
            ],
            'fiber_cut' => [
                "[Deteksi] Link down pada port uplink {$name}",
                "[Konfirmasi] Fiber cut dengan OTDR test jika tersedia",
                "[Identifikasi] Titik putus menggunakan peta jalur kabel",
                "[Notifikasi] Tim lapangan untuk inspeksi fisik jalur fiber",
                "[Aktifkan] Jalur backup atau redundant path jika tersedia",
                "[Hubungi] Vendor fiber untuk estimasi waktu perbaikan",
                "[Update] Stakeholder tentang estimasi downtime",
                "[Koordinasi] Splicing fiber dengan teknisi bersertifikat",
                "[Test] BER (Bit Error Rate) setelah perbaikan",
                "[Verifikasi] Throughput normal dan tutup tiket insiden",
            ],
            'ups_failure' => [
                "[Deteksi] {$name} mengeluarkan alarm atau tidak merespons SNMP",
                "[Cek] Level baterai dan kondisi fisik {$name}",
                "[Pastikan] Input power PLN dalam kondisi normal",
                "[Periksa] Suhu ruangan — UPS sensitif terhadap panas berlebih",
                "[Identifikasi] Perangkat kritis yang terhubung ke {$name}",
                "[Pindahkan] Beban kritis ke UPS lain atau generator jika ada",
                "[Hubungi] Vendor APC/Eaton untuk emergency service",
                "[Ganti] Baterai jika usia lebih dari 3 tahun atau kapasitas kurang dari 80 persen",
                "[Konfigurasi] Ulang threshold alarm setelah perbaikan",
                "[Test] Load test UPS untuk verifikasi kapasitas normal",
            ],
            'server_offline' => [
                "[Deteksi] {$name} tidak merespons ping dan HTTP health check",
                "[Akses] iDRAC/iLO atau konsol fisik {$name}",
                "[Periksa] Log sistem: /var/log/syslog atau Event Viewer",
                "[Restart] Coba restart layanan aplikasi yang bermasalah terlebih dahulu",
                "[Cek] Utilisasi disk — full disk sering menyebabkan crash",
                "[Periksa] RAM usage dan kemungkinan OOM killer aktif",
                "[Reboot] Hard reboot {$name} jika layanan tidak bisa di-restart",
                "[Restore] Dari snapshot VM atau backup jika ada korupsi data",
                "[Verifikasi] Koneksi database dan dependency service",
                "[Konfirmasi] Jalankan smoke test aplikasi dan pastikan layanan online",
            ],
        ];

        return $playbooks[$type] ?? [
            "[Deteksi] Masalah pada {$name}",
            "[Identifikasi] Kumpulkan informasi dan identifikasi dampak",
            "[Troubleshoot] Lakukan troubleshooting sesuai SOP",
            "[Verifikasi] Pastikan sistem kembali normal",
        ];
    }
}
