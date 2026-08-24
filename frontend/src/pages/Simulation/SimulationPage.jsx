import { useEffect, useState, useRef } from "react";
import { simulationService } from "../../services/simulationService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import toast from "react-hot-toast";
import {
  Router, Network, Scissors, Battery, Server,
  Play, Clock, CheckCircle, Target, Cpu,
  AlertTriangle, ChevronRight, RotateCcw, Activity, ShieldCheck, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_ICON = {
  router_down:    <Router size={24} className="text-blue-400" />,
  switch_down:    <Network size={24} className="text-purple-400" />,
  fiber_cut:      <Scissors size={24} className="text-amber-400" />,
  ups_failure:    <Battery size={24} className="text-pink-400" />,
  server_offline: <Server size={24} className="text-emerald-400" />,
};

const TYPE_COLOR = {
  router_down:    { border:"border-blue-500/40",   bg:"bg-blue-500/5", glow:"shadow-[0_0_15px_rgba(59,130,246,0.15)]" },
  switch_down:    { border:"border-purple-500/40", bg:"bg-purple-500/5", glow:"shadow-[0_0_15px_rgba(168,85,247,0.15)]" },
  fiber_cut:      { border:"border-amber-500/40",  bg:"bg-amber-500/5", glow:"shadow-[0_0_15px_rgba(245,158,11,0.15)]" },
  ups_failure:    { border:"border-pink-500/40",   bg:"bg-pink-500/5", glow:"shadow-[0_0_15px_rgba(236,72,153,0.15)]" },
  server_offline: { border:"border-emerald-500/40",bg:"bg-emerald-500/5", glow:"shadow-[0_0_15px_rgba(16,185,129,0.15)]" },
};

function getScore(seconds) {
  if (seconds <= 0) return 100;
  return Math.max(10, 100 - Math.floor(seconds / 10));
}

function getRating(score) {
  if (score >= 90) return { label:"S", color:"text-amber-400", desc:"Respons Sempurna (Perfect Response)" };
  if (score >= 75) return { label:"A", color:"text-emerald-400",  desc:"Sangat Baik (Fast Recovery)" };
  if (score >= 55) return { label:"B", color:"text-blue-400",   desc:"Baik (Good Mitigation)" };
  if (score >= 35) return { label:"C", color:"text-orange-400", desc:"Cukup (Acceptable Downtime)" };
  return { label:"D", color:"text-red-400", desc:"Perlu Latihan Incident Response" };
}

export default function SimulationPage() {
  const [scenarios, setScenarios] = useState([]);
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [running, setRunning]     = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [result, setResult]       = useState(null);
  const [tab, setTab]             = useState("scenarios");
  const [elapsed, setElapsed]     = useState(0);
  const timerRef                  = useRef(null);
  const startTimeRef              = useRef(null);

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
    startTimeRef.current = Date.now();
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
      await simulationService.resolve(running.log_id);
      const score  = getScore(elapsed);
      const rating = getRating(score);
      setResult({ duration: elapsed, steps: running.steps.length, score, rating });
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
    if (!s && s !== 0) return "-";
    if (s < 60) return `${s} detik`;
    return `${Math.floor(s/60)}m ${s%60}d`;
  };

  const progress = running
    ? Math.round(((stepIndex + 1) / running.steps.length) * 100)
    : 0;

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Simulation Command Center" }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-slate-100">
            Simulasi Gangguan & Disaster Recovery
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Uji Ketahanan Infrastruktur Kampus dengan Skenario Incident Response Terukur
          </p>
        </div>

        <div className="flex gap-3">
          <div className="glass px-4 py-2 rounded-xl border border-slate-700/60 text-center shadow-lg">
            <p className="text-xl font-black text-purple-400">{scenarios.length}</p>
            <p className="text-[10px] uppercase font-bold text-slate-500">Skenario Bencana</p>
          </div>
          <div className="glass px-4 py-2 rounded-xl border border-slate-700/60 text-center shadow-lg">
            <p className="text-xl font-black text-emerald-400">
              {logs.filter(l => l.resolved).length}
            </p>
            <p className="text-[10px] uppercase font-bold text-slate-500">Insiden Teratasi</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 w-fit">
        {[["scenarios","Skenario Bencana"],["logs","Riwayat Simulasi"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === key
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({length:5}).map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : tab === "scenarios" ? (
        
        /* SCENARIOS CARDS */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {scenarios.map((s, idx) => {
            const c = TYPE_COLOR[s.scenario_type] ?? { border:"border-slate-700", bg:"bg-slate-800", glow:"" };
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`glass rounded-2xl p-6 border ${c.border} ${c.glow} hover:scale-[1.01] transition-all flex flex-col justify-between group shadow-xl`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      {TYPE_ICON[s.scenario_type] ?? <Cpu size={24} className="text-slate-400" />}
                    </div>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                      {s.scenario_type?.replace(/_/g," ")}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base leading-snug group-hover:text-purple-300 transition-colors">{s.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>

                  <div className="bg-slate-950/60 rounded-xl p-3 border border-amber-500/20 text-xs space-y-1">
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle size={12} /> Dampak Kegagalan Sistem:
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">{s.impact_description}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Cpu size={13} className="text-indigo-400" />
                    <span>{s.affected_device_ids?.length ?? 0} Perangkat Terdampak</span>
                  </div>

                  <button onClick={() => handleRun(s)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
                    <Play size={13} /> Uji Simulasi
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (

        /* LOGS TABLE */
        <div className="glass-strong rounded-2xl border border-slate-700/60 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-4">Skenario Insiden</th>
                  <th className="px-5 py-4">Eksekutor</th>
                  <th className="px-5 py-4">Waktu Eksekusi</th>
                  <th className="px-5 py-4">Durasi Respon</th>
                  <th className="px-5 py-4">Status Pemulihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      <Clock size={36} className="mx-auto mb-2 text-slate-700" />
                      <p>Belum ada riwayat simulasi yang dijalankan.</p>
                    </td>
                  </tr>
                ) : logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                          {TYPE_ICON[l.type] ?? <Cpu size={14} />}
                        </div>
                        <span className="text-slate-100 font-bold">{l.scenario}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-medium">{l.user}</td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                      {l.started_at ? new Date(l.started_at).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="px-5 py-4 text-purple-400 font-mono font-bold text-xs">
                      {formatDuration(l.duration)}
                    </td>
                    <td className="px-5 py-4">
                      {l.resolved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <CheckCircle size={12} /> Teratasi (Resolved)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-amber-500/10 text-amber-400 border-amber-500/20">
                          <Clock size={12} /> Belum Teratasi
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Simulation Runner Overlay Window */}
      {running && !result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-strong rounded-2xl border-2 border-red-500/60 w-full max-w-2xl shadow-[0_25px_80px_rgba(239,68,68,0.25)] overflow-hidden relative"
          >
            {/* Top Red Glow Line */}
            <div className="h-1 bg-slate-800">
              <div className="h-1 bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-500"
                style={{ width:`${progress}%` }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">{running.scenario.name}</h3>
                  <p className="text-xs text-red-400 font-medium">SIMULASI GANGGULAN INFRASTRUKTUR AKTIF</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-mono font-black tabular-nums ${
                  elapsed > 120 ? "text-red-400" : elapsed > 60 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {formatTime(elapsed)}
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Stopwatch Respons</p>
              </div>
            </div>

            {/* Impact Banner */}
            <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300 font-semibold leading-relaxed">
                {running.scenario.impact_description}
              </p>
            </div>

            {/* Steps Container */}
            <div className="px-6 py-5 space-y-2.5 max-h-[380px] overflow-y-auto">
              {running.steps.map((step, i) => (
                <div key={i}
                  className={`flex items-start gap-3 p-3.5 rounded-xl text-xs transition-all ${
                    i < stepIndex
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 opacity-75"
                      : i === stepIndex
                      ? "bg-blue-600/20 border border-blue-400 text-slate-100 font-medium shadow-[0_0_15px_rgba(59,130,246,0.2)] scale-[1.01]"
                      : "bg-slate-900/60 border border-slate-800 text-slate-500 opacity-50"
                  }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i < stepIndex ? "bg-emerald-500 text-white"
                    : i === stepIndex ? "bg-blue-500 text-white shadow-[0_0_8px_#3b82f6]"
                    : "bg-slate-800 text-slate-500"
                  }`}>
                    {i < stepIndex ? <CheckCircle size={12} /> : i + 1}
                  </div>
                  <span className="leading-relaxed mt-0.5">{step}</span>
                </div>
              ))}
            </div>

            {/* Footer Control */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400 font-mono">
                Progres: <strong className="text-blue-400">{stepIndex + 1}</strong> / {running.steps.length} ({progress}%)
              </p>
              <div className="flex gap-3">
                <button onClick={handleClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all">
                  Batalkan
                </button>
                {stepIndex < running.steps.length - 1 ? (
                  <button onClick={handleNextStep}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all active:scale-95">
                    Langkah Berikutnya <ChevronRight size={14} />
                  </button>
                ) : (
                  <button onClick={handleResolve} disabled={resolving}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50 active:scale-95">
                    <CheckCircle size={14} />
                    {resolving ? "Selesai..." : "Tandai Insiden Teratasi"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Result Score Card Overlay */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong border border-slate-700/80 rounded-2xl w-full max-w-md p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)] text-center relative overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 absolute top-0 left-0 right-0" />

            <div className={`text-7xl font-black mb-1 ${result.rating.color} drop-shadow-[0_0_20px_currentColor]`}>
              {result.rating.label}
            </div>
            <p className={`text-base font-bold mb-1 ${result.rating.color}`}>
              {result.rating.desc}
            </p>
            <p className="text-slate-400 text-xs mb-6">Simulasi Pemulihan Berhasil Selesai</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label:"Skor Evaluasi", value: result.score, color:"text-blue-400" },
                { label:"Waktu Respons", value: formatTime(result.duration), color:"text-purple-400" },
                { label:"Langkah Kerja", value: result.steps, color:"text-emerald-400" },
              ].map(s => (
                <div key={s.label} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <button onClick={handleClose}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all">
              Tutup Ringkasan Evaluasi
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
