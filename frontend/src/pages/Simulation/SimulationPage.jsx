import { useEffect, useState, useRef } from "react";
import { simulationService } from "../../services/simulationService";
import { deviceService } from "../../services/deviceService";
import useAuthStore from "../../stores/authStore";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import toast from "react-hot-toast";
import {
  Router, Network, Scissors, Battery, Server,
  Play, Clock, CheckCircle, Target, Cpu,
  AlertTriangle, ChevronRight, RotateCcw, Activity, ShieldCheck, Zap,
  Flame, FastForward, Check, ShieldAlert, Award,
  Plus, Pencil, Trash2, X, Save
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
  router_down:    { border:"border-blue-500/40",   bg:"bg-blue-500/5", glow:"shadow-[0_0_20px_rgba(59,130,246,0.15)]", badge: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  switch_down:    { border:"border-purple-500/40", bg:"bg-purple-500/5", glow:"shadow-[0_0_20px_rgba(168,85,247,0.15)]", badge: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  fiber_cut:      { border:"border-amber-500/40",  bg:"bg-amber-500/5", glow:"shadow-[0_0_20px_rgba(245,158,11,0.15)]", badge: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  ups_failure:    { border:"border-pink-500/40",   bg:"bg-pink-500/5", glow:"shadow-[0_0_20px_rgba(236,72,153,0.15)]", badge: "bg-pink-500/20 text-pink-300 border-pink-500/40" },
  server_offline: { border:"border-emerald-500/40",bg:"bg-emerald-500/5", glow:"shadow-[0_0_20px_rgba(160,185,129,0.15)]", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
};

const SEVERITY_INFO = {
  router_down:    { level: "P1 Critical", color: "text-red-400 border-red-500/30 bg-red-500/10" },
  switch_down:    { level: "P2 Major",    color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  fiber_cut:      { level: "P1 Critical", color: "text-red-400 border-red-500/30 bg-red-500/10" },
  ups_failure:    { level: "P2 Major",    color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  server_offline: { level: "P2 Major",    color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
};

function getScore(seconds) {
  if (seconds <= 0) return 100;
  return Math.max(10, 100 - Math.floor(seconds / 10));
}

function getRating(score) {
  if (score >= 90) return { label:"S", color:"text-amber-400", desc:"Respons Sempurna (Perfect Recovery Time)" };
  if (score >= 75) return { label:"A", color:"text-emerald-400",  desc:"Sangat Baik (Fast Incident Mitigation)" };
  if (score >= 55) return { label:"B", color:"text-blue-400",   desc:"Baik (Standard SLA Compliant)" };
  if (score >= 35) return { label:"C", color:"text-orange-400", desc:"Cukup (Acceptable Downtime)" };
  return { label:"D", color:"text-red-400", desc:"Perlu Peningkatan Kecepatan Prosedur" };
}

export default function SimulationPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

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

  // Admin CRUD Modal state
  const [modalOpen, setModalOpen]               = useState(false);
  const [editingScenario, setEditingScenario]   = useState(null);
  const [devicesList, setDevicesList]           = useState([]);
  const [savingScenario, setSavingScenario]     = useState(false);
  const [scenarioForm, setScenarioForm]         = useState({
    name: "",
    scenario_type: "router_down",
    description: "",
    impact_description: "",
    device_id: "",
    affected_device_ids: [],
  });

  const load = async () => {
    const [sc, lg] = await Promise.all([
      simulationService.getAll(),
      simulationService.getLogs(),
    ]);
    setScenarios(sc.data);
    setLogs(lg.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    deviceService.getAll()
      .then(res => setDevicesList(res.data))
      .catch(() => {});
  }, []);

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

  const openCreateModal = () => {
    setEditingScenario(null);
    setScenarioForm({
      name: "",
      scenario_type: "router_down",
      description: "",
      impact_description: "",
      device_id: devicesList[0]?.id ? String(devicesList[0].id) : "",
      affected_device_ids: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingScenario(s);
    setScenarioForm({
      name: s.name,
      scenario_type: s.scenario_type,
      description: s.description || "",
      impact_description: s.impact_description || "",
      device_id: s.device_id ? String(s.device_id) : "",
      affected_device_ids: s.affected_device_ids || [],
    });
    setModalOpen(true);
  };

  const handleDeleteScenario = async (s) => {
    if (!window.confirm(`Hapus skenario simulasi "${s.name}"?`)) return;
    try {
      await simulationService.destroy(s.id);
      toast.success("Skenario simulasi berhasil dihapus.");
      load();
    } catch {
      toast.error("Gagal menghapus skenario.");
    }
  };

  const handleSaveScenario = async (e) => {
    e.preventDefault();
    if (!scenarioForm.name.trim()) {
      toast.error("Nama skenario wajib diisi.");
      return;
    }
    setSavingScenario(true);
    try {
      const payload = {
        name: scenarioForm.name.trim(),
        scenario_type: scenarioForm.scenario_type,
        description: scenarioForm.description,
        impact_description: scenarioForm.impact_description,
        device_id: scenarioForm.device_id ? Number(scenarioForm.device_id) : null,
        affected_device_ids: scenarioForm.affected_device_ids,
      };
      if (editingScenario) {
        await simulationService.update(editingScenario.id, payload);
        toast.success("Skenario berhasil diperbarui.");
      } else {
        await simulationService.create(payload);
        toast.success("Skenario berhasil ditambahkan.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan skenario.");
    } finally {
      setSavingScenario(false);
    }
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
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Simulation Command Center" }]} />

      {/* Header Banner */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400" /> Incident Response Sandbox
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-semibold">ISO 27001 Disaster Recovery Testing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-200 to-white">
              Simulasi Gangguan & Pemulihan Bencana
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed font-medium">
              Uji ketangguhan infrastruktur kampus secara terkontrol. Latih prosedur darurat, mitigasi downtime, dan ukur kecepatan respons tim NOC secara terukur.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="glass px-5 py-3 rounded-2xl border border-slate-700/60 text-center shadow-lg">
              <p className="text-2xl font-black text-purple-400 font-mono">{scenarios.length}</p>
              <p className="text-[11px] uppercase font-bold text-slate-400 mt-0.5">Skenario Bencana</p>
            </div>
            <div className="glass px-5 py-3 rounded-2xl border border-slate-700/60 text-center shadow-lg">
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {logs.filter(l => l.resolved).length}
              </p>
              <p className="text-[11px] uppercase font-bold text-slate-400 mt-0.5">Insiden Teratasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Workflow Bar (Explains the sequence clearly so it's not confusing) */}
      <div className="glass-strong p-6 rounded-3xl border border-slate-800 shadow-xl">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Activity size={15} className="text-purple-400" /> 4 Tahapan Standar Prosedur Simulasi Insiden (SOP):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "1", name: "Deteksi & Notifikasi", desc: "Sistem mendeteksi anomali pada link atau perangkat host" },
            { step: "2", name: "Isolasi Gangguan", desc: "Isolasi area kegagalan dan alihkan ke backup redundant" },
            { step: "3", name: "Prosedur Mitigasi", desc: "Eksekusi langkah SOP perbaikan teknis berurutan" },
            { step: "4", name: "Verifikasi & Evaluasi", desc: "Layanan pulih 100% dan kalkulasi skor kepatuhan SLA" },
          ].map((s) => (
            <div key={s.step} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-black text-sm flex items-center justify-center flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{s.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Switcher & Admin Action */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit">
          {[["scenarios","Katalog Skenario Insiden"],["logs","Riwayat Eksekusi Simulasi"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === key
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {isAdmin && tab === "scenarios" && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all cursor-pointer"
          >
            <Plus size={16} /> Tambah Skenario Simulasi
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : tab === "scenarios" ? (
        
        /* SCENARIOS CARDS */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {scenarios.map((s, idx) => {
            const c = TYPE_COLOR[s.scenario_type] ?? { border:"border-slate-700", bg:"bg-slate-800", glow:"", badge: "bg-slate-800 text-slate-300" };
            const sev = SEVERITY_INFO[s.scenario_type] ?? { level: "P2 Major", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" };

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`glass rounded-3xl p-7 border ${c.border} ${c.glow} hover:scale-[1.01] transition-all flex flex-col justify-between group shadow-2xl relative overflow-hidden`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                      {TYPE_ICON[s.scenario_type] ?? <Cpu size={28} className="text-slate-400" />}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] font-mono uppercase font-black px-3 py-1 rounded-xl border ${sev.color}`}>
                        {sev.level}
                      </span>
                      <span className={`text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-lg border ${c.badge}`}>
                        {s.scenario_type?.replace(/_/g," ")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-100 text-lg group-hover:text-purple-300 transition-colors leading-snug">{s.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed font-medium">{s.description}</p>
                  </div>

                  {/* Impact Alert */}
                  <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30 text-xs space-y-1.5">
                    <p className="text-xs text-amber-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Dampak Insiden Kegagalan:
                    </p>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">{s.impact_description}</p>
                  </div>

                  {/* Step Workflow Preview */}
                  <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Tahapan Prosedur SOP:</p>
                      <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {s.steps?.length ?? 0} Langkah
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {s.steps?.slice(0, 3).map((st, stIdx) => (
                        <div key={stIdx} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                          <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                            {stIdx + 1}
                          </span>
                          <span className="truncate">{st}</span>
                        </div>
                      ))}
                      {(s.steps?.length ?? 0) > 3 && (
                        <p className="text-[10px] text-slate-500 font-bold italic pl-6">+ {(s.steps.length - 3)} langkah prosedur lanjutan...</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800/90 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Cpu size={15} className="text-indigo-400" />
                    <span>{s.affected_device_ids?.length ?? 0} Perangkat Terdampak</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(s); }}
                          title="Edit Skenario Simulasi"
                          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-purple-600/20 text-slate-400 hover:text-purple-300 border border-slate-700/80 hover:border-purple-500/40 transition-all cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteScenario(s); }}
                          title="Hapus Skenario Simulasi"
                          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-slate-700/80 hover:border-red-500/40 transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    <button onClick={() => handleRun(s)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 cursor-pointer">
                      <Play size={14} /> Uji Simulasi
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (

        /* LOGS TABLE */
        <div className="glass-strong rounded-3xl border border-slate-700/60 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-6 py-4">Skenario Insiden</th>
                  <th className="px-6 py-4">Eksekutor</th>
                  <th className="px-6 py-4">Waktu Eksekusi</th>
                  <th className="px-6 py-4">Durasi Respon</th>
                  <th className="px-6 py-4">Status Pemulihan</th>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                          {TYPE_ICON[l.type] ?? <Cpu size={16} />}
                        </div>
                        <span className="text-slate-100 font-bold">{l.scenario}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{l.user}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {l.started_at ? new Date(l.started_at).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="px-6 py-4 text-purple-400 font-mono font-bold text-xs">
                      {formatDuration(l.duration)}
                    </td>
                    <td className="px-6 py-4">
                      {l.resolved ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-xl border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <CheckCircle size={12} /> Teratasi (Resolved)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-xl border bg-amber-500/10 text-amber-400 border-amber-500/20">
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-strong rounded-3xl border-2 border-red-500/60 w-full max-w-2xl shadow-[0_25px_80px_rgba(239,68,68,0.25)] overflow-hidden relative"
          >
            {/* Top Red Glow Line */}
            <div className="h-1.5 bg-slate-800">
              <div className="h-1.5 bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-500"
                style={{ width:`${progress}%` }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-800 bg-slate-900/70">
              <div className="flex items-center gap-3.5">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <div>
                  <h3 className="font-black text-slate-100 text-lg">{running.scenario.name}</h3>
                  <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Simulasi Insiden Bencana Sedang Berjalan</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-mono font-black tabular-nums ${
                  elapsed > 120 ? "text-red-400" : elapsed > 60 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {formatTime(elapsed)}
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Stopwatch Respons</p>
              </div>
            </div>

            {/* Impact Banner */}
            <div className="px-7 py-3.5 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-200 font-semibold leading-relaxed">
                {running.scenario.impact_description}
              </p>
            </div>

            {/* Steps Container */}
            <div className="px-7 py-6 space-y-3 max-h-[380px] overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Prosedur SOP Eksekusi:
                </p>
                <span className="text-xs font-mono font-bold text-blue-400">
                  Langkah {stepIndex + 1} dari {running.steps.length}
                </span>
              </div>
              {running.steps.map((step, i) => (
                <div key={i}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl text-xs transition-all ${
                    i < stepIndex
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 opacity-80"
                      : i === stepIndex
                      ? "bg-blue-600/20 border-2 border-blue-400 text-slate-100 font-semibold shadow-[0_0_15px_rgba(59,130,246,0.25)] scale-[1.01]"
                      : "bg-slate-900/60 border border-slate-800 text-slate-500 opacity-50"
                  }`}>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i < stepIndex ? "bg-emerald-500 text-white shadow-[0_0_10px_#10b981]"
                    : i === stepIndex ? "bg-blue-500 text-white shadow-[0_0_10px_#3b82f6]"
                    : "bg-slate-800 text-slate-500"
                  }`}>
                    {i < stepIndex ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="leading-relaxed mt-0.5">{step}</p>
                    {i === stepIndex && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        Sedang Dikerjakan...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Control */}
            <div className="px-7 py-4 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between gap-4">
              <button onClick={handleClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer">
                Batalkan
              </button>

              <div className="flex items-center gap-3">
                {stepIndex < running.steps.length - 1 ? (
                  <>
                    <button onClick={handleNextStep}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all active:scale-95 cursor-pointer">
                      Langkah Berikutnya <ChevronRight size={15} />
                    </button>
                    <button onClick={handleResolve} disabled={resolving}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
                      title="Selesaikan semua langkah secara cepat">
                      <FastForward size={14} className="text-amber-400" /> Selesaikan Cepat
                    </button>
                  </>
                ) : (
                  <button onClick={handleResolve} disabled={resolving}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 active:scale-95 cursor-pointer">
                    <CheckCircle size={15} />
                    {resolving ? "Memproses Pemulihan..." : "Tandai Insiden Teratasi & Nilai"}
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
            className="glass-strong border border-slate-700/80 rounded-3xl w-full max-w-md p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)] text-center relative overflow-hidden"
          >
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 absolute top-0 left-0 right-0" />

            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
              <Award size={30} />
            </div>

            <div className={`text-7xl font-black mb-1 ${result.rating.color} drop-shadow-[0_0_20px_currentColor]`}>
              {result.rating.label}
            </div>
            <p className={`text-base font-bold mb-1 ${result.rating.color}`}>
              {result.rating.desc}
            </p>
            <p className="text-slate-400 text-xs mb-6">Simulasi Pemulihan Berhasil Diselesaikan Sesuai SOP</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label:"Skor Evaluasi", value: `${result.score}/100`, color:"text-blue-400" },
                { label:"Waktu Respons", value: formatTime(result.duration), color:"text-purple-400" },
                { label:"Langkah Kerja", value: `${result.steps} Tahap`, color:"text-emerald-400" },
              ].map(s => (
                <div key={s.label} className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                  <p className={`text-lg font-black font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <button onClick={handleClose}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all cursor-pointer">
              Tutup & Kembali ke Command Center
            </button>
          </motion.div>
        </div>
      )}

      {/* Admin Scenario Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong border border-slate-700/80 rounded-3xl w-full max-w-xl p-7 shadow-2xl relative my-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  {editingScenario ? <Pencil size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingScenario ? "Edit Skenario Simulasi" : "Tambah Skenario Simulasi Baru"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konfigurasi skenario latihan pemulihan insiden untuk teknisi NOC
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveScenario} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                  Nama Skenario Insiden <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Core Switch NOC Cisco Crash & Packet Storm"
                  value={scenarioForm.name}
                  onChange={e => setScenarioForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-3 text-xs font-semibold text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                    Tipe Gangguan <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={scenarioForm.scenario_type}
                    onChange={e => setScenarioForm(prev => ({ ...prev, scenario_type: e.target.value }))}
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-3 text-xs font-semibold text-slate-100 outline-none transition-all"
                  >
                    <option value="router_down">Router Down (Core/Border Gateway)</option>
                    <option value="switch_down">Switch Down (Core/Distribution)</option>
                    <option value="fiber_cut">Fiber Optic Cut (Kabel Putus)</option>
                    <option value="ups_failure">UPS Failure (Daya & Baterai)</option>
                    <option value="server_offline">Server Offline (Database/App)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                    Perangkat Target Utama
                  </label>
                  <select
                    value={scenarioForm.device_id}
                    onChange={e => setScenarioForm(prev => ({ ...prev, device_id: e.target.value }))}
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-3 text-xs font-semibold text-slate-100 outline-none transition-all"
                  >
                    <option value="">-- Pilih Perangkat (Opsional) --</option>
                    {devicesList.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.vendor ?? ""} {d.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                  Deskripsi Insiden & Kronologi
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan latar belakang kegagalan teknis..."
                  value={scenarioForm.description}
                  onChange={e => setScenarioForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all resize-none shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                  Dampak Terhadap Layanan Kampus
                </label>
                <textarea
                  rows={2}
                  placeholder="Dampak pada civitas akademika, aplikasi, atau transmisi gedung..."
                  value={scenarioForm.impact_description}
                  onChange={e => setScenarioForm(prev => ({ ...prev, impact_description: e.target.value }))}
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all resize-none shadow-inner"
                />
              </div>

              {/* Affected Devices Multi-Check */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                  Perangkat Terdampak Kaskade ({scenarioForm.affected_device_ids?.length ?? 0} dipilih)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  {devicesList.length === 0 ? (
                    <p className="text-xs text-slate-500">Tidak ada perangkat yang tersedia.</p>
                  ) : (
                    devicesList.map(d => {
                      const isChecked = scenarioForm.affected_device_ids?.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              const checked = e.target.checked;
                              setScenarioForm(prev => ({
                                ...prev,
                                affected_device_ids: checked
                                  ? [...(prev.affected_device_ids || []), d.id]
                                  : (prev.affected_device_ids || []).filter(id => id !== d.id),
                              }));
                            }}
                            className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="truncate">{d.name} <span className="text-slate-500 text-[10px]">({d.type})</span></span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingScenario}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save size={15} />
                  {savingScenario ? "Menyimpan..." : editingScenario ? "Simpan Perubahan" : "Buat Skenario"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
