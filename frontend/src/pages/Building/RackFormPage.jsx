import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { Server, ArrowLeft, Save, DoorOpen } from "lucide-react";
import toast from "react-hot-toast";

export default function RackFormPage() {
  const { id: buildingId } = useParams();
  const [searchParams] = useSearchParams();
  const roomIdQuery = searchParams.get("room_id");
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    room_id: roomIdQuery ?? "",
    name: "",
    position: "",
    total_u: 42,
  });

  useEffect(() => {
    buildingService.getOne(buildingId)
      .then(res => {
        setBuilding(res.data);
        if (!roomIdQuery) {
          const firstRoom = res.data.floors?.flatMap(f => f.rooms ?? [])[0];
          if (firstRoom) setForm(f => ({ ...f, room_id: firstRoom.id }));
        }
      })
      .catch(() => toast.error("Gagal memuat data gedung."))
      .finally(() => setLoading(false));
  }, [buildingId, roomIdQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.room_id) {
      toast.error("Pilih ruangan lokasi rack.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await buildingService.createRack(form.room_id, {
        name: form.name,
        position: form.position,
        total_u: form.total_u,
      });
      toast.success("Rack Cabinet 42U baru berhasil ditambahkan!");
      navigate(`/buildings/${buildingId}`);
    } catch (err) {
      setError(err.response?.data?.message ?? "Gagal menambahkan rack.");
      toast.error("Gagal menambahkan rack.");
    } finally {
      setSaving(false);
    }
  };

  const allRooms = building?.floors?.flatMap(f =>
    (f.rooms ?? []).map(r => ({ ...r, floor_name: f.name }))
  ) ?? [];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Memuat formulir rack server...</p>
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
        { label: "Tambah Rack Server Baru" }
      ]} />

      <div className="flex items-center justify-between flex-wrap gap-4 glass p-6 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/buildings/${buildingId}`)}
            className="w-11 h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all shadow-md">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100">
              Penambahan Rack Server Cabinet: {building?.name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Daftarkan unit rack cabinet fisik untuk pemetaan slot U unit server
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
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            <Server size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">Spesifikasi Rack Cabinet</h3>
            <p className="text-xs text-slate-400 mt-0.5">Atur lokasi ruangan, nama rack, posisi grid, dan kapasitas U unit</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Ruangan Server Penempatan <span className="text-blue-400">*</span>
          </label>
          <select required value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}
            className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all">
            <option value="">-- Pilih Ruangan --</option>
            {allRooms.map(r => (
              <option key={r.id} value={r.id}>{r.floor_name} › {r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Kode / Nama Rack Cabinet <span className="text-blue-400">*</span>
          </label>
          <input type="text" required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: NOC-RACK-A1"
            className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Posisi Grid / Baris
            </label>
            <input type="text" value={form.position} placeholder="Contoh: Baris A - Slot 1"
              onChange={e => setForm({ ...form, position: e.target.value })}
              className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Kapasitas Slot (Total U) <span className="text-blue-400">*</span>
            </label>
            <input type="number" min={1} required value={form.total_u}
              onChange={e => setForm({ ...form, total_u: e.target.value })}
              className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all" />
          </div>
        </div>

        {/* Quick Capacity Preset */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">Preset Ukuran Rack Cabinet Standar:</label>
          <div className="flex gap-3">
            {[12, 24, 42].map(u => (
              <button key={u} type="button"
                onClick={() => setForm({ ...form, total_u: u })}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  Number(form.total_u) === u
                    ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    : "bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800"
                }`}>
                {u} Unit (U)
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-800">
          <button type="button" onClick={() => navigate(`/buildings/${buildingId}`)}
            className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
            Batal
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={18} />
            {saving ? "Menyimpan Rack..." : "Simpan Rack Cabinet Baru"}
          </button>
        </div>
      </form>
    </div>
  );
}
