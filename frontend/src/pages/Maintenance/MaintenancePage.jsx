import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { maintenanceService } from "../../services/maintenanceService";
import { deviceService } from "../../services/deviceService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonTable } from "../../components/shared/Skeleton.jsx";
import {
  Wrench, Plus, Edit2, Trash2, CheckCircle,
  Clock, AlertCircle, XCircle, Calendar, ShieldAlert, Activity, CheckCircle2, UserCheck, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";

const STATUS_MAP = {
  scheduled:   { label:"Terjadwal",   cls:"bg-blue-500/10 text-blue-400 border-blue-500/25 shadow-[0_0_10px_rgba(59,130,246,0.15)]", Icon: Clock },
  in_progress: { label:"Berlangsung", cls:"bg-amber-500/10 text-amber-400 border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.15)]", Icon: AlertCircle },
  completed:   { label:"Selesai",     cls:"bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.15)]", Icon: CheckCircle },
  cancelled:   { label:"Dibatalkan",  cls:"bg-slate-500/10 text-slate-400 border-slate-500/20", Icon: XCircle },
};
const TYPE_MAP = { preventive:"Preventif", corrective:"Korektif" };

export default function MaintenancePage() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const canWrite  = user?.role === "admin" || user?.role === "teknisi";

  const [items, setItems]       = useState([]);
  const [devices, setDevices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving]     = useState(false);

  const emptyForm = { device_id:"", type:"preventive", scheduled_date:"", notes:"", status:"scheduled" };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [m, d] = await Promise.all([maintenanceService.getAll(), deviceService.getAll()]);
      setItems(m.data);
      setDevices(d.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  
  // KPI Metrics
  const now = new Date();
  const overdueCount = items.filter(i => i.status === "scheduled" && new Date(i.scheduled_date) < now).length;
  const inProgressCount = items.filter(i => i.status === "in_progress").length;
  const scheduledCount = items.filter(i => i.status === "scheduled").length;
  const completedCount = items.filter(i => i.status === "completed").length;

  const counts = {
    all: items.length,
    scheduled:   scheduledCount,
    in_progress: inProgressCount,
    completed:   completedCount,
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      device_id:      item.device_id ?? "",
      type:           item.type,
      scheduled_date: item.scheduled_date?.substring(0,10) ?? "",
      notes:          item.notes ?? "",
      status:         item.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await maintenanceService.update(editing.id, form);
      else await maintenanceService.create(form);
      toast.success(editing ? "Jadwal diperbarui." : "Jadwal ditambahkan.");
      setShowForm(false); load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Terjadi kesalahan.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await maintenanceService.remove(deleting.id);
    toast.success("Jadwal dihapus.");
    setDeleting(null); load();
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      await maintenanceService.update(item.id, { ...item, status: newStatus });
      toast.success(`Status diubah ke ${STATUS_MAP[newStatus]?.label}.`);
      load();
    } catch { toast.error("Gagal mengubah status."); }
  };

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Pusat Perawatan & Maintenance" }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-slate-100">
            Maintenance Command Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Penjadwalan & Pemantauan Perawatan Infrastruktur Kritis Kampus
          </p>
        </div>
        <button 
          id="btn-add-maintenance"
          onClick={() => navigate("/maintenance/create")}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
        >
          <Plus size={18} /> Tambah Jadwal Maintenance
        </button>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="glass p-5 rounded-2xl border border-slate-700/60 flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-slate-400 text-xs font-semibold">Berlangsung (Active)</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{inProgressCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Teknisi sedang bekerja</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Activity size={24} className="animate-pulse" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
          className={`glass p-5 rounded-2xl border flex items-center justify-between shadow-lg ${
            overdueCount > 0 ? "border-red-500/50 bg-red-500/5" : "border-slate-700/60"
          }`}
        >
          <div>
            <p className="text-slate-400 text-xs font-semibold">Perlu Tindakan (Overdue)</p>
            <h3 className={`text-2xl font-black mt-1 ${overdueCount > 0 ? "text-red-400" : "text-slate-200"}`}>
              {overdueCount}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Lewat batas waktu</p>
          </div>
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
            overdueCount > 0 ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-slate-800 border-slate-700 text-slate-400"
          }`}>
            <AlertTriangle size={24} className={overdueCount > 0 ? "animate-bounce" : ""} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
          className="glass p-5 rounded-2xl border border-slate-700/60 flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-slate-400 text-xs font-semibold">Terjadwal (Scheduled)</p>
            <h3 className="text-2xl font-black text-blue-400 mt-1">{scheduledCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Masa mendatang</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Clock size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
          className="glass p-5 rounded-2xl border border-slate-700/60 flex items-center justify-between shadow-lg"
        >
          <div>
            <p className="text-slate-400 text-xs font-semibold">Selesai (Completed)</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{completedCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Riwayat sukses</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
        </motion.div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 w-fit">
        {[
          ["all","Semua Perawatan"],
          ["in_progress","Berlangsung"],
          ["scheduled","Terjadwal"],
          ["completed","Selesai"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === key
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}>
            {label}
            <span className="ml-2 text-[10px] opacity-75 px-1.5 py-0.5 rounded-md bg-black/20">
              {counts[key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table Container */}
      {loading ? <SkeletonTable rows={5} /> : filtered.length === 0 ? (
        <EmptyState
          icon={<Wrench size={36} className="text-amber-400" />}
          title="Belum Ada Jadwal Perawatan"
          description="Tambahkan jadwal maintenance untuk memantau kondisi perangkat secara berkala."
          action={canWrite ? { label:"Tambah Jadwal", onClick: openAdd } : null}
        />
      ) : (
        <div className="glass-strong rounded-2xl border border-slate-700/60 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-4">Perangkat & Lokasi</th>
                  <th className="px-5 py-4">Tipe Perawatan</th>
                  <th className="px-5 py-4">Tanggal Pelaksanaan</th>
                  <th className="px-5 py-4">Status & Progres</th>
                  <th className="px-5 py-4">Catatan Perbaikan</th>
                  {canWrite && <th className="px-5 py-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => {
                  const s = STATUS_MAP[item.status] ?? { label: item.status, cls:"", Icon: Clock };
                  const isOverdue = item.status === "scheduled" && new Date(item.scheduled_date) < now;

                  return (
                    <tr key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        isOverdue ? "bg-red-500/5 hover:bg-red-500/10" : ""
                      }`}>
                      
                      {/* Device */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-800/90 border border-slate-700/60 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
                            <Wrench size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-100 text-xs group-hover:text-amber-300 transition-colors">
                              {item.device?.name ?? "-"}
                            </p>
                            <p className="text-[10px] text-slate-500 capitalize">
                              {item.device?.type ?? "Hardware"} • {item.device?.vendor ?? ""} {item.device?.model ?? ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                          item.type === "preventive"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                            : "bg-orange-500/10 text-orange-400 border-orange-500/25"
                        }`}>
                          {TYPE_MAP[item.type] ?? item.type}
                        </span>
                      </td>

                      {/* Schedule Date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className={isOverdue ? "text-red-400" : "text-slate-400"} />
                          <div>
                            <p className={`font-mono text-xs ${isOverdue ? "text-red-400 font-bold" : "text-slate-200"}`}>
                              {item.scheduled_date
                                ? new Date(item.scheduled_date).toLocaleDateString("id-ID", {
                                    day:"numeric", month:"short", year:"numeric"
                                  })
                                : "-"}
                            </p>
                            {isOverdue && (
                              <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/20">
                                TERLAMBAT
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-5 py-4">
                        {canWrite ? (
                          <select value={item.status}
                            onChange={e => handleStatusChange(item, e.target.value)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border bg-slate-900 cursor-pointer focus:outline-none transition-all ${s.cls}`}>
                            {Object.entries(STATUS_MAP).map(([k,v]) => (
                              <option key={k} value={k} className="bg-slate-900 text-slate-100">
                                {v.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border ${s.cls}`}>
                            <s.Icon size={12} />
                            {s.label}
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {item.notes ?? "-"}
                        </p>
                      </td>

                      {/* Actions */}
                      {canWrite && (
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => navigate(`/maintenance/${item.id}/edit`)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => setDeleting(item)}
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal 
          title={editing ? "Edit Jadwal Perawatan" : "Buat Jadwal Maintenance Baru"} 
          subtitle="Atur tanggal pelaksanaan, status progres, dan instruksi kerja perawatan infrastruktur."
          maxWidth="max-w-2xl"
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Section 1: Target Perangkat */}
            <div className="glass p-4 rounded-2xl border border-slate-700/60 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Wrench size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">1. Target Perangkat Infrastruktur</h4>
                  <p className="text-[11px] text-slate-400">Pilih perangkat IT yang akan dilakukan tindakan perawatan</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Target Perangkat <span className="text-amber-400">*</span>
                </label>
                <select required value={form.device_id}
                  onChange={e => setForm({...form, device_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
                  <option value="">-- Pilih Perangkat Target --</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.type?.toUpperCase()}) — IP: {d.ip_address || "No IP"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 2: Tipe & Status */}
            <div className="glass p-4 rounded-2xl border border-slate-700/60 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Activity size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">2. Parameter & Status Perawatan</h4>
                  <p className="text-[11px] text-slate-400">Tentukan jenis tindakan dan tahapan progres kerja</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Tipe Perawatan <span className="text-amber-400">*</span>
                  </label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-medium focus:outline-none focus:border-amber-500 transition-all">
                    <option value="preventive">Preventif (Rutin & Pencegahan)</option>
                    <option value="corrective">Korektif (Perbaikan Incident)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Status Progres Pekerjaan <span className="text-amber-400">*</span>
                  </label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-all">
                    {Object.entries(STATUS_MAP).map(([k,v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Waktu & Catatan */}
            <div className="glass p-4 rounded-2xl border border-slate-700/60 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Calendar size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">3. Waktu Execusi & Catatan Prosedur</h4>
                  <p className="text-[11px] text-slate-400">Tanggal pelaksanaan dan rincian tugas teknisi</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Tanggal Pelaksanaan maintenance <span className="text-amber-400">*</span>
                </label>
                <input type="date" required value={form.scheduled_date}
                  onChange={e => setForm({...form, scheduled_date: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Catatan & Instruksi Kerja Prosedur
                </label>
                <textarea rows={4} value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Misal: Cek kapasitas baterai UPS NOC 10KVA, pembersihan debu fan server, update firmware router BGP, dan verifikasi redundansi power supply."
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 resize-none transition-all leading-relaxed" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? "Menyimpan Jadwal..." : "Simpan Jadwal Maintenance"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Hapus jadwal maintenance untuk "${deleting.device?.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
