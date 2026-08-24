import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mappingService } from "../../services/mappingService";
import { deviceService } from "../../services/deviceService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { Network, ArrowLeft, Save, ShieldCheck, CheckCircle2, Zap, Radio, Layers } from "lucide-react";
import toast from "react-hot-toast";

export default function ConnectionFormPage() {
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      toast.success("Koneksi jaringan baru berhasil ditambahkan!");
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Memuat formulir koneksi jaringan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Peta Jaringan", href: "/mapping" },
        { label: "Tambah Koneksi Baru" }
      ]} />

      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 glass p-6 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/mapping")}
            className="w-11 h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all shadow-md">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100">
              Penambahan Topologi Koneksi Jaringan Baru
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Hubungkan dua titik node perangkat IT dengan transmisi kabel Fiber Optic, UTP, atau Wireless Link
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            
            <div className="flex items-center gap-3 border-b border-slate-800/90 pb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Network size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">Topologi Node Sumber & Tujuan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pilih perangkat awal dan titik akhir tujuan interkoneksi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Dari Perangkat (Source Node) <span className="text-blue-400">*</span>
                </label>
                <select required value={form.source_device_id}
                  onChange={e => setForm({ ...form, source_device_id: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all">
                  <option value="">-- Pilih Node Sumber --</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.type?.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Ke Perangkat (Target Node) <span className="text-blue-400">*</span>
                </label>
                <select required value={form.target_device_id}
                  onChange={e => setForm({ ...form, target_device_id: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all">
                  <option value="">-- Pilih Node Tujuan --</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.type?.toUpperCase()})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Tipe Media Transmisi Koneksi <span className="text-blue-400">*</span>
              </label>
              <select value={form.connection_type}
                onChange={e => setForm({ ...form, connection_type: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all capitalize">
                <option value="fiber">Fiber Optic (FO High Speed Link)</option>
                <option value="utp">UTP / Ethernet LAN Cable</option>
                <option value="wireless">Wireless Point-to-Point Link</option>
                <option value="other">Lainnya (Virtual / Tunnel)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Port Interface Sumber
                </label>
                <input type="text" value={form.port_source} placeholder="Contoh: GigabitEthernet0/1"
                  onChange={e => setForm({ ...form, port_source: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Port Interface Tujuan
                </label>
                <input type="text" value={form.port_target} placeholder="Contoh: TenGigabitEthernet1/0/24"
                  onChange={e => setForm({ ...form, port_target: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => navigate("/mapping")}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={18} />
                {saving ? "Menyimpan Koneksi..." : "Simpan Topologi Koneksi"}
              </button>
            </div>

          </div>
        </div>

        {/* Right Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl sticky top-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap size={18} className="text-blue-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Preview Visual Link Jaringan</h3>
            </div>

            <div className="glass rounded-2xl p-6 border border-blue-500/40 bg-slate-900/90 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  {form.connection_type} Link
                </span>
                <span className="text-xs text-slate-400 font-bold">Topologi 3D</span>
              </div>

              {/* Node connection diagram */}
              <div className="flex items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="text-center flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto mb-1.5 font-bold">
                    A
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {sourceDev ? sourceDev.name : "Node A"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {form.port_source || "Port ?"}
                  </p>
                </div>

                <div className="flex-shrink-0 text-center">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse my-2" />
                  <span className="text-[10px] text-blue-300 font-bold uppercase block">{form.connection_type}</span>
                </div>

                <div className="text-center flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto mb-1.5 font-bold">
                    B
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {targetDev ? targetDev.name : "Node B"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {form.port_target || "Port ?"}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Render otomatis pada Smart 3D Mapping Canvas</span>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
