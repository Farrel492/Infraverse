import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { Layers, ArrowLeft, Save, Building2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function FloorFormPage() {
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ 
    name: "", 
    floor_number: 1 
  });

  useEffect(() => {
    buildingService.getOne(buildingId)
      .then(res => {
        setBuilding(res.data);
        const existingFloorsCount = res.data.floors?.length ?? 0;
        setForm(f => ({ ...f, floor_number: existingFloorsCount + 1 }));
      })
      .catch(() => toast.error("Gagal memuat data gedung."))
      .finally(() => setLoading(false));
  }, [buildingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await buildingService.createFloor(buildingId, {
        name: form.name,
        floor_number: parseInt(form.floor_number),
        building_id: parseInt(buildingId),
      });
      toast.success("Lantai baru berhasil ditambahkan!");
      navigate(`/buildings/${buildingId}`);
    } catch (err) {
      const msg = err.response?.data?.message ?? "Gagal menambahkan lantai.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-base font-semibold text-slate-300">Memuat formulir lantai...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Gedung", href: "/buildings" },
        { label: building?.name || "Detail Gedung", href: `/buildings/${buildingId}` },
        { label: "Tambah Lantai Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate(`/buildings/${buildingId}`)}
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Struktur Spasial Bertingkat
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">{building?.name}</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                Pendaftaran Lantai Baru
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Tambahkan lantai ke dalam fasilitas {building?.name} untuk mengelompokkan ruangan server NOC dan rack cabinet.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm font-semibold text-red-400 flex items-center gap-3 shadow-lg">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="glass p-8 lg:p-10 rounded-3xl border border-slate-700/60 space-y-8 shadow-2xl">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shadow-inner">
            <Layers size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Parameter Tingkat Lantai</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tentukan label identifikasi dan nomor urutan lantai fisik</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
              Nama / Label Lantai <span className="text-blue-400">*</span>
            </label>
            <input 
              type="text" 
              required 
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Lantai 2 — Pusat Komputasi & Ruang NOC Server"
              className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
            />
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Contoh penamaan: "Lantai Dasar (Basement NOC)", "Lantai 1 - Server Farm".</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                Nomor Urut Tingkat Lantai <span className="text-blue-400">*</span>
              </label>
              <input 
                type="number" 
                required 
                value={form.floor_number}
                onChange={e => setForm({ ...form, floor_number: e.target.value })}
                className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
              />
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-center text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Gedung Target:
              </span>
              <p className="text-slate-200 font-semibold">{building?.name} ({building?.total_floors} Lantai Terjadwal)</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-800">
          <button 
            type="button" 
            onClick={() => navigate(`/buildings/${buildingId}`)}
            className="w-full sm:w-1/3 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-all"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
          >
            <Save size={20} />
            <span>{saving ? "Menyimpan Lantai..." : "Simpan & Daftarkan Lantai Baru"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
