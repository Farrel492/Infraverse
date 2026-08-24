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
  AlertTriangle, XCircle, Clock, ShieldCheck, Activity, MapPin, Cpu, HardDrive
} from "lucide-react";
import { motion } from "framer-motion";

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
  if (age < 3) return "text-emerald-400";
  if (age < 5) return "text-amber-400";
  return "text-red-400";
};

const AGE_BAR_COLOR = (age) => {
  if (!age) return "#6b7280";
  if (age < 3) return "#10b981";
  if (age < 5) return "#f59e0b";
  return "#ef4444";
};

const AGE_LABEL = (age) => {
  if (!age) return "";
  if (age < 3) return "Kondisi optimal — Perangkat relatif baru";
  if (age < 5) return "Kondisi stabil — Perlu penjadwalan pemeliharaan preventif";
  return "Perangkat tua — Pertimbangkan refresh / pembaruan garansi";
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
    <div className="p-8 space-y-4">
      <div className="h-6 bg-slate-800 rounded-xl w-48 animate-pulse mb-6" />
      <SkeletonText lines={6} />
    </div>
  );

  if (!device) return (
    <div className="p-8 text-red-400 font-bold">Perangkat tidak ditemukan.</div>
  );

  const location = [
    device.rack?.room?.floor?.building?.name,
    device.rack?.room?.floor?.name,
    device.rack?.room?.name,
    device.rack?.name,
  ].filter(Boolean).join(" › ");

  const tabs = [
    { key:"info",        label:"Spesifikasi & Detail" },
    { key:"connections", label:`Koneksi Port (${(device.source_connections?.length ?? 0) + (device.target_connections?.length ?? 0)})` },
    { key:"maintenance", label:`Riwayat Maintenance (${device.maintenances?.length ?? 0})` },
    { key:"documents",   label:`Berkas Dokumen (${device.documents?.length ?? 0})` },
  ];

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb items={[
        { label:"Dashboard", href:"/dashboard" },
        { label:"Aset", href:"/assets" },
        { label: device.name },
      ]} />

      {/* Header Banner */}
      <div className="glass p-6 rounded-2xl border border-slate-700/60 flex items-start justify-between flex-wrap gap-4 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center flex-shrink-0 text-blue-400 shadow-inner">
            {TYPE_ICON[device.type] ?? <Package size={28} />}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black text-slate-100">{device.name}</h2>
              <StatusBadge status={device.status} />
              {device.warranty_expiry && (
                device.is_under_warranty
                  ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <ShieldCheck size={12} /> Garansi Aktif
                    </span>
                  : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border bg-red-500/10 text-red-400 border-red-500/20">
                      <XCircle size={12} /> Garansi Habis
                    </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-1.5 font-mono">
              <span className="text-slate-300 font-bold">{device.vendor ?? ""} {device.model ?? ""}</span>
              {device.serial_number && (
                <span className="ml-3 text-slate-500">S/N: {device.serial_number}</span>
              )}
            </p>
            <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5">
              <MapPin size={13} className="text-indigo-400 flex-shrink-0" />
              <span>{location || "Perangkat Standalone (Tidak di rack)"}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => navigate("/assets")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all">
            <ArrowLeft size={14} /> Kembali ke Katalog
          </button>
          {canWrite && (
            <button onClick={() => navigate(`/assets?edit=${device.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
              <Edit2 size={14} /> Edit Perangkat
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.key
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INFO */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-2xl border border-slate-700/60 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spesifikasi Teknis & Identifikasi</h3>
            <div className="divide-y divide-slate-800/80">
              {[
                ["Tipe Hardware", device.type?.replace("_"," ") ?? "-"],
                ["IP Address",    device.ip_address ?? "-"],
                ["MAC Address",   device.mac_address ?? "-"],
                ["Serial Number", device.serial_number ?? "-"],
                ["Vendor Merek",  device.vendor ?? "-"],
                ["Model",         device.model ?? "-"],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                  <span className="text-xs text-slate-100 font-mono font-bold">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-slate-700/60 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Pengadaan & Rack</h3>
              <div className="divide-y divide-slate-800/80">
                {[
                  ["Tanggal Pembelian", device.purchase_date
                    ? new Date(device.purchase_date).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })
                    : "-"],
                  ["Garansi Berakhir", device.warranty_expiry
                    ? new Date(device.warranty_expiry).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })
                    : "-"],
                  ["Posisi Slot Rack", device.rack_position ? `Slot U${device.rack_position}` : "-"],
                  ["Tinggi Perangkat", device.rack_units ? `${device.rack_units}U Unit` : "-"],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <span className="text-xs text-slate-400 font-medium">{label}</span>
                    <span className="text-xs text-slate-100 font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-slate-700/60 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metrik Siklus Usia Perangkat</h3>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-black ${AGE_COLOR(device.age_in_years)}`}>
                  {device.age_in_years ?? "-"}
                </span>
                {device.age_in_years && (
                  <span className="text-slate-400 text-xs mb-1 font-semibold">Tahun Operasional</span>
                )}
              </div>
              {device.age_in_years && (
                <>
                  <div className="bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((device.age_in_years / 10) * 100, 100)}%`,
                        background: AGE_BAR_COLOR(device.age_in_years),
                      }} />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    {AGE_LABEL(device.age_in_years)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONNECTIONS */}
      {activeTab === "connections" && (
        <div className="glass-strong rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-5 py-4">Arah Koneksi</th>
                <th className="px-5 py-4">Perangkat Terhubung</th>
                <th className="px-5 py-4">Tipe Media Kabel</th>
                <th className="px-5 py-4">Port Sumber / Port Target</th>
                <th className="px-5 py-4">Status Koneksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {[
                ...(device.source_connections ?? []).map(c => ({ ...c, dir:"Outbound (Ke)", peer: c.target_device })),
                ...(device.target_connections ?? []).map(c => ({ ...c, dir:"Inbound (Dari)", peer: c.source_device })),
              ].map((c, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                      c.dir.includes("Outbound")
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}>
                      {c.dir}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-100">{c.peer?.name ?? "-"}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 capitalize font-mono text-[10px]">
                      {c.connection_type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300 font-mono text-xs">
                    {c.port_source ?? "Port1"} &rarr; {c.port_target ?? "Port1"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
              {((device.source_connections?.length ?? 0) + (device.target_connections?.length ?? 0)) === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    Belum ada koneksi port terkonfigurasi untuk perangkat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: MAINTENANCE */}
      {activeTab === "maintenance" && (
        <div className="glass-strong rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-5 py-4">Tipe Perawatan</th>
                <th className="px-5 py-4">Tanggal Jadwal</th>
                <th className="px-5 py-4">Teknisi Penanggung Jawab</th>
                <th className="px-5 py-4">Status Maintenance</th>
                <th className="px-5 py-4">Catatan Instruksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(device.maintenances ?? []).map((m, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                      m.type === "preventive"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    }`}>
                      {m.type === "preventive" ? "Preventif" : "Korektif"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-200 font-mono">
                    {m.scheduled_date
                      ? new Date(m.scheduled_date).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })
                      : "-"}
                  </td>
                  <td className="px-5 py-4 text-slate-300 font-medium">{m.technician?.name ?? "Tim IT NOC"}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                      m.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : m.status === "in_progress"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}>
                      {m.status === "completed" && <CheckCircle size={12} />}
                      {m.status === "in_progress" && <Clock size={12} />}
                      {m.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 max-w-xs">
                    <p className="line-clamp-2 leading-relaxed">{m.notes ?? "-"}</p>
                  </td>
                </tr>
              ))}
              {(device.maintenances?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    Belum ada riwayat maintenance tercatat untuk perangkat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          {canWrite && (
            <div className="flex justify-end">
              <button onClick={() => setShowDocModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                <Plus size={16} /> Upload Dokumen Baru
              </button>
            </div>
          )}

          {(device.documents?.length ?? 0) === 0 ? (
            <div className="glass p-12 rounded-2xl border border-slate-700/60 text-center space-y-3">
              <FileText size={40} className="mx-auto text-blue-400/70" />
              <h3 className="text-base font-bold text-slate-200">Belum Ada Dokumen Terkait</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Upload datasheet perangkat, sertifikat garansi, atau buku panduan manual.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {device.documents.map((doc) => (
                <div key={doc.id}
                  className="glass p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3 hover:border-blue-500/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-100 text-xs truncate max-w-[180px]">{doc.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{doc.type ?? "PDF Datasheet"}</p>
                    </div>
                  </div>
                  <a href={`/storage/${doc.file_path}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20 transition-all">
                    Buka <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocModal && (
        <Modal title="Upload Dokumen Perangkat" subtitle={`Lampirkan berkas untuk ${device.name}`} onClose={() => setShowDocModal(false)}>
          <form onSubmit={handleUploadDoc} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama / Judul Dokumen</label>
              <input value={docName} onChange={e => setDocName(e.target.value)}
                placeholder="Contoh: Manual Cisco Catalyst 9500 PDF"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/70 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">File Berkas (PDF / Image)</label>
              <input type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => setDocFile(e.target.files[0])}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/70 rounded-xl text-slate-300 text-xs focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-xs cursor-pointer" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowDocModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all disabled:opacity-50">
                {uploading ? "Mengupload..." : "Upload Dokumen"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
