import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { 
  Building2, ArrowLeft, Save, MapPin, Layers, FileText, 
  CheckCircle2, ShieldCheck, Sparkles, Compass, AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function BuildingFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ 
    name: "", 
    location: "", 
    total_floors: 1, 
    description: "" 
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditing) {
      buildingService.getOne(id)
        .then(res => {
          const b = res.data;
          setForm({
            name: b.name ?? "",
            location: b.location ?? "",
            total_floors: b.total_floors ?? 1,
            description: b.description ?? "",
          });
        })
        .catch(() => {
          toast.error("Gagal memuat data gedung.");
          navigate("/buildings");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (isEditing) {
        await buildingService.update(id, fd);
        toast.success("Konfigurasi gedung berhasil diperbarui!");
      } else {
        await buildingService.create(fd);
        toast.success("Gedung baru berhasil didaftarkan!");
      }
      navigate("/buildings");
    } catch (err) {
      setError(err.response?.data?.message ?? "Terjadi kesalahan saat menyimpan data gedung.");
      toast.error("Gagal menyimpan data gedung.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-blue-500/20" />
          <p className="text-base font-semibold text-slate-300">Memuat konfigurasi gedung...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Manajemen Gedung", href: "/buildings" },
        { label: isEditing ? `Edit ${form.name || "Gedung"}` : "Pendaftaran Gedung Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate("/buildings")}
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg hover:shadow-slate-800/50"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {isEditing ? "Mode Edit Gedung" : "Entitas Fasilitas Baru"}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">Infrastruktur Spasial Smart Campus</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                {isEditing ? `Edit Konfigurasi: ${form.name}` : "Pendaftaran Gedung & Fasilitas Baru"}
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Tentukan identitas fisik gedung untuk pemetaan Digital Twin 3D, manajemen lantai bertingkat, dan pengelompokan rack server NOC.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/buildings")}
              className="px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all"
            >
              Kembali ke Daftar
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

      {/* Main Grid: Form Inputs & Live Holographic Preview */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Identitas Gedung */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Identitas & Wilayah Fasilitas</h2>
                <p className="text-xs text-slate-400 mt-0.5">Rincian nama gedung dan area zona spasial kampus</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                  Nama Gedung / Fasilitas <span className="text-blue-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Gedung Rektorat (Pusat Data Utama NOC)"
                    className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:font-normal shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Gunakan nama resmi yang mudah diidentifikasi oleh tim lapangan & teknisi NOC.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Lokasi / Zona Kampus
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      placeholder="Contoh: Kampus Utama - Zona Barat"
                      className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Total Lantai Fisik <span className="text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={form.total_floors}
                      onChange={e => setForm({ ...form, total_floors: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Deskripsi & Fungsi Infrastruktur */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Peran & Fungsi Infrastruktur</h2>
                <p className="text-xs text-slate-400 mt-0.5">Catatan operasional untuk tim pemeliharaan dan audit sistem</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                Deskripsi Operasional Gedung
              </label>
              <textarea
                rows={5}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Jelaskan peran gedung ini, contoh: Gedung pusat administrasi dan data center rektorat. Berisi server core switch, koneksi fiber optik uplink kampus, serta backup UPS 40kVA."
                className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all leading-relaxed shadow-inner"
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigate("/buildings")}
                className="w-full sm:w-1/3 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-all shadow-md"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
              >
                <Save size={20} />
                <span>{saving ? "Menyimpan Perubahan..." : (isEditing ? "Simpan Perubahan Gedung" : "Daftarkan Gedung Baru")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Architectural Preview Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={20} className="text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Live Preview Kartu Gedung</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Pratinjau Nyata
              </span>
            </div>

            {/* Realistic Preview Card */}
            <div className="glass rounded-3xl p-7 border border-blue-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg">
                  <Building2 size={28} />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  {form.total_floors || 1} Lantai Fisik
                </span>
              </div>

              <div className="relative z-10">
                <h4 className="font-black text-slate-100 text-xl tracking-tight leading-snug">
                  {form.name || "Nama Gedung Akan Ditampilkan Di Sini"}
                </h4>
                <div className="flex items-center gap-2 text-slate-400 text-xs mt-2 font-medium">
                  <MapPin size={15} className="text-indigo-400 flex-shrink-0" />
                  <span>{form.location || "Kampus Utama - Zona Belum Dipilih"}</span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed min-h-[75px] shadow-inner relative z-10">
                {form.description || "Deskripsi operasional infrastruktur dan fasilitas gedung akan tersusun rapi di sini..."}
              </div>

              {/* Floor Layers Stack Visualizer */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers size={13} className="text-indigo-400" />
                  Struktur Spasial Lantai:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: Math.min(Number(form.total_floors) || 1, 6) }).map((_, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300 shadow-sm"
                    >
                      Lantai {i + 1}
                    </span>
                  ))}
                  {(Number(form.total_floors) || 1) > 6 && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono text-slate-500">
                      +{(Number(form.total_floors) || 1) - 6} lainnya
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs relative z-10">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Siap Integrasi Twin
                </span>
                <span className="text-blue-400 font-bold">NOC Telemetri Aktif</span>
              </div>
            </div>

            {/* Operational Guidance Callout */}
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-2 leading-relaxed shadow-lg">
              <p className="font-bold text-blue-300 flex items-center gap-2">
                <Compass size={16} />
                Langkah Berikutnya Setelah Disimpan:
              </p>
              <p className="text-slate-300">
                Buka menu <strong>Inspeksi Gedung</strong> untuk menambahkan daftar lantai, mendaftarkan ruangan server NOC, serta menempatkan unit rack 42U dan perangkat hardware.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
