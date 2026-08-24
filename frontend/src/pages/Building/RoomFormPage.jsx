import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { DoorOpen, ArrowLeft, Save, Layers } from "lucide-react";
import toast from "react-hot-toast";

const ROOM_TYPES = ["server_room", "office", "classroom", "lab", "storage", "other"];

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
      toast.error("Pilih lantai lokasi ruangan.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await buildingService.createRoom(form.floor_id, { name: form.name, type: form.type });
      toast.success("Ruangan baru berhasil ditambahkan!");
      navigate(`/buildings/${buildingId}`);
    } catch (err) {
      setError(err.response?.data?.message ?? "Gagal menambahkan ruangan.");
      toast.error("Gagal menambahkan ruangan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Memuat formulir ruangan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Gedung", href: "/buildings" },
        { label: building?.name || "Detail Gedung", href: `/buildings/${buildingId}` },
        { label: "Tambah Ruangan Baru" }
      ]} />

      <div className="flex items-center justify-between flex-wrap gap-4 glass p-6 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/buildings/${buildingId}`)}
            className="w-11 h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all shadow-md">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100">
              Penambahan Ruangan Baru: {building?.name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Daftarkan unit ruangan spasial untuk penempatan rack server & fasilitas infrastruktur
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

      <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800/90 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <DoorOpen size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">Spesifikasi Ruangan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pilih lantai lokasi, nama ruangan, dan tipe peruntukan ruangan</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Lantai Lokasi Ruangan <span className="text-blue-400">*</span>
          </label>
          <select required value={form.floor_id} onChange={e => setForm({ ...form, floor_id: e.target.value })}
            className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all">
            <option value="">-- Pilih Lantai --</option>
            {building?.floors?.map(f => (
              <option key={f.id} value={f.id}>{f.name} (Lantai {f.floor_number})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Nama Ruangan <span className="text-blue-400">*</span>
          </label>
          <input type="text" required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: NOC Server Room Main Alpha"
            className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Tipe Peruntukan Ruangan <span className="text-blue-400">*</span>
          </label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
            className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all capitalize">
            {ROOM_TYPES.map(t => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-800">
          <button type="button" onClick={() => navigate(`/buildings/${buildingId}`)}
            className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
            Batal
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={18} />
            {saving ? "Menyimpan Ruangan..." : "Simpan Ruangan Baru"}
          </button>
        </div>
      </form>
    </div>
  );
}
