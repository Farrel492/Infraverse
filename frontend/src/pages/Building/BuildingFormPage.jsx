import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { Building2, ArrowLeft, Save, MapPin, Layers, FileText, CheckCircle2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function BuildingFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", location: "", total_floors: 1, description: "" });
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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Memuat data gedung...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Gedung", href: "/buildings" },
        { label: isEditing ? `Edit ${form.name || "Gedung"}` : "Tambah Gedung Baru" }
      ]} />

      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 glass p-6 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/buildings")}
            className="w-11 h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all shadow-md">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100">
              {isEditing ? `Edit Konfigurasi Gedung: ${form.name}` : "Pendaftaran Fasilitas Gedung Baru"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Konfigurasikan batas spasial gedung untuk integrasi Digital Twin & pemetaan lantai NOC
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm font-semibold text-red-400 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
          {error}
        </div>
      )}

      {/* Form & Live Preview Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800/90 pb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">Informasi Spasial Gedung</h3>
                <p className="text-xs text-slate-400 mt-0.5">Isi rincian nama, zona kampus, dan kapasitas lantai fisik</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Nama Gedung / Fasilitas <span className="text-blue-400">*</span>
              </label>
              <input type="text" required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Gedung Rektorat (Pusat Data Utama NOC)"
                className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:font-normal shadow-inner" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Lokasi / Zona Kampus
                </label>
                <div className="relative">
                  <input type="text" value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="Kampus Utama - Zona A"
                    className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Jumlah Lantai Fisik <span className="text-blue-400">*</span>
                </label>
                <input type="number" min={1} required value={form.total_floors}
                  onChange={e => setForm({ ...form, total_floors: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Deskripsi Peran & Fungsi Infrastruktur
              </label>
              <textarea rows={4} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Jelaskan peran gedung ini, contoh: Menampung NOC Utama, Server Farm, Router BGP Core, dan Sistem UPS Cadangan Kampus."
                className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 resize-none transition-all leading-relaxed" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => navigate("/buildings")}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={18} />
                {saving ? "Menyimpan Data..." : (isEditing ? "Simpan Perubahan Gedung" : "Daftarkan Gedung Baru")}
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Preview Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl sticky top-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Live Preview Kartu Gedung</h3>
            </div>

            {/* Visual Card Mockup */}
            <div className="glass rounded-2xl p-6 border border-blue-500/40 bg-slate-900/90 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Building2 size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Prinjinjau
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-100 text-lg">
                  {form.name || "Nama Gedung Akan Muncul Di Sini"}
                </h4>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1.5 font-medium">
                  <MapPin size={14} className="text-indigo-400" />
                  <span>{form.location || "Kampus Utama"}</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed min-h-[60px]">
                {form.description || "Deskripsi fungsi fasilitas gedung akan tampil di sini secara terstruktur..."}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-indigo-400" />
                  <span className="font-bold text-slate-200">{form.total_floors || 1} Lantai Fisik</span>
                </div>
                <span className="text-blue-400 font-bold">Terintegrasi Digital Twin</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300 space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                Petunjuk Sistem:
              </p>
              <p className="text-slate-400">
                Setelah gedung disimpan, Anda dapat masuk ke tampilan Inspeksi Gedung untuk menambahkan lantai, ruangan server, dan rack 42U.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
