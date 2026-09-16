import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { DoorOpen, ArrowLeft, Save, Layers, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const ROOM_TYPES = [
  { value: "server_room", label: "Ruang Server / Data Center NOC", desc: "Khusus penempatan rack cabinet 42U dan perangkat backbone" },
  { value: "office", label: "Ruang Kantor Staf IT", desc: "Area kerja personil teknisi & network administrator" },
  { value: "classroom", label: "Ruang Kelas / Pelatihan", desc: "Area laboratorium komputer instruksi" },
  { value: "lab", label: "Laboratorium Jaringan & IoT", desc: "Fasilitas riset hardware & switch workbench" },
  { value: "storage", label: "Gudang Sparepart & Kabel", desc: "Penyimpanan cadangan modul SFP, kabel FO, dan patch cord" },
  { value: "other", label: "Fasilitas Lainnya", desc: "Ruangan utilitas umum lainnya" },
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

    setSaving(true);
    setError("");

    try {
      await buildingService.createRoom(form.floor_id, {
        name: form.name,
        type: form.type,
        floor_id: parseInt(form.floor_id),
      });
      toast.success("Ruangan baru berhasil ditambahkan!");
      navigate(`/buildings/${buildingId}`);
    } catch (err) {
      const msg = err.response?.data?.message ?? "Gagal menambahkan ruangan.";
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
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-blue-500/20" />
          <p className="text-base font-semibold text-slate-300">Memuat formulir ruangan...</p>
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
        { label: "Tambah Ruangan Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
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
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Unit Ruangan Spasial
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">{building?.name}</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-200 to-white mt-2">
                Pendaftaran Ruangan Baru
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Daftarkan ruangan server atau utilitas jaringan pada lantai gedung untuk penempatan rack cabinet 42U.
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
            <DoorOpen size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Spesifikasi Unit Ruangan</h2>
            <p className="text-xs text-slate-400 mt-0.5">Pilih lantai lokasi, nama ruangan, dan tipe peruntukan ruangan</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
              Lantai Lokasi Penempatan <span className="text-blue-400">*</span>
            </label>
            <select 
              required 
              value={form.floor_id} 
              onChange={e => setForm({ ...form, floor_id: e.target.value })}
              className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            >
              <option value="">-- Pilih Lantai Penempatan --</option>
              {building?.floors?.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} (Tingkat Lantai {f.floor_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
              Nama Ruangan <span className="text-blue-400">*</span>
            </label>
            <input 
              type="text" 
              required 
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: NOC Server Room Main Alpha"
              className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Tipe Peruntukan Ruangan <span className="text-blue-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {ROOM_TYPES.map(t => (
                <label 
                  key={t.value}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    form.type === t.value
                      ? "bg-emerald-500/10 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-bold ${form.type === t.value ? "text-emerald-300" : "text-slate-200"}`}>
                      {t.label}
                    </span>
                    <input 
                      type="radio" 
                      name="room_type" 
                      value={t.value}
                      checked={form.type === t.value}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      className="accent-emerald-500 w-4 h-4"
                    />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                </label>
              ))}
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
            <span>{saving ? "Menyimpan Ruangan..." : "Simpan & Daftarkan Ruangan Baru"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
