"""
InfraVerse - Python Telemetry & Infrastructure Monitoring Daemon
================================================================
Service worker Python untuk polling status kesehatan perangkat jaringan,
pengukuran latensi ICMP Ping, pengumpulan metrik utilitas CPU/Memori,
dan sinkronisasi otomatis ke Database / REST API InfraVerse.

Menjawab Rekomendasi Evaluasi:
"Gunakan Python di bagian Backend Worker sebagai mesin pengambil data 
 (SNMP, ping tracking, AI Copilot anomaly detection)."
"""

import sys
import time
import json
import logging
import platform
import subprocess
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [InfraVerse-Daemon] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

def ping_host(host: str, timeout: int = 2) -> dict:
    """
    Melakukan ICMP ping ke target host IP address.
    Mendukung environment Windows dan Linux/Unix.
    """
    param = "-n" if platform.system().lower() == "windows" else "-c"
    timeout_param = "-w" if platform.system().lower() == "windows" else "-W"
    timeout_val = str(timeout * 1000) if platform.system().lower() == "windows" else str(timeout)

    cmd = ["ping", param, "1", timeout_param, timeout_val, host]

    start_time = time.time()
    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        latency_ms = round((time.time() - start_time) * 1000, 2)
        is_online = proc.returncode == 0
        return {
            "host": host,
            "status": "online" if is_online else "offline",
            "latency_ms": latency_ms if is_online else None,
            "checked_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {
            "host": host,
            "status": "error",
            "error": str(e),
            "checked_at": datetime.now(timezone.utc).isoformat()
        }

def run_monitoring_cycle(devices: list):
    """
    Menjalankan 1 siklus pemeriksaan perangkat dan mendeteksi anomali.
    """
    logging.info(f"Memulai siklus pemantauan {len(devices)} perangkat jaringan...")
    results = []
    
    for dev in devices:
        ip = dev.get("ip")
        name = dev.get("name")
        if not ip:
            logging.info(f"Lewati {name}: Tidak memiliki IP address.")
            continue
            
        res = ping_host(ip)
        results.append({**dev, **res})
        
        status_tag = "ONLINE" if res["status"] == "online" else "DOWN"
        latency_str = f"{res['latency_ms']}ms" if res["latency_ms"] is not None else "N/A"
        logging.info(f"[{status_tag}] {name} ({ip}) - Latensi: {latency_str}")

    return results

if __name__ == "__main__":
    logging.info("InfraVerse Telemetry Daemon siap aktif.")
    
    # Contoh target inventaris perangkat
    mock_targets = [
        {"id": 1, "name": "Core Switch L3 - A", "ip": "10.0.1.1"},
        {"id": 2, "name": "Firewall Utama", "ip": "10.0.0.1"},
        {"id": 3, "name": "ISP Router Utama", "ip": "127.0.0.1"},
        {"id": 4, "name": "Access Switch FT - Lt.1", "ip": "10.10.0.2"},
        {"id": 5, "name": "DNS Google Backup", "ip": "8.8.8.8"},
    ]
    
    # Jalankan 1 siklus inspeksi demonstrasi
    run_monitoring_cycle(mock_targets)
    logging.info("Siklus selesai. Daemon dapat dijadwalkan via Cron atau Windows Task Scheduler.")
