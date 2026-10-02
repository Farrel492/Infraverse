import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { 
  DoorOpen, ArrowLeft, Save, Layers, AlertCircle, 
  CheckCircle2, Sparkles, Server, Compass, Building2,
  Briefcase, GraduationCap, Cpu, Package, Layout
} from "lucide-react";
import toast from "react-hot-toast";

const ROOM_TYPES = [
  { 
    value: "server_room", 
    label: "Ruang Server / Data Center NOC", 
    desc: "Khusus penempatan rack cabinet 42U dan perangkat backbone jaringan.", 
    icon: Server,
    color: "blue",
    borderActive: "border-blue-500/80 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.25)]",
    textActive: "text-blue-300",
    badge: "Misi Kritis"
  },
  { 
    value: "office", 
    label: "Ruang Kantor Staf IT", 
    desc: "Area kerja personil teknisi lapangan & administrator infrastruktur.", 
    icon: Briefcase,
    color: "indigo",
    borderActive: "border-indigo-500/80 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.25)]",
    textActive: "text-indigo-300",
    badge: "Personil"
  },
  { 
    value: "classroom", 
    label: "Ruang Kelas / Pelatihan", 
    desc: "Area instruksi komputer, workshop, dan pelatihan sertifikasi IT.", 
    icon: GraduationCap,
    color: "violet",
    borderActive: "border-violet-500/80 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.25)]",
    textActive: "text-violet-300",
    badge: "Edukasi"
  },
  { 
    value: "lab", 
    label: "Laboratorium Jaringan & IoT", 
    desc: "Fasilitas workbench perakitan hardware, testing switch, dan sensor cerdas.", 
    icon: Cpu,
    color: "emerald",
    borderActive: "border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    textActive: "text-emerald-300",
    badge: "Laboratorium"
  },
  { 
    value: "storage", 
    label: "Gudang Sparepart & Kabel", 
    desc: "Penyimpanan modul SFP, kabel FO, patch cord, dan suku cadang cadangan.", 
    icon: Package,
    color: "amber",
    borderActive: "border-amber-500/80 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    textActive: "text-amber-300",
    badge: "Inventaris"
  },
  { 
    value: "other", 
    label: "Fasilitas Lainnya", 
    desc: "Ruangan utilitas umum gedung, panel daya listrik, atau genset cadangan.", 
    icon: Layout,
    color: "slate",
    borderActive: "border-slate-500/80 bg-slate-500/10 shadow-[0_0_20px_rgba(148,163,184,0.25)]",
    textActive: "text-slate-300",
    badge: "Utilitas"
  },
];

const ROOM_TEMPLATES = [
  "NOC Server Room Main Alpha",
  "Data Center Core Rack Area",
  "Lab Jaringan & Cloud Computing",
  "Ruang Kendali & Dispatch IT",
  "Ruang Distribusi Kabel IDF Lt.",
];

export default function RoomFormPage() {
  const { id: buildingId } = useParams();
  const [searchParams] = useSearchParams();
  const floorIdQuery = searchParams.get("floor_id");
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    floor_id: floorIdQuery ?? "",
    name: "",
    type: "server_room",
  });

  useEffect(() => {
    buildingService.getOne(buildingId)
      .then(res => {
        setBuilding(res.data);
        if (!floorIdQuery && res.data.floors?.length > 0) {
          setForm(f => ({ ...f, floor_id: res.data.floors[0].id }));
        }
      })
      .catch(() => toast.error("Gagal memuat data gedung."))
      .finally(() => setLoading(false));
  }, [buildingId, floorIdQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.floor_id) {
      toast.error("Silakan pilih lantai penempatan ruangan.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Nama ruangan wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await buildingService.createRoom(form.floor_id, {
        name: form.name.trim(),
        type: form.type,
        floor_id: parseInt(form.floor_id),
      });
      toast.success("Ruangan baru berhasil didaftarkan!");
      navigate(`/buildings/${buildingId}`);
    } catch (err) {
      const msg = err.response?.data?.message ?? "Gagal menambahkan ruangan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedType = ROOM_TYPES.find(t => t.value === form.type) || ROOM_TYPES[0];
  const selectedFloor = building?.floors?.find(f => String(f.id) === String(form.floor_id));
  const TypeIcon = selectedType.icon;

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-blue-500/20" />
          <p className="text-base font-semibold text-slate-300">Memuat formulir ruangan spasial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Gedung", href: "/buildings" },
        { label: building?.name || "Detail Gedung", href: `/buildings/${buildingId}` },
        { label: "Tambah Ruangan Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
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
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Unit Ruangan Spasial
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">{building?.name}</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                Pendaftaran Ruangan Baru
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Tentukan ruangan operasional server atau utilitas pada lantai gedung untuk penempatan unit rack cabinet 42U dan pemetaan Digital Twin.
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

      {/* Main Grid: Form Inputs (7 Cols) & Live Architectural Preview (5 Cols) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Lokasi Lantai & Nama Ruangan */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <DoorOpen size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Lokasi Spasial Ruangan</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tentukan lantai gedung dan nama identifikasi unit ruangan</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Floor Selection */}
              <div>
                <label className="form-label">
                  <span>Lantai Penempatan <span className="text-blue-400">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">Wajib Dipilih</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box">
                    <Layers size={20} />
                  </div>
                  <select
                    required
                    value={form.floor_id}
                    onChange={e => setForm({ ...form, floor_id: e.target.value })}
                    className="select-control"
                  >
                    <option value="">-- Pilih Lantai Gedung --</option>
                    {building?.floors?.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} (Tingkat Lantai {f.floor_number})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedFloor && (
                  <div className="flex items-center gap-2 mt-2.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-semibold">
                      Terpilih: Tingkat {selectedFloor.floor_number} — {selectedFloor.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Room Name */}
              <div>
                <label className="form-label">
                  <span>Nama / Label Ruangan <span className="text-blue-400">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">Identifikasi Unik</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box">
                    <DoorOpen size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: NOC Server Room Main Alpha"
                    className="input-control"
                  />
                </div>

                {/* Quick Name Presets */}
                <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-400">Template Cepat:</span>
                  {ROOM_TEMPLATES.map(tpl => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setForm({ ...form, name: tpl })}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-slate-200 hover:text-emerald-300 border border-slate-700/80 transition-all cursor-pointer shadow-sm"
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tipe Peruntukan Ruangan */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <Layout size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Klasifikasi Peruntukan Ruangan</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pilih peran operasional untuk standarisasi tata kelola rack dan pendingin</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {ROOM_TYPES.map(t => {
                const IconComp = t.icon;
                const isSelected = form.type === t.value;
                return (
                  <label
                    key={t.value}
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`p-5 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between gap-3.5 shadow-md ${
                      isSelected
                        ? t.borderActive
                        : "bg-slate-900/80 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm ${
                          isSelected ? "bg-white/15 border-white/30 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}>
                          <IconComp size={20} />
                        </div>
                        <div>
                          <p className={`text-sm font-black ${isSelected ? t.textActive : "text-slate-100"}`}>
                            {t.label}
                          </p>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md mt-1 inline-block ${
                            isSelected ? "bg-white/15 text-white" : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}>
                            {t.badge}
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="room_type"
                        value={t.value}
                        checked={isSelected}
                        onChange={() => setForm({ ...form, type: t.value })}
                        className="accent-blue-500 w-4 h-4 mt-1"
                      />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {t.desc}
                    </p>
                  </label>
                );
              })}
            </div>

            {/* Quick Action Buttons */}
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
                <span>{saving ? "Menyimpan Ruangan..." : "Simpan & Daftarkan Ruangan"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Architectural Room Preview Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={20} className="text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Live Preview Ruangan</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Pratinjau Nyata
              </span>
            </div>

            {/* Realistic Room Preview Card */}
            <div className="glass rounded-3xl p-7 border border-emerald-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
                  <TypeIcon size={28} />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  {selectedType.badge}
                </span>
              </div>

              <div className="relative z-10">
                <h4 className="font-black text-slate-100 text-xl tracking-tight leading-snug">
                  {form.name || "Nama Ruangan Akan Muncul Di Sini"}
                </h4>
                <div className="flex items-center gap-2 text-slate-400 text-xs mt-2 font-medium">
                  <Building2 size={15} className="text-blue-400 flex-shrink-0" />
                  <span>{building?.name || "Gedung Utama"}</span>
                  <span className="text-slate-600">•</span>
                  <Layers size={14} className="text-indigo-400 flex-shrink-0" />
                  <span>{selectedFloor ? selectedFloor.name : "Lantai Belum Dipilih"}</span>
                </div>
              </div>

              {/* Room Characteristics Summary */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed shadow-inner relative z-10 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Klasifikasi:</span>
                  <span className="font-bold text-slate-200">{selectedType.label}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tingkat Lantai:</span>
                  <span className="font-mono font-bold text-blue-400">
                    {selectedFloor ? `Lantai ${selectedFloor.floor_number}` : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Dukungan Rack 42U:</span>
                  <span className="font-bold text-emerald-400">Tersedia</span>
                </div>
              </div>

              {/* Visual Rack Bays Slot Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Server size={13} className="text-emerald-400" />
                  Slot Penempatan Rack Cabinet:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(slot => (
                    <div
                      key={slot}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-center gap-1 shadow-sm"
                    >
                      <Server size={14} className="text-slate-600" />
                      <span className="text-[10px] font-mono text-slate-500 font-bold">Bay #{slot}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs relative z-10">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Siap Integrasi Spasial
                </span>
                <span className="text-blue-400 font-bold">Digital Twin 3D Ready</span>
              </div>
            </div>

            {/* Operational Guidance Callout */}
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 space-y-2 leading-relaxed shadow-lg">
              <p className="font-bold text-emerald-300 flex items-center gap-2">
                <Compass size={16} />
                Langkah Berikutnya:
              </p>
              <p className="text-slate-300">
                Setelah ruangan disimpan, buka halaman inspeksi gedung untuk mendaftarkan <strong>Rack Cabinet 42U</strong> baru dan mengalokasikan unit server atau switch ke dalam ruangan ini.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
