import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { maintenanceService } from "../../services/maintenanceService";
import { deviceService } from "../../services/deviceService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import {
  Wrench, ArrowLeft, Save, Calendar, Activity,
  CheckCircle2, Clock, ChevronDown, Cpu, FileText,
  ShieldAlert, Zap
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "scheduled",   label: "Terjadwal",   color: "blue",    dot: "bg-blue-400",    ring: "border-blue-500/60 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]" },
  { value: "in_progress", label: "Berlangsung", color: "amber",   dot: "bg-amber-400 animate-pulse", ring: "border-amber-500/60 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]" },
  { value: "completed",   label: "Selesai",     color: "emerald", dot: "bg-emerald-400",  ring: "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]" },
  { value: "cancelled",   label: "Dibatalkan",  color: "slate",   dot: "bg-slate-400",    ring: "border-slate-500/40 bg-slate-500/10" },
];

const TYPE_OPTIONS = [
  { value: "preventive", label: "Preventif (Rutin & Pencegahan)", desc: "Pemeliharaan terjadwal rutin untuk mencegah kerusakan", icon: <ShieldAlert size={20} />, color: "emerald" },
  { value: "corrective", label: "Korektif (Perbaikan Insiden)", desc: "Tindakan cepat untuk memperbaiki kerusakan yang terjadi", icon: <Zap size={20} />, color: "rose" },
];

const STATUS_MAP = {
  scheduled:   { label: "Terjadwal",   cls: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  in_progress: { label: "Berlangsung", cls: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  completed:   { label: "Selesai",     cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  cancelled:   { label: "Dibatalkan",  cls: "text-slate-400 border-slate-500/30 bg-slate-500/10" },
};

export default function MaintenanceFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    device_id: "",
    type: "preventive",
    scheduled_date: "",
    notes: "",
    status: "scheduled",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dRes = await deviceService.getAll();
        setDevices(dRes.data);

        if (isEditing) {
          const mRes = await maintenanceService.getAll();
          const item = mRes.data.find(m => String(m.id) === String(id));
          if (item) {
            setForm({
              device_id: item.device_id ?? "",
              type: item.type ?? "preventive",
              scheduled_date: item.scheduled_date ? item.scheduled_date.substring(0, 10) : "",
              notes: item.notes ?? "",
              status: item.status ?? "scheduled",
            });
          }
        }
      } catch {
        toast.error("Gagal memuat data maintenance.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (isEditing) {
        await maintenanceService.update(id, form);
        toast.success("Jadwal maintenance berhasil diperbarui!");
      } else {
        await maintenanceService.create(form);
        toast.success("Jadwal maintenance baru berhasil ditambahkan!");
      }
      navigate("/maintenance");
    } catch (err) {
      setError(err.response?.data?.message ?? "Terjadi kesalahan saat menyimpan jadwal.");
      toast.error("Gagal menyimpan jadwal maintenance.");
    } finally {
      setSaving(false);
    }
  };

  const selectedDevice = devices.find(d => String(d.id) === String(form.device_id));
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === form.status);
  const selectedType = TYPE_OPTIONS.find(t => t.value === form.type);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Memuat formulir maintenance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Maintenance", href: "/maintenance" },
        { label: isEditing ? "Edit Jadwal Perawatan" : "Buat Jadwal Maintenance Baru" }
      ]} />

      {/* Header Banner */}
      <div className="glass p-7 rounded-3xl border border-slate-700/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <button onClick={() => navigate("/maintenance")}
            className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all shadow-md flex-shrink-0">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {isEditing ? "Mode Edit" : "Penjadwalan Baru"}
              </span>
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-slate-100">
              {isEditing ? "Edit Penjadwalan Maintenance" : "Penjadwalan Maintenance Infrastruktur IT"}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Atur instruksi kerja perawatan preventif/korektif dan penugasan teknisi IT
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm font-semibold text-red-400 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            
            {/* Section 1: Target Perangkat */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800/90 pb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">1. Target Perangkat Perawatan</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Pilih perangkat jaringan/server yang akan dilakukan pemeliharaan</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Target Perangkat IT <span className="text-amber-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
                    <Cpu size={18} />
                  </div>
                  <select required value={form.device_id}
                    onChange={e => setForm({ ...form, device_id: e.target.value })}
                    className="w-full pl-11 pr-10 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner appearance-none cursor-pointer">
                    <option value="">-- Pilih Perangkat Target --</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type?.toUpperCase()}) — IP: {d.ip_address || "No IP"}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
                {selectedDevice && (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle2 size={13} className="text-amber-400" />
                    <span className="text-xs text-amber-400 font-semibold font-mono">
                      {selectedDevice.ip_address || "No IP"} · {selectedDevice.type?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Tipe Maintenance */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 border-b border-slate-800/90 pb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">2. Tipe & Status Progres</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Atur sifat tindakan maintenance dan tahapan progres teknisi</p>
                </div>
              </div>

              {/* Maintenance Type — Card Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Tipe Perawatan <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TYPE_OPTIONS.map(t => {
                    const isSelected = form.type === t.value;
                    const colorClass = t.color === "emerald"
                      ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                      : "border-rose-500/60 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.15)]";
                    const textClass = t.color === "emerald" ? "text-emerald-300" : "text-rose-300";
                    const iconClass = t.color === "emerald" ? "text-emerald-400" : "text-rose-400";
                    return (
                      <label key={t.value} className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected
                          ? colorClass
                          : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className={`${isSelected ? iconClass : "text-slate-400"}`}>{t.icon}</div>
                          <input type="radio" name="maint_type" value={t.value}
                            checked={isSelected}
                            onChange={e => setForm({ ...form, type: e.target.value })}
                            className="accent-amber-500 w-4 h-4" />
                        </div>
                        <div>
                          <span className={`text-sm font-bold ${isSelected ? textClass : "text-slate-200"}`}>{t.label}</span>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{t.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status — Card Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Status Progres Pekerjaan <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {STATUS_OPTIONS.map(s => {
                    const isSelected = form.status === s.value;
                    return (
                      <button key={s.value} type="button"
                        onClick={() => setForm({ ...form, status: s.value })}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                          isSelected ? s.ring : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                        }`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                        <span className={`text-xs font-bold ${
                          isSelected
                            ? (s.color === "blue" ? "text-blue-300" : s.color === "amber" ? "text-amber-300" : s.color === "emerald" ? "text-emerald-300" : "text-slate-300")
                            : "text-slate-400"
                        }`}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 3: Tanggal & Catatan */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 border-b border-slate-800/90 pb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">3. Waktu & Instruksi Kerja</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tanggal jadwal tindakan dan catatan detail prosedur pekerjaan</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Tanggal Pelaksanaan Maintenance <span className="text-amber-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-400 transition-colors pointer-events-none">
                    <Calendar size={18} />
                  </div>
                  <input type="date" required value={form.scheduled_date}
                    onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                    className="w-full pl-11 pr-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Catatan Prosedur & Instruksi Kerja Teknisi
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-amber-400 transition-colors pointer-events-none">
                    <FileText size={18} />
                  </div>
                  <textarea rows={4} value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Contoh: Pembersihan debu fan chassis, pengecekan runtime baterai UPS NOC, verifikasi kabel Fiber Optic uplink, dan update firmware versi terbaru."
                    className="w-full pl-11 pr-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none transition-all leading-relaxed shadow-inner" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => navigate("/maintenance")}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={18} />
                {saving ? "Menyimpan Jadwal..." : (isEditing ? "Simpan Perubahan Maintenance" : "Simpan Jadwal Maintenance Baru")}
              </button>
            </div>

          </div>
        </div>

        {/* Right Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl sticky top-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Clock size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Preview Tiket Maintenance</h3>
            </div>

            <div className="glass rounded-2xl p-6 border border-amber-500/30 bg-slate-900/90 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_MAP[form.status]?.cls}`}>
                  {STATUS_MAP[form.status]?.label}
                </span>
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                  form.type === "preventive"
                    ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                    : "text-rose-300 bg-rose-500/10 border-rose-500/30"
                }`}>
                  {form.type === "preventive" ? "Preventif" : "Korektif"}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-100 text-lg leading-snug">
                  {selectedDevice ? selectedDevice.name : "Target Perangkat Belum Dipilih"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {selectedDevice ? `IP: ${selectedDevice.ip_address || "No IP"} | Type: ${selectedDevice.type}` : "Pilih perangkat dari dropdown di sebelah kiri"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed min-h-[70px]">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Catatan Instruksi Kerja:</p>
                {form.notes || "Instruksi kerja perbaikan akan tampil di sini..."}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Tanggal Rencana:</span>
                <span className="font-bold text-slate-100">{form.scheduled_date || "Belum diatur"}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={15} />
                SLA & Peringatan Otomatis:
              </p>
              <p className="text-slate-400">
                Sistem akan memicu peringatan jika tanggal maintenance telah terlampaui (Overdue) dan belum ditandai Selesai oleh teknisi.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
