import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mappingService } from "../../services/mappingService";
import { deviceService } from "../../services/deviceService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { 
  Network, ArrowLeft, Save, CheckCircle2, 
  Zap, Radio, Sparkles, AlertCircle, ChevronDown,
  Cpu, GitBranch, Plug
} from "lucide-react";
import toast from "react-hot-toast";

const CONNECTION_TYPES = [
  { 
    value: "fiber", 
    label: "Fiber Optic", 
    subtitle: "FO High Speed 10G/100G",
    desc: "Backbone antar-gedung 10G/40G/100Gbps multi-mode", 
    color: "blue",
    ring: "border-blue-500/60 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
    text: "text-blue-300",
    dot: "bg-blue-400",
  },
  { 
    value: "utp", 
    label: "UTP / Cat6A", 
    subtitle: "Ethernet RJ-45 1G/10G",
    desc: "Koneksi kabel tembaga RJ-45 hingga 10Gbps", 
    color: "emerald",
    ring: "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  { 
    value: "wireless", 
    label: "Wireless PtP", 
    subtitle: "Point-to-Point Radio",
    desc: "Interkoneksi radio wireless jangkauan jauh", 
    color: "amber",
    ring: "border-amber-500/60 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    text: "text-amber-300",
    dot: "bg-amber-400 animate-pulse",
  },
  { 
    value: "other", 
    label: "VLAN / VPN", 
    subtitle: "Virtual Tunnel / Trunk",
    desc: "Link virtual trunking inter-switch atau VPN overlay", 
    color: "violet",
    ring: "border-violet-500/60 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]",
    text: "text-violet-300",
    dot: "bg-violet-400",
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
  const selectedType = CONNECTION_TYPES.find(t => t.value === form.connection_type);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-blue-500/20" />
          <p className="text-base font-semibold text-slate-300">Memuat formulir koneksi topologi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Peta Jaringan 3D", href: "/mapping" },
        { label: "Tambah Koneksi Topologi Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate("/mapping")}
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg flex-shrink-0"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Interkoneksi Jaringan
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">Topologi Graf 3D Real-Time</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                Pendaftaran Koneksi Jaringan Baru
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Hubungkan dua titik node perangkat IT dengan transmisi Fiber Optic, UTP Ethernet, atau Wireless Point-to-Point.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/mapping")}
            className="px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all"
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-7 shadow-2xl">
            
            {/* Section Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Network size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Node Titik Sumber & Tujuan</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tentukan node awal transmisi dan perangkat akhir tujuan</p>
              </div>
            </div>

            {/* Source & Target Device */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Source */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                  Dari Perangkat (Source Node) <span className="text-blue-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none">
                    <Cpu size={17} />
                  </div>
                  <select 
                    required 
                    value={form.source_device_id}
                    onChange={e => setForm({ ...form, source_device_id: e.target.value })}
                    className="w-full pl-11 pr-10 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="">-- Pilih Node Sumber --</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type?.toUpperCase()}) — {d.ip_address ?? "No IP"}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                  </div>
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

              {/* Target */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                  Ke Perangkat (Target Node) <span className="text-blue-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
                    <Cpu size={17} />
                  </div>
                  <select 
                    required 
                    value={form.target_device_id}
                    onChange={e => setForm({ ...form, target_device_id: e.target.value })}
                    className="w-full pl-11 pr-10 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="">-- Pilih Node Tujuan --</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type?.toUpperCase()}) — {d.ip_address ?? "No IP"}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                  </div>
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

            {/* Connection Type Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
                Tipe Media Transmisi Koneksi <span className="text-blue-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CONNECTION_TYPES.map(t => {
                  const isSelected = form.connection_type === t.value;
                  return (
                    <label
                      key={t.value}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected ? t.ring : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? t.dot : "bg-slate-600"}`} />
                          <span className={`text-sm font-bold ${isSelected ? t.text : "text-slate-200"}`}>
                            {t.label}
                          </span>
                        </div>
                        <input
                          type="radio"
                          name="conn_type"
                          value={t.value}
                          checked={isSelected}
                          onChange={e => setForm({ ...form, connection_type: e.target.value })}
                          className="accent-blue-500 w-4 h-4"
                        />
                      </div>
                      <p className={`text-[11px] font-bold ${isSelected ? t.text : "text-slate-400"}`}>{t.subtitle}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Port Interfaces */}
            <div>
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Plug size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Port Interface (Opsional)</h3>
                  <p className="text-xs text-slate-500">Nama interface fisik perangkat sumber dan tujuan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Port Interface Sumber
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                      <GitBranch size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={form.port_source} 
                      placeholder="Contoh: Gi0/1 atau Te1/0/1"
                      onChange={e => setForm({ ...form, port_source: e.target.value })}
                      className="w-full pl-10 pr-4 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Port Interface Tujuan
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                      <GitBranch size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={form.port_target} 
                      placeholder="Contoh: Te1/0/24"
                      onChange={e => setForm({ ...form, port_target: e.target.value })}
                      className="w-full pl-10 pr-4 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => navigate("/mapping")}
                className="w-full sm:w-1/3 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-all shadow-md"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
              >
                <Save size={20} />
                <span>{saving ? "Menyimpan Koneksi..." : "Simpan Topologi Koneksi"}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Preview Visual Link Jaringan</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase border ${
                selectedType
                  ? `${selectedType.text} bg-slate-900 border-slate-700`
                  : "text-blue-400 bg-blue-500/10 border-blue-500/30"
              }`}>
                {form.connection_type} Link
              </span>
            </div>

            {/* Connection Diagram */}
            <div className="glass rounded-3xl p-7 border border-blue-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Topologi Peta 3D</span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Link Aktif
                </span>
              </div>

              {/* Node diagram */}
              <div className="flex items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-inner">
                {/* Node A */}
                <div className="text-center flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto mb-2 font-black shadow-md">
                    A
                  </div>
                  <p className="text-xs font-bold text-slate-100 truncate">
                    {sourceDev ? sourceDev.name : "Pilih Node A"}
                  </p>
                  <p className="text-[11px] text-blue-400 font-mono mt-0.5 truncate">
                    {form.port_source || "Port Asal"}
                  </p>
                </div>

                {/* Animated Connection */}
                <div className="flex-shrink-0 text-center px-2">
                  <div className={`w-16 h-1 animate-pulse rounded-full my-2 ${
                    selectedType?.color === "fiber" ? "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" :
                    selectedType?.color === "emerald" ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" :
                    selectedType?.color === "amber" ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" :
                    "bg-gradient-to-r from-violet-500 via-violet-400 to-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                  }`} />
                  <span className={`text-[10px] font-bold uppercase block tracking-wider ${selectedType?.text || "text-blue-300"}`}>
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
                    {form.port_target || "Port Tujuan"}
                  </p>
                </div>
              </div>

              {/* Connection Type Info */}
              {selectedType && (
                <div className={`p-3.5 rounded-2xl border ${selectedType.ring} flex items-start gap-3`}>
                  <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${selectedType.dot}`} />
                  <div>
                    <p className={`text-sm font-bold ${selectedType.text}`}>{selectedType.label} — {selectedType.subtitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedType.desc}</p>
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-400 flex items-center gap-2 pt-2 border-t border-slate-800">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Garis koneksi teranimasi otomatis pada kanvas graf topologi 3D interaktif.</span>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
