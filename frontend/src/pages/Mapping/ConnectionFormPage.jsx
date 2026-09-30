import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mappingService } from "../../services/mappingService";
import { deviceService } from "../../services/deviceService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { 
  Network, ArrowLeft, Save, CheckCircle2, 
  Zap, Radio, Sparkles, AlertCircle, Cpu, 
  GitBranch, Plug, Compass, Server
} from "lucide-react";
import toast from "react-hot-toast";

const CONNECTION_TYPES = [
  { 
    value: "fiber", 
    label: "Fiber Optic", 
    subtitle: "FO High Speed 10G/100G",
    desc: "Backbone antar-gedung 10G/40G/100Gbps multi-mode / single-mode.", 
    color: "blue",
    borderActive: "border-blue-500/80 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    textActive: "text-blue-300",
    dot: "bg-blue-400",
    lineGradient: "from-blue-500 via-cyan-400 to-blue-500",
  },
  { 
    value: "utp", 
    label: "UTP / Cat6A", 
    subtitle: "Ethernet RJ-45 1G/10G",
    desc: "Koneksi kabel tembaga twisted pair RJ-45 standar rack switch.", 
    color: "emerald",
    borderActive: "border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    textActive: "text-emerald-300",
    dot: "bg-emerald-400",
    lineGradient: "from-emerald-500 via-teal-400 to-emerald-500",
  },
  { 
    value: "wireless", 
    label: "Wireless PtP", 
    subtitle: "Point-to-Point Radio",
    desc: "Interkoneksi radio wireless jangkauan jauh tanpa kabel fisik.", 
    color: "amber",
    borderActive: "border-amber-500/80 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    textActive: "text-amber-300",
    dot: "bg-amber-400 animate-pulse",
    lineGradient: "from-amber-500 via-orange-400 to-amber-500",
  },
  { 
    value: "other", 
    label: "VLAN / VPN", 
    subtitle: "Virtual Tunnel / Trunk",
    desc: "Link virtual trunking inter-switch 802.1Q atau overlay VPN.", 
    color: "violet",
    borderActive: "border-violet-500/80 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.3)]",
    textActive: "text-violet-300",
    dot: "bg-violet-400",
    lineGradient: "from-violet-500 via-purple-400 to-violet-500",
  },
];

export default function ConnectionFormPage() {
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    source_device_id: "",
    target_device_id: "",
    connection_type: "fiber",
    port_source: "",
    port_target: "",
  });

  useEffect(() => {
    deviceService.getAll()
      .then(res => setDevices(res.data))
      .catch(() => toast.error("Gagal memuat daftar perangkat."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.source_device_id || !form.target_device_id) {
      toast.error("Silakan pilih perangkat sumber dan perangkat tujuan.");
      return;
    }
    if (String(form.source_device_id) === String(form.target_device_id)) {
      toast.error("Perangkat sumber dan perangkat tujuan tidak boleh sama.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        source_device_id: Number(form.source_device_id),
        target_device_id: Number(form.target_device_id),
        connection_type: form.connection_type,
        port_source: form.port_source ? form.port_source.trim() : null,
        port_target: form.port_target ? form.port_target.trim() : null,
      };

      await mappingService.addConnection(payload);
      toast.success("Koneksi jaringan baru berhasil ditambahkan ke topologi!");
      navigate("/mapping");
    } catch (err) {
      const errs = err.response?.data?.errors;
      const msg = errs ? Object.values(errs).flat().join(" ") : (err.response?.data?.message ?? "Terjadi kesalahan saat menyimpan koneksi.");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const sourceDev = devices.find(d => String(d.id) === String(form.source_device_id));
  const targetDev = devices.find(d => String(d.id) === String(form.target_device_id));
  const selectedType = CONNECTION_TYPES.find(t => t.value === form.connection_type) || CONNECTION_TYPES[0];

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-blue-500/20" />
          <p className="text-base font-semibold text-slate-300">Memuat formulir koneksi topologi 3D...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Peta Jaringan 3D", href: "/mapping" },
        { label: "Tambah Koneksi Topologi Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate("/mapping")}
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg hover:shadow-slate-800/50 cursor-pointer"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Interkoneksi Jaringan
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">Topologi Graf 3D Interaktif</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                Pendaftaran Koneksi Topologi Jaringan Baru
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Hubungkan dua titik node perangkat hardware dengan media transmisi Fiber Optic, UTP Ethernet, atau Wireless Point-to-Point.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/mapping")}
            className="px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
          >
            Kembali ke Peta 3D
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm font-semibold text-red-400 flex items-center gap-3 shadow-lg">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form Inputs (7 Cols) & Live Topology Preview (5 Cols) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Node Titik Sumber & Tujuan */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Network size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Node Titik Transmisi (A ➔ B)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tentukan node awal sumber dan node akhir tujuan interkoneksi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Source Device */}
              <div>
                <label className="form-label">
                  <span>Dari Perangkat (Node A) <span className="text-blue-400">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">Sumber</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box text-blue-400">
                    <Cpu size={18} />
                  </div>
                  <select 
                    required 
                    value={form.source_device_id}
                    onChange={e => setForm({ ...form, source_device_id: e.target.value })}
                    className="select-control"
                  >
                    <option value="">-- Pilih Node Sumber --</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type?.toUpperCase()}) — {d.ip_address ?? "No IP"}
                      </option>
                    ))}
                  </select>
                </div>
                {sourceDev && (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle2 size={13} className="text-blue-400" />
                    <span className="text-xs text-blue-400 font-semibold font-mono">
                      {sourceDev.ip_address || "No IP"} · {sourceDev.type?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Target Device */}
              <div>
                <label className="form-label">
                  <span>Ke Perangkat (Node B) <span className="text-blue-400">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">Tujuan</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box text-indigo-400">
                    <Cpu size={18} />
                  </div>
                  <select 
                    required 
                    value={form.target_device_id}
                    onChange={e => setForm({ ...form, target_device_id: e.target.value })}
                    className="select-control"
                  >
                    <option value="">-- Pilih Node Tujuan --</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type?.toUpperCase()}) — {d.ip_address ?? "No IP"}
                      </option>
                    ))}
                  </select>
                </div>
                {targetDev && (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle2 size={13} className="text-indigo-400" />
                    <span className="text-xs text-indigo-400 font-semibold font-mono">
                      {targetDev.ip_address || "No IP"} · {targetDev.type?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Validation warning if source == target */}
            {form.source_device_id && form.target_device_id && String(form.source_device_id) === String(form.target_device_id) && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>Node Sumber dan Tujuan tidak boleh perangkat yang sama!</span>
              </div>
            )}
          </div>

          {/* Section 2: Tipe Media Transmisi */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <Zap size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Tipe Media Transmisi Jaringan</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pilih media transmisi data yang digunakan untuk menghubungkan kedua node</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CONNECTION_TYPES.map(t => {
                const isSelected = form.connection_type === t.value;
                return (
                  <label
                    key={t.value}
                    onClick={() => setForm({ ...form, connection_type: t.value })}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? t.borderActive
                        : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? t.dot : "bg-slate-600"}`} />
                        <span className={`text-sm font-bold ${isSelected ? t.textActive : "text-slate-200"}`}>
                          {t.label}
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="conn_type"
                        value={t.value}
                        checked={isSelected}
                        onChange={() => setForm({ ...form, connection_type: t.value })}
                        className="accent-blue-500 w-4 h-4"
                      />
                    </div>
                    <p className={`text-[11px] font-bold ${isSelected ? t.textActive : "text-slate-400"}`}>
                      {t.subtitle}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {t.desc}
                    </p>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 3: Port Interface */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Plug size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Port Interface Fisik (Opsional)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Identifikasi port interface switch atau router untuk dokumentasi kabel</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="form-label">
                  <span>Port Interface Sumber (Node A)</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box text-blue-400">
                    <GitBranch size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={form.port_source} 
                    placeholder="Contoh: Gi0/1 atau Te1/0/1"
                    onChange={e => setForm({ ...form, port_source: e.target.value })}
                    className="input-control font-mono" 
                  />
                </div>
              </div>

              <div>
                <label className="form-label">
                  <span>Port Interface Tujuan (Node B)</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box text-indigo-400">
                    <GitBranch size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={form.port_target} 
                    placeholder="Contoh: Te1/0/24 atau Eth0"
                    onChange={e => setForm({ ...form, port_target: e.target.value })}
                    className="input-control font-mono" 
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => navigate("/mapping")}
                className="w-full sm:w-1/3 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all shadow-md cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={saving || !form.source_device_id || !form.target_device_id || String(form.source_device_id) === String(form.target_device_id)}
                className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-black shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Save size={18} />
                <span>{saving ? "Menyimpan Koneksi..." : "Simpan Koneksi Topologi"}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Live Topology Diagram Preview Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Preview Visual Link Jaringan</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase border ${selectedType.textActive} bg-slate-900 border-slate-700`}>
                {form.connection_type} Link
              </span>
            </div>

            {/* Connection Diagram Card */}
            <div className="glass rounded-3xl p-7 border border-blue-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Topologi Peta 3D</span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Link Aktif
                </span>
              </div>

              {/* Node diagram */}
              <div className="flex items-center justify-between gap-3 bg-slate-950/90 p-5 rounded-2xl border border-slate-800 shadow-inner">
                {/* Node A */}
                <div className="text-center flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto mb-2 font-black shadow-md">
                    A
                  </div>
                  <p className="text-xs font-bold text-slate-100 truncate">
                    {sourceDev ? sourceDev.name : "Pilih Node A"}
                  </p>
                  <p className="text-[11px] text-blue-400 font-mono mt-0.5 truncate">
                    {form.port_source || (sourceDev?.ip_address ?? "Port Asal")}
                  </p>
                </div>

                {/* Animated Connection Pulse */}
                <div className="flex-shrink-0 text-center px-1">
                  <div className={`w-14 h-1.5 animate-pulse rounded-full my-2 bg-gradient-to-r ${selectedType.lineGradient} shadow-[0_0_12px_rgba(59,130,246,0.7)]`} />
                  <span className={`text-[10px] font-bold uppercase block tracking-wider ${selectedType.textActive}`}>
                    {form.connection_type}
                  </span>
                </div>

                {/* Node B */}
                <div className="text-center flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto mb-2 font-black shadow-md">
                    B
                  </div>
                  <p className="text-xs font-bold text-slate-100 truncate">
                    {targetDev ? targetDev.name : "Pilih Node B"}
                  </p>
                  <p className="text-[11px] text-indigo-400 font-mono mt-0.5 truncate">
                    {form.port_target || (targetDev?.ip_address ?? "Port Tujuan")}
                  </p>
                </div>
              </div>

              {/* Connection Type Info */}
              <div className={`p-4 rounded-2xl border ${selectedType.borderActive} flex items-start gap-3`}>
                <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${selectedType.dot}`} />
                <div>
                  <p className={`text-sm font-bold ${selectedType.textActive}`}>{selectedType.label} — {selectedType.subtitle}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium leading-relaxed">{selectedType.desc}</p>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2 pt-2 border-t border-slate-800">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Garis interkoneksi teranimasi otomatis pada kanvas topologi 3D interaktif.</span>
              </div>
            </div>

            {/* Guidance Callout */}
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-2 leading-relaxed shadow-lg">
              <p className="font-bold flex items-center gap-1.5 text-blue-300">
                <Compass size={16} /> Interaksi Topologi 3D:
              </p>
              <p className="text-slate-300">
                Koneksi ini menghubungkan node graf pada modul <strong>Peta Jaringan Topologi 3D</strong> dan dapat diuji dalam modul <strong>Simulasi Bencana (Disaster Recovery)</strong>.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
