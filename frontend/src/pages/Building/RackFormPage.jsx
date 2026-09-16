import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { Server, ArrowLeft, Save, DoorOpen, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
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
      toast.error("Silakan pilih ruangan server penempatan.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await buildingService.createRack(form.room_id, {
        name: form.name,
        position: form.position,
        total_u: parseInt(form.total_u),
        room_id: parseInt(form.room_id),
      });
      toast.success("Rack Cabinet 42U baru berhasil ditambahkan!");
      navigate(`/buildings/${buildingId}`);
    } catch (err) {
      const msg = err.response?.data?.message ?? "Gagal menambahkan rack.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const allRooms = building?.floors?.flatMap(f =>
    (f.rooms ?? []).map(r => ({ ...r, floor_name: f.name, floor_number: f.floor_number }))
  ) ?? [];

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-blue-500/20" />
          <p className="text-base font-semibold text-slate-300">Memuat formulir rack cabinet...</p>
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
        { label: "Tambah Rack Server Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
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
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Kabinet Server 42U
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">{building?.name}</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                Pendaftaran Rack Cabinet Server
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Tambahkan unit rack cabinet server fisik untuk visualisasi slot U unit pada Digital Twin dan inspeksi gedung.
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
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-inner">
            <Server size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Spesifikasi Rack Cabinet</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tentukan ruangan penempatan, nama rack, posisi baris, dan total slot U</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
              Ruangan Server Penempatan <span className="text-blue-400">*</span>
            </label>
            <select 
              required 
              value={form.room_id} 
              onChange={e => setForm({ ...form, room_id: e.target.value })}
              className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            >
              <option value="">-- Pilih Ruangan Server --</option>
              {allRooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.floor_name} (Lantai {r.floor_number}) › {r.name}
                </option>
              ))}
            </select>
            {allRooms.length === 0 && (
              <p className="text-xs text-amber-400 mt-2 font-medium">
                ⚠️ Belum ada ruangan di gedung ini. Harap tambahkan ruangan server terlebih dahulu sebelum membuat rack.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
              Kode / Nama Rack Cabinet <span className="text-blue-400">*</span>
            </label>
            <input 
              type="text" 
              required 
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: RACK-NOC-01 atau SRV-RACK-ALPHA"
              className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                Posisi Baris / Grid Ruangan
              </label>
              <input 
                type="text" 
                value={form.position} 
                onChange={e => setForm({ ...form, position: e.target.value })}
                placeholder="Contoh: Baris A - Slot 01"
                className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                Kapasitas Slot (Total U) <span className="text-blue-400">*</span>
              </label>
              <input 
                type="number" 
                min={1} 
                max={60} 
                required 
                value={form.total_u}
                onChange={e => setForm({ ...form, total_u: e.target.value })}
                className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Pilihan Cepat Standar Rack Server:
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { u: 12, label: "12U Wallmount / Mini Rack" },
                { u: 24, label: "24U Mid-Tower Cabinet" },
                { u: 42, label: "42U Standard Data Center" },
                { u: 48, label: "48U High-Density Rack" }
              ].map(item => (
                <button
                  key={item.u}
                  type="button"
                  onClick={() => setForm({ ...form, total_u: item.u })}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                    Number(form.total_u) === item.u
                      ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.35)]"
                      : "bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
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
            disabled={saving || allRooms.length === 0}
            className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
          >
            <Save size={20} />
            <span>{saving ? "Menyimpan Rack..." : "Simpan & Daftarkan Rack Cabinet Baru"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
