import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { maintenanceService } from "../../services/maintenanceService";
import { deviceService } from "../../services/deviceService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import {
  Wrench, ArrowLeft, Save, Calendar, Activity,
  CheckCircle2, Clock, Cpu, FileText,
  ShieldAlert, Zap, Sparkles, AlertCircle, Compass,
  CalendarDays, CheckSquare
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "scheduled",   label: "Terjadwal",   dot: "bg-blue-400",    borderActive: "border-blue-500/80 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]", textActive: "text-blue-300" },
  { value: "in_progress", label: "Berlangsung", dot: "bg-amber-400 animate-pulse", borderActive: "border-amber-500/80 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]", textActive: "text-amber-300" },
  { value: "completed",   label: "Selesai",     dot: "bg-emerald-400",  borderActive: "border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]", textActive: "text-emerald-300" },
  { value: "cancelled",   label: "Dibatalkan",  dot: "bg-slate-400",    borderActive: "border-slate-500/80 bg-slate-500/10 shadow-[0_0_15px_rgba(148,163,184,0.2)]", textActive: "text-slate-300" },
];

const TYPE_OPTIONS = [
  { 
    value: "preventive", 
    label: "Preventif (Rutin & Pencegahan)", 
    desc: "Pemeliharaan terjadwal berkala untuk mencegah degradasi hardware dan downtime.", 
    icon: ShieldAlert, 
    color: "emerald",
    borderActive: "border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    textActive: "text-emerald-300",
  },
  { 
    value: "corrective", 
    label: "Korektif (Perbaikan Insiden)", 
    desc: "Tindakan cepat teknisi untuk mengatasi malfungsi, modul rusak, atau anomali jaringan.", 
    icon: Zap, 
    color: "rose",
    borderActive: "border-rose-500/80 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.25)]",
    textActive: "text-rose-300",
  },
];

const PROCEDURE_TEMPLATES = [
  "Pembersihan debu chassis & audit sirkulasi pendingin rak 42U.",
  "Upgrade patch firmware keamanan & backup konfigurasi startup-config.",
  "Pengujian runtime baterai UPS & verifikasi failover suplai daya listrik.",
  "Pemeriksaan link Fiber Optic, loss transmisi dBm, dan port SFP+ transceiver.",
];

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
    if (!form.device_id) {
      toast.error("Silakan pilih target perangkat IT.");
      return;
    }
    if (!form.scheduled_date) {
      toast.error("Tanggal pelaksanaan maintenance wajib ditentukan.");
      return;
    }

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

  const setRelativeDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().substring(0, 10);
    setForm(f => ({ ...f, scheduled_date: dateStr }));
  };

  const selectedDevice = devices.find(d => String(d.id) === String(form.device_id));
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === form.status) || STATUS_OPTIONS[0];
  const selectedType = TYPE_OPTIONS.find(t => t.value === form.type) || TYPE_OPTIONS[0];
  const TypeIcon = selectedType.icon;

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-amber-500/20" />
          <p className="text-base font-semibold text-slate-300">Memuat formulir pemeliharaan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Maintenance", href: "/maintenance" },
        { label: isEditing ? "Edit Jadwal Perawatan" : "Buat Jadwal Maintenance Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate("/maintenance")}
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg hover:shadow-slate-800/50 cursor-pointer"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {isEditing ? "Mode Edit Jadwal" : "Work Order Perawatan Baru"}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">Manajemen SLA & Keandalan IT</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-200 to-white mt-2">
                {isEditing ? "Edit Jadwal Pemeliharaan Infrastruktur" : "Penjadwalan Maintenance Infrastruktur IT"}
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Atur instruksi kerja perawatan preventif rutin atau tindakan korektif darurat dan penugasan teknisi IT bersertifikasi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/maintenance")}
              className="px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
            >
              Kembali ke Jadwal
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm font-semibold text-red-400 flex items-center gap-3 shadow-lg">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form (7 cols) & Live SLA Ticket Preview (5 cols) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Target Perangkat IT */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Wrench size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">1. Target Perangkat Infrastruktur</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pilih hardware server atau switch yang akan dilakukan perawatan teknis</p>
              </div>
            </div>

            <div>
              <label className="form-label">
                <span>Perangkat Hardware IT <span className="text-amber-400">*</span></span>
                <span className="text-[11px] font-semibold text-slate-500">Wajib Dipilih</span>
              </label>
              <div className="input-group">
                <div className="input-icon-box text-amber-400">
                  <Cpu size={20} />
                </div>
                <select 
                  required 
                  value={form.device_id}
                  onChange={e => setForm({ ...form, device_id: e.target.value })}
                  className="select-control"
                >
                  <option value="">-- Pilih Perangkat Target --</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.type?.toUpperCase()}) — IP: {d.ip_address || "No IP"}
                    </option>
                  ))}
                </select>
              </div>
              {selectedDevice && (
                <div className="flex items-center gap-2 mt-2.5">
                  <CheckCircle2 size={14} className="text-amber-400" />
                  <span className="text-xs text-amber-400 font-semibold font-mono">
                    {selectedDevice.ip_address || "No IP"} · {selectedDevice.vendor || "Hardware"} {selectedDevice.model || ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Tipe & Status Maintenance */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
                <Activity size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">2. Karakteristik & Status Progres</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tentukan klasifikasi tindakan perawatan dan status pengerjaan teknisi</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="form-label">
                  <span>Klasifikasi Tindakan <span className="text-amber-400">*</span></span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TYPE_OPTIONS.map(t => {
                    const IconComp = t.icon;
                    const isSelected = form.type === t.value;
                    return (
                      <label 
                        key={t.value} 
                        onClick={() => setForm({ ...form, type: t.value })}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? t.borderActive
                            : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                              isSelected ? "bg-white/10 border-white/20 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
                            }`}>
                              <IconComp size={16} />
                            </div>
                            <span className={`text-sm font-bold ${isSelected ? t.textActive : "text-slate-200"}`}>
                              {t.label}
                            </span>
                          </div>
                          <input 
                            type="radio" 
                            name="maint_type" 
                            value={t.value}
                            checked={isSelected}
                            onChange={() => setForm({ ...form, type: t.value })}
                            className="accent-amber-500 w-4 h-4" 
                          />
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          {t.desc}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="form-label">
                  <span>Status Progres Kerja <span className="text-amber-400">*</span></span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STATUS_OPTIONS.map(s => {
                    const isSelected = form.status === s.value;
                    return (
                      <button 
                        key={s.value} 
                        type="button"
                        onClick={() => setForm({ ...form, status: s.value })}
                        className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                          isSelected ? s.borderActive : "bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                        <span className={`text-xs font-bold ${isSelected ? s.textActive : "text-slate-300"}`}>
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Waktu & Catatan Instruksi Kerja */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Calendar size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">3. Waktu Eksekusi & Instruksi Prosedur</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tanggal jadwal pelaksanaan dan detail instruksi SOP untuk teknisi</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Scheduled Date */}
              <div>
                <label className="form-label">
                  <span>Tanggal Pelaksanaan Maintenance <span className="text-amber-400">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">Batas Waktu SLA</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box text-amber-400">
                    <Calendar size={20} />
                  </div>
                  <input 
                    type="date" 
                    required 
                    value={form.scheduled_date}
                    onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                    className="input-control" 
                  />
                </div>

                {/* Quick Date Presets */}
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500">Pilihan Cepat:</span>
                  {[
                    { label: "Hari Ini", days: 0 },
                    { label: "Besok", days: 1 },
                    { label: "+3 Hari", days: 3 },
                    { label: "+1 Minggu", days: 7 },
                    { label: "+1 Bulan", days: 30 },
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setRelativeDate(p.days)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 transition-colors cursor-pointer"
                    >
                      📅 {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Order Notes & Checklist Templates */}
              <div>
                <label className="form-label">
                  <span>Instruksi Kerja & Catatan SOP Teknisi</span>
                </label>

                {/* Templates */}
                <div className="mb-2.5 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 block">Template Prosedur Cepat:</span>
                  <div className="flex flex-col gap-1.5">
                    {PROCEDURE_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, notes: f.notes ? `${f.notes}\n- ${tmpl}` : `- ${tmpl}` }))}
                        className="text-left text-xs px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <CheckSquare size={13} className="text-amber-400 flex-shrink-0" />
                        <span className="truncate">{tmpl}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/15 transition-all shadow-inner">
                  <div className="px-4 py-3.5 bg-slate-800/60 border-r border-slate-700/60 text-amber-400 flex items-start flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <textarea 
                    rows={4} 
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Tuliskan instruksi langkah perawatan atau klik template di atas..."
                    className="w-full p-3.5 text-sm font-medium bg-transparent text-slate-100 outline-none placeholder:text-slate-500 resize-none leading-relaxed" 
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => navigate("/maintenance")}
                className="w-full sm:w-1/3 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all shadow-md cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={saving || !form.device_id || !form.scheduled_date}
                className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-black shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Save size={18} />
                <span>{saving ? "Menyimpan Jadwal..." : (isEditing ? "Simpan Perubahan Jadwal" : "Daftarkan Jadwal Maintenance")}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Live SLA Work Order Ticket Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Preview Tiket Work Order</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase border ${selectedStatus.textActive} bg-slate-900 border-slate-700`}>
                {selectedStatus.label}
              </span>
            </div>

            {/* SLA Ticket Mockup */}
            <div className="glass rounded-3xl p-7 border border-amber-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                  <Wrench size={28} />
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                    form.type === "preventive"
                      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                      : "text-rose-300 bg-rose-500/10 border-rose-500/30"
                  }`}>
                    {form.type === "preventive" ? "Preventif" : "Korektif"}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">SLA Tier 1</p>
                </div>
              </div>

              <div className="relative z-10">
                <h4 className="font-extrabold text-slate-100 text-lg leading-snug">
                  {selectedDevice ? selectedDevice.name : "Target Perangkat Hardware"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {selectedDevice ? `IP: ${selectedDevice.ip_address || "No IP"} · Tipe: ${selectedDevice.type?.toUpperCase()}` : "Pilih perangkat dari dropdown di sebelah kiri"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 leading-relaxed shadow-inner relative z-10 space-y-2">
                <p className="text-[10px] text-amber-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                  <CheckSquare size={13} /> Catatan Instruksi Kerja:
                </p>
                <div className="text-slate-300 font-medium whitespace-pre-line min-h-[60px]">
                  {form.notes || "Instruksi kerja perbaikan atau SOP pemeliharaan akan tampil di sini..."}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs relative z-10">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-amber-400" /> Tanggal Rencana:
                </span>
                <span className="font-mono font-bold text-slate-100">
                  {form.scheduled_date || "Belum Ditentukan"}
                </span>
              </div>
            </div>

            {/* Guidance Callout */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2 leading-relaxed shadow-lg">
              <p className="font-bold flex items-center gap-1.5 text-amber-300">
                <Compass size={16} /> SLA & Peringatan Otomatis:
              </p>
              <p className="text-slate-300">
                Sistem InfraVerse akan memicu notifikasi peringatan jika tanggal maintenance telah terlampaui (Overdue) dan belum ditandai Selesai oleh teknisi IT.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
