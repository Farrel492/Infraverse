if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

Write-Host "Fix AssetDetailPage..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { deviceService } from "../../services/deviceService";
import useAuthStore from "../../stores/authStore";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonText } from "../../components/shared/Skeleton.jsx";
import Modal from "../../components/shared/Modal.jsx";
import {
  Router, Shield, Network, Server, Wifi, Battery, Package,
  ArrowLeft, Edit2, FileText, Plus, ExternalLink, CheckCircle,
  AlertTriangle, XCircle, Clock
} from "lucide-react";

const TYPE_ICON = {
  router:       <Router size={28} />,
  switch:       <Network size={28} />,
  firewall:     <Shield size={28} />,
  server:       <Server size={28} />,
  access_point: <Wifi size={28} />,
  ups:          <Battery size={28} />,
  other:        <Package size={28} />,
};

const AGE_COLOR = (age) => {
  if (!age) return "text-slate-400";
  if (age < 3) return "text-green-400";
  if (age < 5) return "text-yellow-400";
  return "text-red-400";
};

const AGE_BAR_COLOR = (age) => {
  if (!age) return "#6b7280";
  if (age < 3) return "#22c55e";
  if (age < 5) return "#eab308";
  return "#ef4444";
};

const AGE_LABEL = (age) => {
  if (!age) return "";
  if (age < 3) return "Kondisi baik";
  if (age < 5) return "Perlu diperhatikan";
  return "Pertimbangkan penggantian";
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";

  const [device, setDevice]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("info");
  const [uploading, setUploading]   = useState(false);
  const [docName, setDocName]       = useState("");
  const [docFile, setDocFile]       = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await deviceService.getOne(id);
      setDevice(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("name", docName || docFile.name);
      fd.append("document", docFile);
      fd.append("device_id", id);
      const api = (await import("../../services/api.js")).default;
      await api.post(`/devices/${id}/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Dokumen berhasil diupload.");
      setShowDocModal(false);
      setDocName(""); setDocFile(null);
      load();
    } catch {
      toast.error("Gagal upload dokumen.");
    } finally { setUploading(false); }
  };

  if (loading) return (
    <div className="p-8">
      <div className="h-6 bg-slate-700 rounded w-48 animate-pulse mb-6" />
      <SkeletonText lines={6} />
    </div>
  );

  if (!device) return (
    <div className="p-8 text-red-400">Perangkat tidak ditemukan.</div>
  );

  const location = [
    device.rack?.room?.floor?.building?.name,
    device.rack?.room?.floor?.name,
    device.rack?.room?.name,
    device.rack?.name,
  ].filter(Boolean).join(" / ");

  const tabs = [
    { key:"info",        label:"Informasi" },
    { key:"connections", label:`Koneksi (${(device.source_connections?.length ?? 0) + (device.target_connections?.length ?? 0)})` },
    { key:"maintenance", label:`Maintenance (${device.maintenances?.length ?? 0})` },
    { key:"documents",   label:`Dokumen (${device.documents?.length ?? 0})` },
  ];

  return (
    <div className="p-8">
      <Breadcrumb items={[
        { label:"Dashboard", href:"/dashboard" },
        { label:"Aset", href:"/assets" },
        { label: device.name },
      ]} />

      <div className="flex items-start gap-4 mb-8">
        <div className="w-16 h-16 bg-slate-700 border border-slate-600 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-400">
          {TYPE_ICON[device.type] ?? <Package size={28} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-100">{device.name}</h2>
            <StatusBadge status={device.status} />
            {device.warranty_expiry && (
              device.is_under_warranty
                ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                    <CheckCircle size={11} /> Garansi Aktif
                  </span>
                : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20">
                    <XCircle size={11} /> Garansi Habis
                  </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {device.vendor} {device.model}
            {device.serial_number && (
              <span className="ml-2 text-slate-500">S/N: {device.serial_number}</span>
            )}
          </p>
          <p className="text-slate-500 text-xs mt-1">{location || "Tidak di rack"}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => navigate("/assets")}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
            <ArrowLeft size={14} /> Kembali
          </button>
          {canWrite && (
            <button onClick={() => navigate(`/assets?edit=${device.id}`)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
              <Edit2 size={14} /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-slate-100"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "info" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Detail Perangkat</h3>
            <dl className="space-y-0">
              {[
                ["Tipe",          device.type?.replace("_"," ") ?? "—"],
                ["IP Address",    device.ip_address ?? "—"],
                ["MAC Address",   device.mac_address ?? "—"],
                ["Serial Number", device.serial_number ?? "—"],
                ["Vendor",        device.vendor ?? "—"],
                ["Model",         device.model ?? "—"],
              ].map(([label, val]) => (
                <div key={label}
                  className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-sm text-slate-200 font-mono">{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Informasi Aset</h3>
              <dl className="space-y-0">
                {[
                  ["Tanggal Beli",   device.purchase_date
                    ? new Date(device.purchase_date).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })
                    : "—"],
                  ["Garansi Sampai", device.warranty_expiry
                    ? new Date(device.warranty_expiry).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })
                    : "—"],
                  ["Posisi Rack",    device.rack_position ? `U${device.rack_position}` : "—"],
                  ["Ukuran Rack",    device.rack_units    ? `${device.rack_units}U`    : "—"],
                ].map(([label, val]) => (
                  <div key={label}
                    className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="text-sm text-slate-200">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Usia Perangkat</h3>
              <div className="flex items-end gap-2 mb-3">
                <span className={`text-4xl font-bold ${AGE_COLOR(device.age_in_years)}`}>
                  {device.age_in_years ?? "—"}
                </span>
                {device.age_in_years && (
                  <span className="text-slate-400 text-sm mb-1">tahun</span>
                )}
              </div>
              {device.age_in_years && (
                <>
                  <div className="bg-slate-700 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((device.age_in_years / 10) * 100, 100)}%`,
                        background: AGE_BAR_COLOR(device.age_in_years),
                      }} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {AGE_LABEL(device.age_in_years)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "connections" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Arah</th>
                <th className="px-4 py-3 font-medium">Perangkat</th>
                <th className="px-4 py-3 font-medium">Tipe Kabel</th>
                <th className="px-4 py-3 font-medium">Port</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...(device.source_connections ?? []).map(c => ({ ...c, dir:"Ke", peer: c.target_device })),
                ...(device.target_connections ?? []).map(c => ({ ...c, dir:"Dari", peer: c.source_device })),
              ].map((c, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      c.dir === "Ke"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}>
                      {c.dir}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-100">{c.peer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 capitalize">
                      {c.connection_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {c.port_source} / {c.port_target}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
              {((device.source_connections?.length ?? 0) + (device.target_connections?.length ?? 0)) === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    Tidak ada koneksi terdaftar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Teknisi</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {(device.maintenances ?? []).map((m, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      m.type === "preventive"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    }`}>
                      {m.type === "preventive" ? "Preventif" : "Korektif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    {m.scheduled_date
                      ? new Date(m.scheduled_date).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{m.technician?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${
                      m.status === "completed"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : m.status === "in_progress"
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}>
                      {m.status === "completed" && <CheckCircle size={10} />}
                      {m.status === "in_progress" && <Clock size={10} />}
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-xs">
                    <p className="truncate">{m.notes ?? "—"}</p>
                  </td>
                </tr>
              ))}
              {(device.maintenances?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    Belum ada riwayat maintenance
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "documents" && (
        <div>
          {canWrite && (
            <div className="mb-4">
              <button onClick={() => setShowDocModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                <Plus size={16} /> Upload Dokumen
              </button>
            </div>
          )}
          {(device.documents?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={28} className="text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Belum ada dokumen</h3>
              <p className="text-sm text-slate-500 mb-6">
                Upload manual, datasheet, atau dokumen terkait perangkat ini.
              </p>
              {canWrite && (
                <button onClick={() => setShowDocModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
                  Upload Dokumen
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {device.documents.map((doc) => (
                <div key={doc.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3 hover:border-blue-500/40 transition-colors">
                  <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-100 text-sm truncate">{doc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{doc.type ?? "Dokumen"}</p>
                  </div>
                  <a href={`/storage/${doc.file_path}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 flex-shrink-0">
                    Buka <ExternalLink size={11} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDocModal && (
        <Modal title="Upload Dokumen" onClose={() => setShowDocModal(false)}>
          <form onSubmit={handleUploadDoc} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Dokumen</label>
              <input value={docName} onChange={e => setDocName(e.target.value)}
                placeholder="Contoh: Manual Cisco Catalyst 9300"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">File (PDF, gambar)</label>
              <input type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => setDocFile(e.target.files[0])}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-xs cursor-pointer" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowDocModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600">
                Batal
              </button>
              <button type="submit" disabled={uploading}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
                {uploading ? "Mengupload..." : "Upload"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Assets\AssetDetailPage.jsx" -Encoding ascii

Write-Host "Fix SimulationPage (hapus semua karakter unicode)..." -ForegroundColor Cyan

@'
import { useEffect, useState, useRef } from "react";
import { simulationService } from "../../services/simulationService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import toast from "react-hot-toast";
import {
  Router, Network, Scissors, Battery, Server,
  Play, Clock, CheckCircle, Target, Cpu,
  AlertTriangle, ChevronRight, RotateCcw
} from "lucide-react";

const TYPE_ICON = {
  router_down:    <Router size={28} className="text-blue-400" />,
  switch_down:    <Network size={28} className="text-purple-400" />,
  fiber_cut:      <Scissors size={28} className="text-yellow-400" />,
  ups_failure:    <Battery size={28} className="text-pink-400" />,
  server_offline: <Server size={28} className="text-green-400" />,
};

const TYPE_COLOR = {
  router_down:    { border:"border-blue-500/40",   bg:"bg-blue-500/5" },
  switch_down:    { border:"border-purple-500/40", bg:"bg-purple-500/5" },
  fiber_cut:      { border:"border-yellow-500/40", bg:"bg-yellow-500/5" },
  ups_failure:    { border:"border-pink-500/40",   bg:"bg-pink-500/5" },
  server_offline: { border:"border-green-500/40",  bg:"bg-green-500/5" },
};

function getScore(seconds) {
  if (seconds <= 0) return 100;
  return Math.max(10, 100 - Math.floor(seconds / 10));
}

function getRating(score) {
  if (score >= 90) return { label:"S", color:"text-yellow-400", desc:"Respons Sempurna" };
  if (score >= 75) return { label:"A", color:"text-green-400",  desc:"Sangat Baik" };
  if (score >= 55) return { label:"B", color:"text-blue-400",   desc:"Baik" };
  if (score >= 35) return { label:"C", color:"text-orange-400", desc:"Cukup" };
  return { label:"D", color:"text-red-400", desc:"Perlu Latihan" };
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
    if (!s && s !== 0) return "—";
    if (s < 60) return `${s} detik`;
    return `${Math.floor(s/60)}m ${s%60}d`;
  };

  const progress = running
    ? Math.round(((stepIndex + 1) / running.steps.length) * 100)
    : 0;

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
        <div className="flex gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-center">
            <p className="text-xl font-bold text-purple-400">{scenarios.length}</p>
            <p className="text-xs text-slate-500">Skenario</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-center">
            <p className="text-xl font-bold text-green-400">
              {logs.filter(l => l.resolved).length}
            </p>
            <p className="text-xs text-slate-500">Diselesaikan</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit">
        {[["scenarios","Skenario"],["logs","Riwayat"]].map(([key, label]) => (
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
            const c = TYPE_COLOR[s.scenario_type] ?? { border:"border-slate-700", bg:"bg-slate-800" };
            return (
              <div key={s.id}
                className={`border rounded-xl p-5 flex flex-col gap-3 transition-all ${c.border} ${c.bg}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {TYPE_ICON[s.scenario_type] ?? <Cpu size={28} className="text-slate-400" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 leading-tight">{s.name}</h3>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">
                      {s.scenario_type?.replace(/_/g," ")}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>

                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-xs text-orange-300 font-semibold mb-1 flex items-center gap-1">
                    <AlertTriangle size={11} /> Dampak Sistem:
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.impact_description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {s.device && (
                    <span className="flex items-center gap-1">
                      <Target size={11} />
                      <span className="text-slate-300">{s.device.name}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Cpu size={11} />
                    {s.affected_device_ids?.length ?? 0} perangkat terdampak
                  </span>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    {s.times_run > 0 ? (
                      <><Clock size={10} /> {s.times_run}x dijalankan</>
                    ) : "Belum pernah dijalankan"}
                  </span>
                  <button onClick={() => handleRun(s)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all active:scale-95">
                    <Play size={12} /> Jalankan
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
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    <Clock size={32} className="mx-auto mb-2 text-slate-700" />
                    <p>Belum ada simulasi dijalankan</p>
                  </td>
                </tr>
              ) : logs.map((l) => (
                <tr key={l.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="text-slate-400 flex-shrink-0">
                        {TYPE_ICON[l.type] ?? <Cpu size={16} />}
                      </div>
                      <span className="text-slate-200 font-medium">{l.scenario}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{l.user}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {l.started_at
                      ? new Date(l.started_at).toLocaleString("id-ID")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs font-mono">
                    {formatDuration(l.duration)}
                  </td>
                  <td className="px-4 py-3">
                    {l.resolved
                      ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                          <CheckCircle size={10} /> Selesai
                        </span>
                      : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          <Clock size={10} /> Belum
                        </span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simulation Runner */}
      {running && !result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.85)" }}>
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden">
            <div className="h-1 bg-slate-700">
              <div className="h-1 bg-red-500 transition-all duration-500"
                style={{ width:`${progress}%` }} />
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <div className="w-2 h-2 rounded-full bg-red-500 opacity-50" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">{running.scenario.name}</h3>
                  <p className="text-xs text-slate-500">{running.scenario.impact_description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-mono font-bold tabular-nums ${
                  elapsed > 120 ? "text-red-400" : elapsed > 60 ? "text-yellow-400" : "text-green-400"
                }`}>
                  {formatTime(elapsed)}
                </div>
                <p className="text-xs text-slate-500">waktu berjalan</p>
              </div>
            </div>

            {(running.scenario.affected_device_ids?.length ?? 0) > 0 && (
              <div className="px-6 py-2.5 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-400" />
                <p className="text-xs text-orange-300 font-medium">
                  {running.scenario.affected_device_ids.length} perangkat terdampak — respons segera diperlukan
                </p>
              </div>
            )}

            <div className="px-6 py-4 space-y-2 max-h-80 overflow-y-auto">
              {running.steps.map((step, i) => (
                <div key={i}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                    i < stepIndex
                      ? "bg-green-500/10 border border-green-500/20 text-green-300 opacity-70"
                      : i === stepIndex
                      ? "bg-blue-500/15 border border-blue-500/40 text-slate-100"
                      : "bg-slate-800/60 border border-slate-700/50 text-slate-600"
                  }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    i < stepIndex ? "bg-green-500 text-white"
                    : i === stepIndex ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-500"
                  }`}>
                    {i < stepIndex ? <CheckCircle size={12} /> : i + 1}
                  </div>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Langkah {stepIndex + 1} dari {running.steps.length} ({progress}% selesai)
              </p>
              <div className="flex gap-3">
                <button onClick={handleClose}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg">
                  Batalkan
                </button>
                {stepIndex < running.steps.length - 1 ? (
                  <button onClick={handleNextStep}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg active:scale-95">
                    Berikutnya <ChevronRight size={14} />
                  </button>
                ) : (
                  <button onClick={handleResolve} disabled={resolving}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 active:scale-95">
                    <CheckCircle size={14} />
                    {resolving ? "Menyelesaikan..." : "Insiden Teratasi"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Card */}
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
            <p className="text-slate-400 text-sm mb-6">Simulasi berhasil diselesaikan</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label:"Skor",    value: result.score,            color:"text-blue-400" },
                { label:"Waktu",   value: formatTime(result.duration), color:"text-purple-400" },
                { label:"Langkah", value: result.steps,            color:"text-green-400" },
              ].map(s => (
                <div key={s.label} className="bg-slate-800 rounded-xl p-3">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-800 rounded-full h-3 mb-6 overflow-hidden">
              <div className="h-3 rounded-full transition-all duration-1000"
                style={{
                  width:`${result.score}%`,
                  background: result.score >= 75 ? "#22c55e" : result.score >= 50 ? "#eab308" : "#ef4444",
                }} />
            </div>

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

Write-Host "Fix DigitalTwinPage (hapus karakter unicode di strings)..." -ForegroundColor Cyan

@'
import { useEffect, useState, useCallback } from "react";
import { digitalTwinService } from "../../services/digitalTwinService";
import toast from "react-hot-toast";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import {
  Server, Router, Shield, Network, Wifi, Battery,
  Package, RefreshCw, Zap, ZapOff, RotateCcw
} from "lucide-react";

const STATUS_COLOR = {
  active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444",
};
const STATUS_LABEL  = { active:"Aktif", inactive:"Nonaktif", maintenance:"Maintenance", down:"Down" };
const STATUS_BG     = {
  active:      "bg-green-500/10 border-green-500/30 text-green-400",
  inactive:    "bg-slate-500/10 border-slate-500/30 text-slate-400",
  maintenance: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  down:        "bg-red-500/10 border-red-500/30 text-red-400",
};

const TYPE_ICON_COMPONENT = {
  router:       Router,
  switch:       Network,
  firewall:     Shield,
  server:       Server,
  access_point: Wifi,
  ups:          Battery,
  other:        Package,
};

const TYPE_COLOR_HEX = {
  router:"#3b82f6", switch:"#8b5cf6", firewall:"#ef4444",
  server:"#10b981", access_point:"#f59e0b", ups:"#ec4899", other:"#6b7280",
};

const RACK_U_HEIGHT = 28;
const RACK_WIDTH    = 340;

function DeviceIcon({ type, size = 14 }) {
  const IconComponent = TYPE_ICON_COMPONENT[type] ?? Package;
  return <IconComponent size={size} />;
}

function RackUnit({ device, isSelected, onClick, simMode, affectedIds }) {
  const uH     = RACK_U_HEIGHT * (device.u_size ?? 1);
  const status = simMode && affectedIds.includes(device.id) ? "down" : device.status;
  const color  = STATUS_COLOR[status];
  const typeC  = TYPE_COLOR_HEX[device.type] ?? "#6b7280";
  const pulse  = status === "active" && !simMode;

  return (
    <div onClick={() => onClick(device)}
      className={`relative flex items-center gap-2 px-3 cursor-pointer rounded select-none transition-all duration-200 group
        ${isSelected ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900 z-10" : "hover:brightness-125"}
        ${simMode && affectedIds.includes(device.id) ? "animate-pulse" : ""}
      `}
      style={{
        height: `${uH}px`,
        background: "linear-gradient(135deg, #1a2236 0%, #0f172a 100%)",
        border: `1px solid ${isSelected ? "#3b82f6" : "#334155"}`,
        borderLeft: `3px solid ${typeC}`,
      }}>
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <div className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
          style={{
            background: color,
            boxShadow: pulse ? `0 0 6px 2px ${color}` : `0 0 3px ${color}`,
          }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 flex-shrink-0">
            <DeviceIcon type={device.type} size={12} />
          </span>
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

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs font-mono text-slate-600">U{device.u_pos}</span>
        {uH > 32 && (
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${STATUS_BG[status]}`}
            style={{ fontSize:"9px" }}>
            {STATUS_LABEL[status]}
          </span>
        )}
      </div>

      {uH >= RACK_U_HEIGHT * 2 && (
        <div className="absolute right-2 bottom-1.5 flex gap-0.5">
          {Array.from({ length: Math.min(6, device.type === "switch" ? 6 : 3) }).map((_, i) => (
            <div key={i} className="w-2 h-1.5 rounded-sm"
              style={{
                background: i < 2 && status === "active" ? "#22c55e" : "#1e293b",
              }} />
          ))}
        </div>
      )}

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
      <div className="bg-slate-700 border border-slate-600 rounded-t-xl px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Server size={14} className="text-slate-400" />
            {rack.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {totalSlots}U total · {usedSlots}U terpakai · {freeSlots}U kosong
          </p>
        </div>
        <div className="text-right space-y-0.5">
          {rack.devices.filter(d => d.status === "active").length > 0 && (
            <div className="flex items-center gap-1 justify-end">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-slate-400">
                {rack.devices.filter(d => d.status === "active").length} aktif
              </span>
            </div>
          )}
          {rack.devices.some(d => d.status === "down") && (
            <div className="flex items-center gap-1 justify-end">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400">
                {rack.devices.filter(d => d.status === "down").length} down
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="border-x border-slate-600 bg-slate-900 relative">
        <div className="absolute left-0 top-0 bottom-0 w-5 border-r border-slate-700/50 flex flex-col">
          {Array.from({ length: totalSlots }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center justify-center">
              {(i + 1) % 5 === 0 && (
                <span className="text-slate-700" style={{ fontSize:"7px" }}>{i + 1}</span>
              )}
            </div>
          ))}
        </div>

        <div className="ml-5 flex flex-col gap-px py-px"
          style={{ minHeight: totalSlots * RACK_U_HEIGHT + 16 }}>
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
            ))}
          {freeSlots > 0 && (
            <div className="flex items-center justify-center text-xs text-slate-700 border border-dashed border-slate-800 rounded"
              style={{ height: freeSlots * RACK_U_HEIGHT }}>
              {freeSlots}U kosong
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-700/50 border border-t-0 border-slate-600 rounded-b-xl px-4 py-2">
        <div className="flex gap-2">
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await digitalTwinService.getScene(1);
      setSceneData(res.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const allDevices   = sceneData?.racks?.flatMap(r => r.devices) ?? [];
  const statusCounts = allDevices.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  const handleStatusChange = async (newStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await digitalTwinService.updateStatus(selected.id, newStatus);
      toast.success(`${selected.name} diubah ke ${STATUS_LABEL[newStatus]}`);
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
      toast("Mode Simulasi Aktif", { icon: "⚡" });
    } else {
      setAffectedIds([]);
      toast("Mode Simulasi Dimatikan");
    }
    setSimMode(s => !s);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-3">
        <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Digital Twin" }]} />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Digital Twin 3D</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {sceneData?.building?.name ?? "—"} · Visualisasi real-time infrastruktur
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                simMode
                  ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                  : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              }`}>
              {simMode ? <ZapOff size={13} /> : <Zap size={13} />}
              {simMode ? "Sim Mode ON" : "Mode Simulasi"}
            </button>

            <button onClick={handleResetAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 transition-colors">
              <RotateCcw size={13} /> Reset Semua
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-6">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw size={32} className="text-slate-600 mx-auto mb-3 animate-spin" />
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

        <div className="w-72 flex-shrink-0 bg-slate-800 border border-slate-700 rounded-2xl overflow-y-auto">
          {selected ? (
            <div className="p-5">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-300"
                  style={{ background: (TYPE_COLOR_HEX[selected.type] ?? "#6b7280") + "20" }}>
                  <DeviceIcon type={selected.type} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-100 leading-tight">{selected.name}</h3>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">
                    {selected.type?.replace("_"," ")}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-5 ${STATUS_BG[selected.status]}`}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    background: STATUS_COLOR[selected.status],
                    boxShadow: selected.status === "active" ? `0 0 6px ${STATUS_COLOR.active}` : "none",
                  }} />
                <p className="text-xs font-semibold">{STATUS_LABEL[selected.status]}</p>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  ["Vendor",  selected.vendor ?? "—"],
                  ["Model",   selected.model  ?? "—"],
                  ["IP",      selected.ip     ?? "—"],
                  ["Posisi",  `U${selected.u_pos ?? "?"}`],
                  ["Ukuran",  `${selected.u_size ?? 1}U`],
                ].map(([label, val]) => (
                  <div key={label}
                    className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs text-slate-200 font-mono">{val}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
                  Ubah Status
                </p>
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
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-3 text-center">
                  Perubahan tersimpan ke database
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="text-center py-8">
                <Server size={36} className="text-slate-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-300 mb-1">Pilih Perangkat</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Klik perangkat di dalam rack untuk melihat detail dan mengubah status
                </p>
              </div>

              <hr className="border-slate-700 my-4" />

              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                  Ringkasan Rack
                </p>
                {(sceneData?.racks ?? []).map(rack => (
                  <div key={rack.id} className="mb-4">
                    <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
                      <Server size={11} /> {rack.name}
                    </p>
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

              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                  Legenda Status
                </p>
                <div className="space-y-2">
                  {Object.entries(STATUS_COLOR).map(([s, c]) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: c, boxShadow: s === "active" ? `0 0 4px ${c}` : "none" }} />
                      <span className="text-xs text-slate-400">{STATUS_LABEL[s]}</span>
                      <span className="ml-auto text-xs text-slate-600 font-bold">
                        {statusCounts[s] ?? 0}
                      </span>
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

Write-Host "Fix MappingPage (hapus karakter unicode di tips panel)..." -ForegroundColor Cyan

# Patch hanya bagian tips panel di MappingPage yang masih ada unicode
$content = Get-Content "src\pages\Mapping\MappingPage.jsx" -Raw -Encoding utf8
$content = $content -replace '.*Drag node untuk atur layout.*', '              <p className="text-xs text-slate-600">Drag node untuk mengatur layout</p>'
$content = $content -replace '.*Klik node.*"Sim Fail".*', '              <p className="text-xs text-slate-600">Klik node, lalu klik Sim Fail untuk simulasi gangguan</p>'
$content = $content -replace '.*Titik bergerak.*', '              <p className="text-xs text-slate-600">Titik bergerak = paket data aktif</p>'
$content = $content -replace '.*Paket data bergerak real-time.*', '              <p className="text-xs text-slate-600">Paket data bergerak real-time</p>'
Set-Content "src\pages\Mapping\MappingPage.jsx" $content -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Semua halaman bebas tanda tanya." -ForegroundColor Green
Write-Host "Hard refresh: Ctrl+Shift+R" -ForegroundColor Yellow