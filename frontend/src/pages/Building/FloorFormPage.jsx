import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { 
  Layers, ArrowLeft, Save, Building2, CheckCircle2, 
  AlertCircle, Sparkles, Compass, Hash, FileText
} from "lucide-react";
import toast from "react-hot-toast";

const FLOOR_PRESETS = [
  "Lantai Dasar (Basement NOC)",
  "Lantai 1 - Server Farm & Cloud",
  "Lantai 2 - Pusat Kontrol Jaringan",
  "Lantai 3 - Data Center & Core Sw.",
  "Lantai Rooftop - Antena & Wireless",
];

export default function FloorFormPage() {
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ 
    name: "", 
    floor_number: 1,
    description: "",
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
    if (!form.name.trim()) {
      toast.error("Label atau nama lantai wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await buildingService.createFloor(buildingId, {
        name: form.name.trim(),
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
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-indigo-500/20" />
          <p className="text-base font-semibold text-slate-300">Memuat formulir struktur lantai...</p>
        </div>
      </div>
    );
  }

  const existingFloors = building?.floors || [];
  const maxFloorNum = Math.max(form.floor_number, ...existingFloors.map(f => f.floor_number || 1));

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Gedung", href: "/buildings" },
        { label: building?.name || "Detail Gedung", href: `/buildings/${buildingId}` },
        { label: "Tambah Lantai Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate(`/buildings/${buildingId}`)}
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg hover:shadow-slate-800/50 cursor-pointer"
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
                Pendaftaran Tingkat Lantai Baru
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Tambahkan lantai ke dalam fasilitas {building?.name} untuk pengelompokkan ruangan server NOC dan visualisasi Digital Twin 3D bertingkat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/buildings/${buildingId}`)}
              className="px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
            >
              Kembali ke Gedung
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

      {/* Main Grid: Form (7 cols) & Live Architectural Stack (5 cols) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <Layers size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Parameter Tingkat Lantai</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tentukan label identitas lantai fisik dan nomor urutan tingkat</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Floor Label Name */}
              <div>
                <label className="form-label">
                  <span>Nama / Label Lantai <span className="text-blue-400">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">Wajib Diisi</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box">
                    <Layers size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Lantai 2 — Pusat Komputasi & Server Farm"
                    className="input-control"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-400">Template Cepat:</span>
                  {FLOOR_PRESETS.map(tpl => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setForm({ ...form, name: tpl })}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-slate-200 hover:text-indigo-300 border border-slate-700/80 transition-all cursor-pointer shadow-sm"
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Floor Number Stepper & Target Building info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">
                    <span>Nomor Tingkat Lantai <span className="text-blue-400">*</span></span>
                    <span className="text-[11px] font-bold text-indigo-400">Tingkat {form.floor_number}</span>
                  </label>
                  <div className="flex items-center h-13 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 transition-all shadow-inner p-1">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, floor_number: Math.max(1, Number(f.floor_number) - 1) }))}
                      className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black flex items-center justify-center text-lg transition-colors flex-shrink-0 cursor-pointer"
                    >
                      −
                    </button>
                    <div className="flex-1 flex items-center justify-center gap-2">
                      <Hash size={18} className="text-indigo-400" />
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={form.floor_number}
                        onChange={e => setForm({ ...form, floor_number: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-14 text-center font-mono text-base font-black bg-transparent text-slate-100 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400">Tingkat</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, floor_number: Math.min(100, Number(f.floor_number) + 1) }))}
                      className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black flex items-center justify-center text-lg transition-colors flex-shrink-0 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-center space-y-1.5 shadow-inner">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Building2 size={16} className="text-indigo-400" />
                    Fasilitas Gedung Induk:
                  </span>
                  <p className="text-sm font-extrabold text-slate-100 truncate">{building?.name}</p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Total: {existingFloors.length} lantai terdaftar dari {building?.total_floors || 1} lantai rencana
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigate(`/buildings/${buildingId}`)}
                className="w-full sm:w-1/3 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all shadow-md cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-black shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Save size={18} />
                <span>{saving ? "Menyimpan Lantai..." : "Simpan & Daftarkan Lantai"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Architectural Floor Stack Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={20} className="text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Live Preview Struktur Spasial</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Visual Stack 3D
              </span>
            </div>

            {/* Realistic Floor Tower Representation */}
            <div className="glass rounded-3xl p-7 border border-indigo-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg">
                  <Layers size={28} />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  Tingkat Lantai {form.floor_number}
                </span>
              </div>

              <div className="relative z-10">
                <h4 className="font-black text-slate-100 text-xl tracking-tight leading-snug">
                  {form.name || "Nama / Label Lantai Akan Ditampilkan"}
                </h4>
                <div className="flex items-center gap-2 text-slate-400 text-xs mt-2 font-medium">
                  <Building2 size={15} className="text-blue-400 flex-shrink-0" />
                  <span>{building?.name || "Gedung Utama"}</span>
                </div>
              </div>

              {/* Simulated Vertical Floor Stack */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers size={13} className="text-indigo-400" />
                  Visualisasi Posisi Tingkat Gedung:
                </p>
                <div className="flex flex-col-reverse gap-1.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  {Array.from({ length: Math.min(maxFloorNum, 5) }).map((_, i) => {
                    const floorIdx = i + 1;
                    const isCurrent = floorIdx === Number(form.floor_number);
                    return (
                      <div
                        key={floorIdx}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                          isCurrent
                            ? "bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                            : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        <span className="font-mono">Tingkat {floorIdx}</span>
                        <span>{isCurrent ? (form.name || "Lantai Baru Ini") : `Lantai ${floorIdx}`}</span>
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs relative z-10">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Siap Pendaftaran Ruangan
                </span>
                <span className="text-indigo-400 font-bold">Topologi Bertingkat</span>
              </div>
            </div>

            {/* Guidance Callout */}
            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 space-y-2 leading-relaxed shadow-lg">
              <p className="font-bold text-indigo-300 flex items-center gap-2">
                <Compass size={16} />
                Langkah Operasional Berikutnya:
              </p>
              <p className="text-slate-300">
                Setelah lantai disimpan, Anda dapat mendaftarkan <strong>Ruangan Server NOC</strong> pada lantai ini, dan menempatkan rak kabinet hardware.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
