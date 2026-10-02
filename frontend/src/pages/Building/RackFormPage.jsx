import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { 
  Server, ArrowLeft, Save, DoorOpen, CheckCircle2, 
  AlertCircle, ChevronDown, LayoutGrid, Hash, Zap, Sparkles, Compass
} from "lucide-react";
import toast from "react-hot-toast";

const RACK_PRESETS = [
  { u: 12, label: "12U", desc: "Wallmount / Mini" },
  { u: 24, label: "24U", desc: "Mid-Tower" },
  { u: 42, label: "42U", desc: "Standard Data Center" },
  { u: 48, label: "48U", desc: "High-Density Enterprise" },
];

const RACK_NAME_PRESETS = [
  "RACK-NOC-01",
  "RACK-CORE-SW-02",
  "RACK-EDGE-RT-03",
  "RACK-STORAGE-04",
  "RACK-UPS-PWR-05",
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
    position: "Baris A - Slot 01",
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
    if (!form.name.trim()) {
      toast.error("Nama atau kode rack cabinet wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await buildingService.createRack(form.room_id, {
        name: form.name.trim(),
        position: form.position.trim(),
        total_u: parseInt(form.total_u),
        room_id: parseInt(form.room_id),
      });
      toast.success("Rack Cabinet baru berhasil didaftarkan!");
      navigate(`/buildings/${buildingId}`);
    } catch (err) {
      const msg = err.response?.data?.message ?? "Gagal menambahkan rack cabinet.";
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
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Gedung", href: "/buildings" },
        { label: building?.name || "Detail Gedung", href: `/buildings/${buildingId}` },
        { label: "Tambah Rack Server Baru" }
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
                Daftarkan unit rack cabinet server fisik untuk visualisasi slot U unit pada Digital Twin dan pemetaan perangkat switch, router, serta server.
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

      {/* Main Grid: Form Inputs (7 Cols) & Live 42U Visualizer (5 Cols) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Ruangan & Nama Rack */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Server size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Ruangan & Identitas Rack Cabinet</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tentukan ruangan penempatan dan kode penamaan cabinet server</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Room Selection */}
              <div>
                <label className="form-label">
                  <span>Ruangan Server Penempatan <span className="text-blue-400">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">Wajib Dipilih</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box">
                    <DoorOpen size={20} />
                  </div>
                  <select
                    required
                    value={form.room_id}
                    onChange={e => setForm({ ...form, room_id: e.target.value })}
                    className="select-control"
                  >
                    <option value="">-- Pilih Ruangan Server --</option>
                    {allRooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.floor_name} (Lantai {r.floor_number}) › {r.name}
                      </option>
                    ))}
                  </select>
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
                  <div className="flex items-center gap-2 mt-2.5">
                    <CheckCircle2 size={14} className="text-blue-400" />
                    <span className="text-xs text-blue-400 font-semibold">
                      Terpilih: {selectedRoom.floor_name} › {selectedRoom.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Rack Name */}
              <div>
                <label className="form-label">
                  <span>Kode / Nama Rack Cabinet <span className="text-blue-400">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">Identifikasi Unik</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box">
                    <Server size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: RACK-NOC-01 atau SRV-RACK-ALPHA"
                    className="input-control"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-400">Template Cepat:</span>
                  {RACK_NAME_PRESETS.map(tpl => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setForm({ ...form, name: tpl })}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600/30 text-slate-200 hover:text-blue-300 border border-slate-700/80 transition-all cursor-pointer shadow-sm"
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Posisi Grid & Kapasitas U */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <LayoutGrid size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Kapasitas Slot & Posisi Grid Ruangan</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tentukan kapasitas vertikal Unit (U) dan koordinat penempatan di ruangan</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Position in Room */}
                <div>
                  <label className="form-label">
                    <span>Posisi Baris / Grid Ruangan</span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box">
                      <LayoutGrid size={20} />
                    </div>
                    <input
                      type="text"
                      value={form.position}
                      onChange={e => setForm({ ...form, position: e.target.value })}
                      placeholder="Contoh: Baris A - Slot 01"
                      className="input-control"
                    />
                  </div>
                </div>

                {/* Total U Stepper */}
                <div>
                  <label className="form-label">
                    <span>Kapasitas Slot (Total U) <span className="text-blue-400">*</span></span>
                    <span className="text-[11px] font-bold text-blue-400">{form.total_u} U Slot</span>
                  </label>
                  <div className="flex items-center h-13 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all shadow-inner p-1">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, total_u: Math.max(1, Number(f.total_u) - 1) }))}
                      className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black flex items-center justify-center text-lg transition-colors flex-shrink-0 cursor-pointer"
                    >
                      −
                    </button>
                    <div className="flex-1 flex items-center justify-center gap-2">
                      <Hash size={18} className="text-blue-400" />
                      <input
                        type="number"
                        min={1}
                        max={60}
                        required
                        value={form.total_u}
                        onChange={e => setForm({ ...form, total_u: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-14 text-center font-mono text-base font-black bg-transparent text-slate-100 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400">Unit</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, total_u: Math.min(60, Number(f.total_u) + 1) }))}
                      className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black flex items-center justify-center text-lg transition-colors flex-shrink-0 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Standard Presets */}
              <div>
                <label className="form-label">
                  <span className="flex items-center gap-1.5 text-slate-200 font-bold">
                    <Zap size={14} className="text-amber-400" />
                    Pilihan Standar Industri Data Center:
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {RACK_PRESETS.map(item => (
                    <button
                      key={item.u}
                      type="button"
                      onClick={() => setForm({ ...form, total_u: item.u })}
                      className={`p-4 sm:p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                        Number(form.total_u) === item.u
                          ? "bg-blue-600/25 border-blue-400 shadow-[0_0_22px_rgba(59,130,246,0.35)] text-white ring-1 ring-blue-300/50"
                          : "bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
                      }`}
                    >
                      <span className={`text-xl font-black font-mono ${Number(form.total_u) === item.u ? "text-blue-300" : "text-white"}`}>
                        {item.label}
                      </span>
                      <span className="text-xs font-semibold leading-tight text-slate-300">{item.desc}</span>
                    </button>
                  ))}
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
                disabled={saving || allRooms.length === 0}
                className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-black shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Save size={18} />
                <span>{saving ? "Menyimpan Rack..." : "Simpan & Daftarkan Rack Cabinet"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Live 42U Visualizer Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={20} className="text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Live Preview Rack Cabinet</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {form.total_u}U Enclosure
              </span>
            </div>

            {/* Realistic 42U Visualizer Card */}
            <div className="glass rounded-3xl p-7 border border-blue-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg">
                  <Server size={28} />
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 border border-blue-500/30 text-blue-300">
                    Slot U1 - U{form.total_u}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">{form.position || "Grid A"}</p>
                </div>
              </div>

              <div className="relative z-10">
                <h4 className="font-black text-slate-100 text-xl tracking-tight leading-snug">
                  {form.name || "Nama / Kode Rack Cabinet"}
                </h4>
                <div className="flex items-center gap-2 text-slate-400 text-xs mt-2 font-medium">
                  <DoorOpen size={15} className="text-blue-400 flex-shrink-0" />
                  <span>{selectedRoom ? `${selectedRoom.floor_name} › ${selectedRoom.name}` : "Ruangan Belum Dipilih"}</span>
                </div>
              </div>

              {/* Miniature Rack Slot Frame */}
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2 relative z-10 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-2">
                  <span>Slot Cabinet Enclosure</span>
                  <span className="text-emerald-400">Siap Pasang Perangkat</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {[
                    { u: form.total_u, label: `U${form.total_u} (Slot Teratas)` },
                    { u: Math.round(form.total_u * 0.75), label: `U${Math.round(form.total_u * 0.75)} (Pusat Distribusi)` },
                    { u: Math.round(form.total_u * 0.5), label: `U${Math.round(form.total_u * 0.5)} (Core Switch Area)` },
                    { u: Math.round(form.total_u * 0.25), label: `U${Math.round(form.total_u * 0.25)} (Server Node)` },
                    { u: 1, label: "U1 (Slot Dasar / UPS Power)" },
                  ].map(slot => (
                    <div
                      key={slot.u}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono font-bold text-blue-400 text-[11px]">U{slot.u}</span>
                      <span className="text-slate-400 text-[11px]">{slot.label}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs relative z-10">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Telemetri Siap
                </span>
                <span className="text-blue-400 font-bold">Visualizer 3D Rack</span>
              </div>
            </div>

            {/* Guidance Callout */}
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-2 leading-relaxed shadow-lg">
              <p className="font-bold text-blue-300 flex items-center gap-2">
                <Compass size={16} />
                Langkah Berikutnya:
              </p>
              <p className="text-slate-300">
                Setelah rack tersimpan, buka <strong>Katalog Aset Digital</strong> untuk menambahkan server atau switch dan menetapkan posisi slot U pada rack ini.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
