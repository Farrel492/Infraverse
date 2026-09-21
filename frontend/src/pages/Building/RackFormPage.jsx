import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { Server, ArrowLeft, Save, DoorOpen, CheckCircle2, AlertCircle, ChevronDown, LayoutGrid, Hash, Zap } from "lucide-react";
import toast from "react-hot-toast";

const RACK_PRESETS = [
  { u: 12, label: "12U", desc: "Wallmount / Mini" },
  { u: 24, label: "24U", desc: "Mid-Tower" },
  { u: 42, label: "42U", desc: "Standard DC" },
  { u: 48, label: "48U", desc: "High-Density" },
];

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

  const selectedRoom = allRooms.find(r => String(r.id) === String(form.room_id));

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
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5">
          <button 
            type="button"
            onClick={() => navigate(`/buildings/${buildingId}`)}
            className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg flex-shrink-0"
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
          {/* Room Select — Custom Styled */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
              Ruangan Server Penempatan <span className="text-blue-400">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none">
                <DoorOpen size={18} />
              </div>
              <select 
                required 
                value={form.room_id} 
                onChange={e => setForm({ ...form, room_id: e.target.value })}
                className="w-full pl-11 pr-10 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner appearance-none cursor-pointer"
              >
                <option value="">-- Pilih Ruangan Server --</option>
                {allRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.floor_name} (Lantai {r.floor_number}) › {r.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
            {allRooms.length === 0 && (
              <div className="flex items-center gap-2 mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-400 font-medium">
                  Belum ada ruangan di gedung ini. Tambahkan ruangan server terlebih dahulu.
                </p>
              </div>
            )}
            {selectedRoom && (
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle2 size={13} className="text-blue-400" />
                <span className="text-xs text-blue-400 font-semibold">
                  {selectedRoom.floor_name} › {selectedRoom.name}
                </span>
              </div>
            )}
          </div>

          {/* Rack Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
              Kode / Nama Rack Cabinet <span className="text-blue-400">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                <Server size={18} />
              </div>
              <input 
                type="text" 
                required 
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: RACK-NOC-01 atau SRV-RACK-ALPHA"
                className="w-full pl-11 pr-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Position */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                Posisi Baris / Grid Ruangan
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                  <LayoutGrid size={18} />
                </div>
                <input 
                  type="text" 
                  value={form.position} 
                  onChange={e => setForm({ ...form, position: e.target.value })}
                  placeholder="Contoh: Baris A - Slot 01"
                  className="w-full pl-11 pr-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                />
              </div>
            </div>

            {/* Total U */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                Kapasitas Slot (Total U) <span className="text-blue-400">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                  <Hash size={18} />
                </div>
                <input 
                  type="number" 
                  min={1} 
                  max={60} 
                  required 
                  value={form.total_u}
                  onChange={e => setForm({ ...form, total_u: e.target.value })}
                  className="w-full pl-11 pr-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                />
              </div>
            </div>
          </div>

          {/* Rack Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Zap size={13} className="text-amber-400" />
              Pilihan Cepat Standar Rack Server:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RACK_PRESETS.map(item => (
                <button
                  key={item.u}
                  type="button"
                  onClick={() => setForm({ ...form, total_u: item.u })}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col gap-1 ${
                    Number(form.total_u) === item.u
                      ? "bg-blue-600/20 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.25)] text-white"
                      : "bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span className={`text-lg font-black ${Number(form.total_u) === item.u ? "text-blue-300" : "text-slate-300"}`}>
                    {item.label}
                  </span>
                  <span className="text-[11px] font-medium">{item.desc}</span>
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
