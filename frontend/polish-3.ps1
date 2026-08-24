if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "src\pages\Simulation","src\pages\DigitalTwin","src\pages\Mapping" | Out-Null

Write-Host "Menulis SimulationPage (timer + scoring + efek dramatis)..." -ForegroundColor Cyan

@'
import { useEffect, useState, useRef } from "react";
import { simulationService } from "../../services/simulationService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import toast from "react-hot-toast";

const TYPE_ICON = {
  router_down:"🔀", switch_down:"🔌", fiber_cut:"✂️",
  ups_failure:"🔋", server_offline:"🖥",
};
const TYPE_COLOR = {
  router_down:   { border:"border-blue-500/40",   bg:"bg-blue-500/5",   glow:"shadow-blue-500/20" },
  switch_down:   { border:"border-purple-500/40", bg:"bg-purple-500/5", glow:"shadow-purple-500/20" },
  fiber_cut:     { border:"border-yellow-500/40", bg:"bg-yellow-500/5", glow:"shadow-yellow-500/20" },
  ups_failure:   { border:"border-pink-500/40",   bg:"bg-pink-500/5",   glow:"shadow-pink-500/20" },
  server_offline:{ border:"border-green-500/40",  bg:"bg-green-500/5",  glow:"shadow-green-500/20" },
};

function getScore(seconds, totalSteps) {
  if (seconds <= 0) return 100;
  const base = 100;
  const penalty = Math.floor(seconds / 10);
  return Math.max(10, base - penalty);
}

function getRating(score) {
  if (score >= 90) return { label:"S", color:"text-yellow-400", desc:"Respons Sempurna" };
  if (score >= 75) return { label:"A", color:"text-green-400",  desc:"Sangat Baik" };
  if (score >= 55) return { label:"B", color:"text-blue-400",   desc:"Baik" };
  if (score >= 35) return { label:"C", color:"text-orange-400", desc:"Cukup" };
  return { label:"D", color:"text-red-400", desc:"Perlu Latihan" };
}

export default function SimulationPage() {
  const [scenarios, setScenarios]   = useState([]);
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [running, setRunning]       = useState(null);
  const [stepIndex, setStepIndex]   = useState(0);
  const [resolving, setResolving]   = useState(false);
  const [result, setResult]         = useState(null);
  const [tab, setTab]               = useState("scenarios");
  const [elapsed, setElapsed]       = useState(0);
  const [paused, setPaused]         = useState(false);
  const timerRef                    = useRef(null);
  const startTimeRef                = useRef(null);

  const load = async () => {
    const [sc, lg] = await Promise.all([
      simulationService.getAll(),
      simulationService.getLogs(),
    ]);
    setScenarios(sc.data);
    setLogs(lg.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startTimer = () => {
    startTimeRef.current = Date.now() - elapsed * 1000;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => () => stopTimer(), []);

  const handleRun = async (scenario) => {
    try {
      const res = await simulationService.run(scenario.id);
      setRunning(res.data);
      setStepIndex(0);
      setElapsed(0);
      setResult(null);
      startTimer();
    } catch {
      toast.error("Gagal memulai simulasi.");
    }
  };

  const handleNextStep = () => {
    if (stepIndex < (running?.steps?.length ?? 0) - 1) {
      setStepIndex(i => i + 1);
    }
  };

  const handleResolve = async () => {
    stopTimer();
    setResolving(true);
    try {
      const res = await simulationService.resolve(running.log_id);
      const score  = getScore(elapsed, running.steps.length);
      const rating = getRating(score);
      setResult({
        duration: elapsed,
        steps:    running.steps.length,
        score,
        rating,
        durationFromApi: res.data.duration_seconds,
      });
      setResolving(false);
      load();
    } catch {
      toast.error("Gagal menyelesaikan simulasi.");
      setResolving(false);
    }
  };

  const handleClose = () => {
    stopTimer();
    setRunning(null);
    setResult(null);
    setElapsed(0);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  const formatDuration = (s) => {
    if (!s && s !== 0) return "—";
    if (s < 60) return `${s} detik`;
    return `${Math.floor(s/60)}m ${s%60}d`;
  };

  const progress = running ? Math.round(((stepIndex + 1) / running.steps.length) * 100) : 0;

  return (
    <div className="p-8">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Simulation Center" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Simulation Center</h2>
          <p className="text-slate-400 text-sm mt-1">
            Latih respons insiden infrastruktur secara terstruktur dan terukur
          </p>
        </div>
        <div className="flex gap-3 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
            <p className="text-xl font-bold text-purple-400">{scenarios.length}</p>
            <p className="text-xs text-slate-500">Skenario</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
            <p className="text-xl font-bold text-green-400">{logs.filter(l => l.resolved).length}</p>
            <p className="text-xs text-slate-500">Diselesaikan</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit">
        {[["scenarios","⚡ Skenario"],["logs","📋 Riwayat"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-100"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({length:5}).map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : tab === "scenarios" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {scenarios.map((s) => {
            const c = TYPE_COLOR[s.scenario_type] ?? { border:"border-slate-700", bg:"bg-slate-800", glow:"" };
            return (
              <div key={s.id}
                className={`border rounded-xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg ${c.border} ${c.bg} hover:${c.glow}`}>
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">{TYPE_ICON[s.scenario_type] ?? "⚡"}</div>
                  <div>
                    <h3 className="font-semibold text-slate-100 leading-tight">{s.name}</h3>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">{s.scenario_type.replace(/_/g," ")}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>

                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-xs text-orange-300 font-semibold mb-1">⚠ Dampak Sistem:</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.impact_description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {s.device && (
                    <span className="flex items-center gap-1">
                      🎯 <span className="text-slate-300">{s.device.name}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    📋 <span>{s.affected_device_ids?.length ?? 0} perangkat terdampak</span>
                  </span>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
                  <span className="text-xs text-slate-600">
                    {s.times_run > 0
                      ? `⏱ ${s.times_run}× dijalankan`
                      : "Belum pernah dijalankan"}
                  </span>
                  <button onClick={() => handleRun(s)}
                    className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-blue-600/30 active:scale-95">
                    ▶ Jalankan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Skenario</th>
                <th className="px-4 py-3 font-medium">Dijalankan Oleh</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Durasi</th>
                <th className="px-4 py-3 font-medium">Hasil</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">
                  <div className="text-3xl mb-2">📋</div>
                  <p>Belum ada simulasi dijalankan</p>
                </td></tr>
              ) : logs.map((l) => (
                <tr key={l.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{TYPE_ICON[l.type] ?? "⚡"}</span>
                      <span className="text-slate-200 font-medium">{l.scenario}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{l.user}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {l.started_at ? new Date(l.started_at).toLocaleString("id-ID") : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs font-mono">
                    {formatDuration(l.duration)}
                  </td>
                  <td className="px-4 py-3">
                    {l.resolved
                      ? <span className="text-xs px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">✓ Selesai</span>
                      : <span className="text-xs px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">⏳ Belum</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SIMULATION RUNNER ── */}
      {running && !result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.85)" }}>
          {/* Red pulse border effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-2 border-red-500/30 animate-pulse rounded-none" />
          </div>

          <div className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-2xl shadow-2xl shadow-red-500/10 relative overflow-hidden">
            {/* Animated top bar */}
            <div className="h-1 bg-slate-700 w-full">
              <div className="h-1 bg-red-500 transition-all duration-500"
                style={{ width:`${progress}%` }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <div className="w-2 h-2 rounded-full bg-red-500 opacity-50" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">{running.scenario.name}</h3>
                  <p className="text-xs text-slate-500">{running.scenario.impact_description}</p>
                </div>
              </div>

              {/* Live timer */}
              <div className="text-right">
                <div className={`text-2xl font-mono font-bold tabular-nums ${elapsed > 120 ? "text-red-400" : elapsed > 60 ? "text-yellow-400" : "text-green-400"}`}>
                  {formatTime(elapsed)}
                </div>
                <p className="text-xs text-slate-500">waktu berjalan</p>
              </div>
            </div>

            {/* Affected devices banner */}
            {(running.scenario.affected_device_ids?.length ?? 0) > 0 && (
              <div className="px-6 py-2.5 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2">
                <span className="text-sm">⚠</span>
                <p className="text-xs text-orange-300 font-medium">
                  {running.scenario.affected_device_ids.length} perangkat terdampak — respons segera diperlukan
                </p>
              </div>
            )}

            {/* Steps */}
            <div className="px-6 py-4 space-y-2 max-h-80 overflow-y-auto">
              {running.steps.map((step, i) => (
                <div key={i}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                    i < stepIndex
                      ? "bg-green-500/10 border border-green-500/20 text-green-300 opacity-70"
                      : i === stepIndex
                      ? "bg-blue-500/15 border border-blue-500/40 text-slate-100 shadow-lg shadow-blue-500/10"
                      : "bg-slate-800/60 border border-slate-700/50 text-slate-600"
                  }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-all ${
                    i < stepIndex ? "bg-green-500 text-white"
                    : i === stepIndex ? "bg-blue-500 text-white ring-2 ring-blue-400/50"
                    : "bg-slate-700 text-slate-500"
                  }`}>
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Langkah {stepIndex + 1} dari {running.steps.length}
                <span className="mx-2 text-slate-700">·</span>
                {progress}% selesai
              </div>
              <div className="flex gap-3">
                <button onClick={handleClose}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
                  Batalkan
                </button>
                {stepIndex < running.steps.length - 1 ? (
                  <button onClick={handleNextStep}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95">
                    Langkah Berikutnya →
                  </button>
                ) : (
                  <button onClick={handleResolve} disabled={resolving}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 active:scale-95">
                    {resolving ? "Menyelesaikan..." : "✓ Insiden Teratasi"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT CARD ── */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.85)" }}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl text-center p-8">
            <div className={`text-7xl font-black mb-2 ${result.rating.color}`}>
              {result.rating.label}
            </div>
            <p className={`text-lg font-semibold mb-1 ${result.rating.color}`}>
              {result.rating.desc}
            </p>
            <p className="text-slate-400 text-sm mb-6">Simulasi berhasil diselesaikan!</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 rounded-xl p-3">
                <p className="text-2xl font-bold text-blue-400">{result.score}</p>
                <p className="text-xs text-slate-500 mt-0.5">Skor</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3">
                <p className="text-2xl font-bold text-purple-400">{formatTime(result.duration)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Waktu</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-400">{result.steps}</p>
                <p className="text-xs text-slate-500 mt-0.5">Langkah</p>
              </div>
            </div>

            {/* Score bar */}
            <div className="bg-slate-800 rounded-full h-3 mb-6 overflow-hidden">
              <div className={`h-3 rounded-full transition-all duration-1000 ${
                result.score >= 75 ? "bg-green-500" : result.score >= 50 ? "bg-yellow-500" : "bg-red-500"
              }`} style={{ width:`${result.score}%` }} />
            </div>

            <p className="text-xs text-slate-500 mb-6">
              {result.score >= 90
                ? "Respons luar biasa cepat! Kamu siap menangani insiden nyata."
                : result.score >= 75
                ? "Penanganan yang baik. Terus latih untuk meningkatkan waktu respons."
                : result.score >= 50
                ? "Cukup baik. Pelajari kembali SOP untuk mempercepat respons."
                : "Perlu lebih banyak latihan. Jangan menyerah!"}
            </p>

            <button onClick={handleClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Simulation\SimulationPage.jsx" -Encoding ascii

Write-Host "Menulis DigitalTwinPage (rack realistis)..." -ForegroundColor Cyan

@'
import { useEffect, useRef, useState, useCallback } from "react";
import { digitalTwinService } from "../../services/digitalTwinService";
import toast from "react-hot-toast";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";

const STATUS_COLOR = {
  active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444",
};
const STATUS_LABEL = { active:"Aktif", inactive:"Nonaktif", maintenance:"Maintenance", down:"Down" };
const STATUS_BG = {
  active:"bg-green-500/10 border-green-500/30 text-green-400",
  inactive:"bg-slate-500/10 border-slate-500/30 text-slate-400",
  maintenance:"bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  down:"bg-red-500/10 border-red-500/30 text-red-400",
};
const TYPE_ICON = {
  router:"🔀", switch:"🔌", firewall:"🛡", server:"🖥",
  access_point:"📡", ups:"🔋", other:"📦",
};
const TYPE_COLOR_HEX = {
  router:"#3b82f6", switch:"#8b5cf6", firewall:"#ef4444",
  server:"#10b981", access_point:"#f59e0b", ups:"#ec4899", other:"#6b7280",
};
const RACK_U_HEIGHT = 28;
const RACK_PADDING  = 16;
const RACK_WIDTH    = 340;

function RackUnit({ device, isSelected, onClick, simMode, affectedIds }) {
  const uH     = RACK_U_HEIGHT * (device.u_size ?? 1);
  const status = simMode && affectedIds.includes(device.id) ? "down" : device.status;
  const color  = STATUS_COLOR[status];
  const typeC  = TYPE_COLOR_HEX[device.type] ?? "#6b7280";
  const pulse  = status === "active" && !simMode;

  return (
    <div
      onClick={() => onClick(device)}
      className={`relative flex items-center gap-2 px-3 cursor-pointer rounded select-none transition-all duration-200 group
        ${isSelected ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900 z-10" : "hover:brightness-125"}
        ${simMode && affectedIds.includes(device.id) ? "animate-pulse" : ""}
      `}
      style={{
        height: `${uH}px`,
        background: `linear-gradient(135deg, #1a2236 0%, #0f172a 100%)`,
        border: `1px solid ${isSelected ? "#3b82f6" : "#334155"}`,
        borderLeft: `3px solid ${typeC}`,
      }}
    >
      {/* LED status */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <div className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
          style={{
            background: color,
            boxShadow: pulse ? `0 0 6px 2px ${color}` : status === "down" ? "none" : `0 0 3px ${color}`,
          }} />
        {uH > 32 && (
          <div className="w-2 h-1.5 rounded-full" style={{ background: typeC, opacity:0.6 }} />
        )}
      </div>

      {/* Device info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none">{TYPE_ICON[device.type] ?? "📦"}</span>
          <p className="text-xs font-semibold text-slate-200 truncate leading-none">
            {device.name}
          </p>
        </div>
        {uH > 32 && (
          <p className="text-xs text-slate-500 truncate mt-1 leading-none">
            {device.vendor} {device.model}
          </p>
        )}
        {uH > 48 && device.ip && (
          <p className="text-xs font-mono text-slate-600 mt-0.5 leading-none">{device.ip}</p>
        )}
      </div>

      {/* Right side info */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs font-mono text-slate-600">U{device.u_pos}</span>
        {uH > 32 && (
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${STATUS_BG[status]}`}
            style={{ fontSize:"9px" }}>
            {STATUS_LABEL[status]}
          </span>
        )}
      </div>

      {/* Port indicators (dekoratif) */}
      {uH >= RACK_U_HEIGHT * 2 && (
        <div className="absolute right-2 bottom-1.5 flex gap-0.5">
          {Array.from({ length: Math.min(8, device.type === "switch" ? 8 : 4) }).map((_, i) => (
            <div key={i} className="w-2 h-1.5 rounded-sm"
              style={{
                background: i < (device.type === "switch" ? 6 : 2)
                  ? (status === "active" ? "#22c55e" : "#374151")
                  : "#1e293b",
                boxShadow: i < 2 && status === "active" ? `0 0 3px ${STATUS_COLOR.active}` : "none",
              }} />
          ))}
        </div>
      )}

      {/* Hover tooltip */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50
        bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs whitespace-nowrap
        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
        <p className="font-semibold text-slate-100">{device.name}</p>
        <p className="text-slate-400">{device.vendor} {device.model}</p>
        {device.ip && <p className="text-slate-500 font-mono">{device.ip}</p>}
        <p className="mt-1" style={{ color }}>{STATUS_LABEL[status]}</p>
      </div>
    </div>
  );
}

function RackView({ rack, selectedDevice, onSelectDevice, simMode, affectedIds }) {
  const totalSlots = rack.total_u ?? 42;
  const usedSlots  = rack.devices.reduce((acc, d) => acc + (d.u_size ?? 1), 0);
  const freeSlots  = totalSlots - usedSlots;

  return (
    <div className="flex-shrink-0" style={{ width: RACK_WIDTH }}>
      {/* Rack header */}
      <div className="bg-slate-700 border border-slate-600 rounded-t-xl px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-100 text-sm">🗄 {rack.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{totalSlots}U total · {usedSlots}U terpakai · {freeSlots}U kosong</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-slate-400">{rack.devices.filter(d => d.status === "active").length} aktif</span>
          </div>
          {rack.devices.some(d => d.status === "down") && (
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400">{rack.devices.filter(d => d.status === "down").length} down</span>
            </div>
          )}
        </div>
      </div>

      {/* Rack body */}
      <div className="border-x border-slate-600 bg-slate-900 relative">
        {/* U number ruler */}
        <div className="absolute left-0 top-0 bottom-0 w-5 border-r border-slate-700/50 flex flex-col">
          {Array.from({ length: totalSlots }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center justify-center">
              {(i + 1) % 5 === 0 && (
                <span className="text-slate-700" style={{ fontSize:"7px" }}>{i + 1}</span>
              )}
            </div>
          ))}
        </div>

        {/* Devices */}
        <div className="ml-5 flex flex-col gap-px py-px"
          style={{ minHeight: totalSlots * RACK_U_HEIGHT + RACK_PADDING }}>
          {[...rack.devices]
            .sort((a, b) => (a.u_pos ?? 99) - (b.u_pos ?? 99))
            .map((device) => (
              <RackUnit
                key={device.id}
                device={device}
                isSelected={selectedDevice?.id === device.id}
                onClick={onSelectDevice}
                simMode={simMode}
                affectedIds={affectedIds}
              />
            ))
          }

          {/* Empty slots */}
          {freeSlots > 0 && (
            <div className="flex items-center justify-center text-xs text-slate-700 border border-dashed border-slate-800 rounded"
              style={{ height: freeSlots * RACK_U_HEIGHT }}>
              {freeSlots}U kosong
            </div>
          )}
        </div>
      </div>

      {/* Rack footer */}
      <div className="bg-slate-700/50 border border-t-0 border-slate-600 rounded-b-xl px-4 py-2">
        <div className="flex gap-1">
          {Object.entries(STATUS_COLOR).map(([s, c]) => {
            const count = rack.devices.filter(d => d.status === s).length;
            if (!count) return null;
            return (
              <div key={s} className="flex items-center gap-1 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                {count}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DigitalTwinPage() {
  const [sceneData, setSceneData]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [updating, setUpdating]       = useState(false);
  const [simMode, setSimMode]         = useState(false);
  const [affectedIds, setAffectedIds] = useState([]);
  const [viewMode, setViewMode]       = useState("rack");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await digitalTwinService.getScene(1);
      setSceneData(res.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const allDevices = sceneData?.racks?.flatMap(r => r.devices) ?? [];
  const statusCounts = allDevices.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  const handleStatusChange = async (newStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await digitalTwinService.updateStatus(selected.id, newStatus);
      toast.success(`${selected.name} → ${STATUS_LABEL[newStatus]}`);
      setSelected(prev => ({ ...prev, status: newStatus }));
      setSceneData(prev => ({
        ...prev,
        racks: prev.racks.map(r => ({
          ...r,
          devices: r.devices.map(d =>
            d.id === selected.id ? { ...d, status: newStatus } : d
          ),
        })),
      }));
    } catch {
      toast.error("Gagal mengubah status.");
    } finally { setUpdating(false); }
  };

  const handleResetAll = async () => {
    if (!window.confirm("Reset semua perangkat ke status Aktif?")) return;
    for (const d of allDevices) {
      if (d.status !== "active") {
        await digitalTwinService.updateStatus(d.id, "active");
      }
    }
    toast.success("Semua perangkat direset ke Aktif.");
    setSimMode(false);
    setAffectedIds([]);
    setSelected(null);
    load();
  };

  const toggleSimMode = () => {
    if (!simMode) {
      const downIds = allDevices
        .filter(d => d.status === "down" || d.status === "maintenance")
        .map(d => d.id);
      setAffectedIds(downIds.length > 0 ? downIds : [allDevices[0]?.id].filter(Boolean));
      toast("Mode Simulasi Aktif — perangkat terdampak ditandai merah", { icon:"⚠️" });
    } else {
      setAffectedIds([]);
      toast("Mode Simulasi Dimatikan");
    }
    setSimMode(s => !s);
  };

  return (
    <div className="flex flex-col h-full">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Digital Twin" }]}
        className="px-8 pt-6" />

      {/* Top bar */}
      <div className="px-8 pb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Digital Twin 3D</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {sceneData?.building?.name} · Visualisasi real-time infrastruktur
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status summary pills */}
          <div className="flex gap-2">
            {Object.entries(STATUS_COLOR).map(([s, c]) => {
              const count = statusCounts[s] ?? 0;
              if (!count) return null;
              return (
                <div key={s} className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
                  style={{ borderColor: c + "40", background: c + "10", color: c }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                  {count} {STATUS_LABEL[s]}
                </div>
              );
            })}
          </div>

          <button onClick={toggleSimMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              simMode
                ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
            }`}>
            {simMode ? "⚠ Mode Simulasi ON" : "⚡ Mode Simulasi"}
          </button>

          <button onClick={handleResetAll}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 transition-colors">
            🔄 Reset Semua
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-6">
        {/* Rack viewer */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-3 animate-pulse">🗄</div>
                <p className="text-slate-400">Memuat rack server...</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-6 pb-4">
              {(sceneData?.racks ?? []).map(rack => (
                <RackView
                  key={rack.id}
                  rack={rack}
                  selectedDevice={selected}
                  onSelectDevice={setSelected}
                  simMode={simMode}
                  affectedIds={affectedIds}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="w-72 flex-shrink-0 bg-slate-800 border border-slate-700 rounded-2xl overflow-y-auto">
          {selected ? (
            <div className="p-5">
              {/* Device header */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: (TYPE_COLOR_HEX[selected.type] ?? "#6b7280") + "20" }}>
                  {TYPE_ICON[selected.type] ?? "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-100 leading-tight">{selected.name}</h3>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">{selected.type?.replace("_"," ")}</p>
                </div>
              </div>

              {/* Current status */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-5 ${STATUS_BG[selected.status]}`}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: STATUS_COLOR[selected.status],
                    boxShadow: selected.status === "active" ? `0 0 6px ${STATUS_COLOR.active}` : "none" }} />
                <div>
                  <p className="text-xs font-semibold">{STATUS_LABEL[selected.status]}</p>
                </div>
              </div>

              {/* Device info */}
              <div className="space-y-2 mb-5">
                {[
                  ["Vendor",  selected.vendor ?? "—"],
                  ["Model",   selected.model  ?? "—"],
                  ["IP",      selected.ip     ?? "—"],
                  ["Posisi",  `U${selected.u_pos ?? "?"}`],
                  ["Ukuran",  `${selected.u_size ?? 1}U`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs text-slate-200 font-mono">{val}</span>
                  </div>
                ))}
              </div>

              {/* Change status */}
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Ubah Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_LABEL).map(([s, label]) => (
                    <button key={s}
                      disabled={updating || s === selected.status}
                      onClick={() => handleStatusChange(s)}
                      className={`py-2 px-3 text-xs rounded-xl border font-medium transition-all ${
                        s === selected.status
                          ? "opacity-100 cursor-default"
                          : "hover:brightness-125 active:scale-95 cursor-pointer opacity-60 hover:opacity-100"
                      }`}
                      style={{
                        borderColor: STATUS_COLOR[s] + "50",
                        color: STATUS_COLOR[s],
                        background: s === selected.status ? STATUS_COLOR[s] + "25" : STATUS_COLOR[s] + "08",
                      }}>
                      {s === selected.status && "● "}{label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-3 text-center leading-relaxed">
                  Perubahan tersimpan ke database dan langsung terrefleksi
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🗄</div>
                <h3 className="font-semibold text-slate-300 mb-1">Pilih Perangkat</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Klik perangkat di dalam rack untuk melihat detail dan mengubah status
                </p>
              </div>

              <hr className="border-slate-700 my-4" />

              {/* Rack summary */}
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Ringkasan Rack</p>
                {(sceneData?.racks ?? []).map(rack => (
                  <div key={rack.id} className="mb-4">
                    <p className="text-xs font-semibold text-slate-300 mb-2">{rack.name}</p>
                    <div className="space-y-1">
                      {rack.devices.map(d => (
                        <div key={d.id}
                          onClick={() => setSelected(d)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors">
                          <div className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: STATUS_COLOR[d.status] }} />
                          <span className="text-xs text-slate-300 truncate flex-1">{d.name}</span>
                          <span className="text-xs text-slate-600">U{d.u_pos}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-slate-700 my-4" />

              {/* Legend */}
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Legenda Status</p>
                <div className="space-y-2">
                  {Object.entries(STATUS_COLOR).map(([s, c]) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: c, boxShadow: s === "active" ? `0 0 4px ${c}` : "none" }} />
                      <span className="text-xs text-slate-400">{STATUS_LABEL[s]}</span>
                      <span className="ml-auto text-xs text-slate-600 font-bold">{statusCounts[s] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\pages\DigitalTwin\DigitalTwinPage.jsx" -Encoding ascii

Write-Host "Menulis MappingPage (animasi + simulate failure)..." -ForegroundColor Cyan

@'
import { useEffect, useRef, useState } from "react";
import { mappingService } from "../../services/mappingService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import toast from "react-hot-toast";

const TYPE_COLOR  = { router:"#3b82f6", switch:"#8b5cf6", firewall:"#ef4444", server:"#10b981", access_point:"#f59e0b", ups:"#ec4899", other:"#6b7280" };
const TYPE_ICON   = { router:"🔀", switch:"🔌", firewall:"🛡", server:"🖥", access_point:"📡", ups:"🔋", other:"📦" };
const STATUS_C    = { active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444" };
const CONN_COLOR  = { fiber:"#3b82f6", utp:"#94a3b8", wireless:"#f59e0b", other:"#6b7280" };
const NODE_W = 150; const NODE_H = 64; const RADIUS = 230;

function autoLayout(nodes) {
  const order = { router:0, firewall:1, switch:2, server:3, access_point:4, ups:5, other:6 };
  const sorted = [...nodes].sort((a,b) => (order[a.type]??6)-(order[b.type]??6));
  const cx = 560, cy = 340;
  return sorted.map((n, i) => {
    const angle = (2*Math.PI*i/sorted.length) - Math.PI/2;
    return { ...n, x: cx + RADIUS*Math.cos(angle), y: cy + RADIUS*Math.sin(angle) };
  });
}

export default function MappingPage() {
  const { user } = useAuthStore();
  const canWrite  = user?.role === "admin" || user?.role === "teknisi";
  const svgRef    = useRef(null);
  const animRef   = useRef(null);
  const packetsRef= useRef([]);

  const [nodes, setNodes]         = useState([]);
  const [edges, setEdges]         = useState([]);
  const [rawNodes, setRawNodes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [drag, setDrag]           = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [simFailed, setSimFailed] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [connForm, setConnForm]   = useState({ source_device_id:"", target_device_id:"", connection_type:"utp", port_source:"", port_target:"" });
  const [saving, setSaving]       = useState(false);
  const [tick, setTick]           = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await mappingService.getTopology();
      const positioned = autoLayout(res.data.nodes);
      setNodes(positioned);
      setRawNodes(res.data.nodes);
      setEdges(res.data.edges);
      packetsRef.current = [];
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Animate packets along edges
  useEffect(() => {
    let frame;
    const animate = () => {
      packetsRef.current = packetsRef.current
        .map(p => ({ ...p, t: p.t + 0.008 }))
        .filter(p => p.t <= 1);

      // Spawn new packets on active edges
      if (Math.random() < 0.04 && edges.length > 0) {
        const activeEdges = edges.filter(e => {
          const s = nodes.find(n => n.id === e.source);
          const t = nodes.find(n => n.id === e.target);
          return s && t && (!simFailed || (s.id !== simFailed && t.id !== simFailed));
        });
        if (activeEdges.length > 0) {
          const edge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
          packetsRef.current.push({ edgeId: edge.id, t: 0, color: CONN_COLOR[edge.type] ?? "#94a3b8" });
        }
      }

      setTick(t => t + 1);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [edges, nodes, simFailed]);

  const getNode = id => nodes.find(n => n.id === id);

  const visibleNodes = filterStatus ? nodes.filter(n => n.status === filterStatus) : nodes;
  const visibleIds   = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));

  const getEffectiveStatus = (node) => {
    if (!simFailed) return node.status;
    if (node.id === simFailed) return "down";
    const isDownstream = visibleEdges.some(e =>
      (e.source === simFailed && e.target === node.id) ||
      (e.target === simFailed && e.source === node.id)
    );
    return isDownstream ? "down" : node.status;
  };

  const onMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const svg = svgRef.current;
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const node = nodes.find(n => n.id === nodeId);
    setDrag({ nodeId, offsetX: svgP.x - node.x, offsetY: svgP.y - node.y });
    setSelected(nodeId);
  };

  const onMouseMove = (e) => {
    if (!drag) return;
    const svg = svgRef.current;
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    setNodes(prev => prev.map(n =>
      n.id === drag.nodeId
        ? { ...n, x: svgP.x - drag.offsetX, y: svgP.y - drag.offsetY }
        : n
    ));
  };

  const onMouseUp = () => setDrag(null);

  const handleDeleteConn = async (id) => {
    if (!window.confirm("Hapus koneksi ini?")) return;
    await mappingService.deleteConnection(id);
    toast.success("Koneksi dihapus.");
    load();
  };

  const handleAddConn = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await mappingService.addConnection(connForm);
      toast.success("Koneksi ditambahkan.");
      setShowAdd(false); load();
    } catch { toast.error("Gagal menambah koneksi."); }
    finally { setSaving(false); }
  };

  const handleSimFail = (nodeId) => {
    if (simFailed === nodeId) {
      setSimFailed(null);
      toast("Mode simulasi dimatikan.");
    } else {
      setSimFailed(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      toast(`Simulasi: ${node?.name} down — jalur terdampak ditampilkan`, { icon:"⚠️" });
    }
  };

  const selectedNode  = selected ? nodes.find(n => n.id === selected) : null;
  const selectedEdges = selected ? edges.filter(e => e.source === selected || e.target === selected) : [];

  if (loading) return <div className="p-8 text-slate-400">Memuat topologi jaringan...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Peta Jaringan" }]} />
          <h2 className="text-2xl font-bold text-slate-100">Infrastructure Mapping</h2>
          <p className="text-slate-400 text-sm mt-0.5">{nodes.length} perangkat · {edges.length} koneksi</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs focus:outline-none">
            <option value="">Semua Status</option>
            {["active","inactive","maintenance","down"].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
          {simFailed && (
            <button onClick={() => setSimFailed(null)}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-xs rounded-lg animate-pulse">
              ⚠ Sim Mode ON — Klik untuk matikan
            </button>
          )}
          {canWrite && (
            <button onClick={() => setShowAdd(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors">
              + Tambah Koneksi
            </button>
          )}
          <button onClick={() => { setNodes(autoLayout(rawNodes)); setSelected(null); }}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">
            ↺ Reset Layout
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-4">
        {/* SVG Canvas */}
        <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden relative">
          <svg ref={svgRef} className="w-full h-full" viewBox="0 0 1120 680"
            onMouseMove={onMouseMove} onMouseUp={onMouseUp}
            onClick={() => setSelected(null)}
            style={{ cursor: drag ? "grabbing" : "default" }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0L0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
              </pattern>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#475569" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <rect width="1120" height="680" fill="url(#grid)" />

            {/* Edges */}
            {visibleEdges.map((e) => {
              const s = getNode(e.source);
              const t = getNode(e.target);
              if (!s || !t) return null;
              const sx = s.x + NODE_W/2, sy = s.y + NODE_H/2;
              const tx = t.x + NODE_W/2, ty = t.y + NODE_H/2;
              const mx = (sx+tx)/2, my = (sy+ty)/2;
              const isDown = simFailed && (e.source === simFailed || e.target === simFailed);
              const isHigh = selected && (e.source === selected || e.target === selected);
              const connColor = isDown ? "#ef4444" : CONN_COLOR[e.type] ?? "#94a3b8";
              const opacity   = selected && !isHigh ? 0.15 : 1;

              // Packet positions
              const myPackets = packetsRef.current.filter(p => p.edgeId === e.id && !isDown);

              return (
                <g key={e.id} opacity={opacity}>
                  <line x1={sx} y1={sy} x2={tx} y2={ty}
                    stroke={connColor}
                    strokeWidth={isHigh ? 2.5 : isDown ? 2 : 1.5}
                    strokeDasharray={e.type === "wireless" ? "6,4" : isDown ? "4,3" : undefined}
                    filter={isHigh ? "url(#glow)" : undefined}
                    markerEnd="url(#arrow)" />

                  {/* Animated packets */}
                  {myPackets.map((p, pi) => {
                    const px = sx + (tx - sx) * p.t;
                    const py = sy + (ty - sy) * p.t;
                    return (
                      <circle key={pi} cx={px} cy={py} r="3"
                        fill={p.color}
                        filter="url(#glow)"
                        opacity={0.8} />
                    );
                  })}

                  {/* Port labels */}
                  {isHigh && e.port_source && (
                    <>
                      <text x={sx + (tx-sx)*0.2} y={sy + (ty-sy)*0.2 - 7}
                        textAnchor="middle" fontSize="8" fill="#64748b">{e.port_source}</text>
                      <text x={sx + (tx-sx)*0.8} y={sy + (ty-sy)*0.8 - 7}
                        textAnchor="middle" fontSize="8" fill="#64748b">{e.port_target}</text>
                    </>
                  )}

                  {/* Conn type label */}
                  <text x={mx} y={my - 5} textAnchor="middle" fontSize="8" fill="#475569">
                    {e.type}
                  </text>

                  {/* Delete button */}
                  {canWrite && isHigh && (
                    <g onClick={(ev) => { ev.stopPropagation(); handleDeleteConn(e.id); }}
                      style={{ cursor:"pointer" }}>
                      <circle cx={mx} cy={my+12} r="8" fill="#1e293b" stroke="#ef4444" strokeWidth="1" />
                      <text x={mx} y={my+16} textAnchor="middle" fontSize="9" fill="#ef4444">✕</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {visibleNodes.map((n) => {
              const effStatus  = getEffectiveStatus(n);
              const borderColor= STATUS_C[effStatus] ?? "#6b7280";
              const typeColor  = TYPE_COLOR[n.type] ?? "#6b7280";
              const isSelected = n.id === selected;
              const isDown     = effStatus === "down";

              return (
                <g key={n.id} transform={`translate(${n.x},${n.y})`}
                  style={{ cursor:"grab" }}
                  onMouseDown={e => onMouseDown(e, n.id)}
                  onClick={e => { e.stopPropagation(); setSelected(n.id); }}>

                  {/* Glow for active */}
                  {effStatus === "active" && (
                    <rect width={NODE_W} height={NODE_H} rx="10"
                      fill="none" stroke={borderColor} strokeWidth="1"
                      filter="url(#glow)" opacity="0.3" />
                  )}

                  {/* Node body */}
                  <rect width={NODE_W} height={NODE_H} rx="10"
                    fill={isSelected ? "#1e3a5f" : isDown ? "#2a1515" : "#1e293b"}
                    stroke={isSelected ? "#3b82f6" : borderColor}
                    strokeWidth={isSelected ? 2 : isDown ? 2 : 1.5}
                    strokeDasharray={isDown ? "4,2" : undefined}
                  />

                  {/* Type color bar */}
                  <rect x="0" y="0" width="4" height={NODE_H} rx="2"
                    fill={typeColor} />

                  {/* Icon */}
                  <text x="16" y="26" fontSize="16">{TYPE_ICON[n.type] ?? "📦"}</text>

                  {/* Name */}
                  <text x="36" y="24" fontSize="11" fontWeight="700" fill="#f1f5f9">
                    {n.name.length > 15 ? n.name.slice(0,15)+"…" : n.name}
                  </text>

                  {/* Vendor */}
                  <text x="36" y="38" fontSize="9" fill="#64748b">
                    {n.vendor ? `${n.vendor} ${n.model ?? ""}`.slice(0,20) : n.type}
                  </text>

                  {/* IP */}
                  <text x="36" y="52" fontSize="8" fill="#475569" fontFamily="monospace">
                    {n.ip ?? ""}
                  </text>

                  {/* Status LED */}
                  <circle cx={NODE_W-10} cy={12} r="5" fill={borderColor}
                    filter={effStatus === "active" ? "url(#glow)" : undefined} />

                  {/* Down indicator */}
                  {isDown && (
                    <text x={NODE_W/2} y={NODE_H-6} textAnchor="middle" fontSize="8" fill="#ef4444">
                      ● DOWN
                    </text>
                  )}

                  {/* Simulate fail button */}
                  {isSelected && (
                    <g onClick={e => { e.stopPropagation(); handleSimFail(n.id); }}
                      style={{ cursor:"pointer" }}
                      transform={`translate(${NODE_W/2-30},${NODE_H+5})`}>
                      <rect width="60" height="16" rx="8"
                        fill={simFailed === n.id ? "#7f1d1d" : "#1e293b"}
                        stroke={simFailed === n.id ? "#ef4444" : "#475569"}
                        strokeWidth="1" />
                      <text x="30" y="11" textAnchor="middle" fontSize="8"
                        fill={simFailed === n.id ? "#ef4444" : "#94a3b8"}>
                        {simFailed === n.id ? "✕ Stop Sim" : "⚡ Sim Fail"}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs space-y-1.5">
            <p className="text-slate-500 font-semibold uppercase tracking-wider mb-2" style={{fontSize:"10px"}}>Legenda</p>
            {Object.entries(CONN_COLOR).map(([k,c]) => (
              <div key={k} className="flex items-center gap-2">
                <div className="w-6 h-px" style={{ background:c, borderTop:`2px ${k === "wireless" ? "dashed" : "solid"} ${c}` }} />
                <span className="text-slate-500 capitalize">{k}</span>
              </div>
            ))}
            <hr className="border-slate-700 my-1" />
            <p className="text-slate-600 text-xs">● Paket data bergerak real-time</p>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-64 bg-slate-800 border border-slate-700 rounded-2xl p-4 overflow-y-auto flex-shrink-0">
          {selectedNode ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{TYPE_ICON[selectedNode.type]}</span>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{selectedNode.name}</h3>
                  <p className="text-xs text-slate-500 capitalize">{selectedNode.type?.replace("_"," ")}</p>
                </div>
              </div>
              {[
                ["Vendor/Model", `${selectedNode.vendor ?? "—"} ${selectedNode.model ?? ""}`],
                ["IP Address",   selectedNode.ip ?? "—"],
                ["Status",       selectedNode.status],
                ["Lokasi",       selectedNode.location ?? "—"],
              ].map(([label, val]) => (
                <div key={label} className="mb-3">
                  <p className="text-xs text-slate-600">{label}</p>
                  <p className="text-sm text-slate-200 capitalize">{val}</p>
                </div>
              ))}
              <hr className="border-slate-700 my-3" />
              <p className="text-xs text-slate-500 mb-2">Koneksi ({selectedEdges.length})</p>
              {selectedEdges.map(e => {
                const other = e.source === selectedNode.id ? getNode(e.target) : getNode(e.source);
                const dir   = e.source === selectedNode.id ? "→" : "←";
                return (
                  <div key={e.id} className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                    <span style={{ color: CONN_COLOR[e.type] }}>●</span>
                    <span>{dir} {other?.name ?? "?"}</span>
                    <span className="text-slate-600 ml-auto">{e.type}</span>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-center text-slate-500 text-sm py-8">
              <p className="text-3xl mb-3">🔗</p>
              <p className="font-medium text-slate-400 mb-1">Peta Jaringan</p>
              <p className="text-xs">Klik node untuk detail dan opsi simulasi</p>
              <hr className="border-slate-700 my-4" />
              <div className="text-left space-y-1">
                <p className="text-xs text-slate-600 font-medium mb-2">Tips:</p>
                <p className="text-xs text-slate-600">• Drag node untuk atur layout</p>
                <p className="text-xs text-slate-600">• Klik node → "Sim Fail" untuk simulasi gangguan</p>
                <p className="text-xs text-slate-600">• Titik bergerak = paket data aktif</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <Modal title="Tambah Koneksi" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAddConn} className="space-y-3">
            {[
              { label:"Dari Perangkat", key:"source_device_id" },
              { label:"Ke Perangkat",   key:"target_device_id" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <select required value={connForm[key]}
                  onChange={e => setConnForm({...connForm, [key]: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Pilih perangkat</option>
                  {rawNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipe Koneksi</label>
              <select value={connForm.connection_type}
                onChange={e => setConnForm({...connForm, connection_type: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                {["fiber","utp","wireless","other"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {[
              { label:"Port Sumber", key:"port_source" },
              { label:"Port Tujuan", key:"port_target" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input value={connForm[key]}
                  onChange={e => setConnForm({...connForm, [key]: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowAdd(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Mapping\MappingPage.jsx" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Polish-3 siap." -ForegroundColor Green
Write-Host "Buka /digital-twin, /simulation, /mapping untuk cek hasilnya." -ForegroundColor Yellow