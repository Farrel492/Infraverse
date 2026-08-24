import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deviceService } from "../../services/deviceService";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import {
  Server, ArrowLeft, Save, MapPin, HardDrive, Network,
  ShieldCheck, Calendar, Activity, CheckCircle2, Shield, Router, Wifi, Battery, Package
} from "lucide-react";
import toast from "react-hot-toast";

const DEVICE_TYPES = ["router", "switch", "firewall", "server", "access_point", "ups", "other"];
const DEVICE_STATUSES = ["active", "inactive", "maintenance", "down"];

export default function AssetFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    rack_id: "", name: "", type: "server", vendor: "", model: "", serial_number: "",
    ip_address: "", mac_address: "", status: "active", purchase_date: "",
    warranty_expiry: "", rack_position: "", rack_units: 1,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bRes = await buildingService.getAll();
        setBuildings(bRes.data);

        if (isEditing) {
          const dRes = await deviceService.getOne(id);
          const d = dRes.data;
          setForm({
            rack_id: d.rack_id ?? "",
            name: d.name ?? "",
            type: d.type ?? "server",
            vendor: d.vendor ?? "",
            model: d.model ?? "",
            serial_number: d.serial_number ?? "",
            ip_address: d.ip_address ?? "",
            mac_address: d.mac_address ?? "",
            status: d.status ?? "active",
            purchase_date: d.purchase_date ? d.purchase_date.substring(0, 10) : "",
            warranty_expiry: d.warranty_expiry ? d.warranty_expiry.substring(0, 10) : "",
            rack_position: d.rack_position ?? "",
            rack_units: d.rack_units ?? 1,
          });
        }
      } catch {
        toast.error("Gagal memuat data pendukung.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "") fd.append(k, v);
      });

      if (isEditing) {
        await deviceService.update(id, fd);
        toast.success("Konfigurasi perangkat aset berhasil diperbarui!");
      } else {
        await deviceService.create(fd);
        toast.success("Perangkat aset baru berhasil didaftarkan!");
      }
      navigate("/assets");
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(" ") : (err.response?.data?.message ?? "Terjadi kesalahan saat menyimpan perangkat."));
      toast.error("Gagal menyimpan perangkat aset.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Memuat formulir perangkat aset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Aset", href: "/assets" },
        { label: isEditing ? `Edit ${form.name || "Perangkat"}` : "Tambah Perangkat Baru" }
      ]} />

      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 glass p-6 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/assets")}
            className="w-11 h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all shadow-md">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100">
              {isEditing ? `Edit Konfigurasi Aset: ${form.name}` : "Pendaftaran Perangkat IT / Server Baru"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Daftarkan perangkat keras ke lokasi rack fisik, atur spesifikasi jaringan, dan pemantauan garansi
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
        
        {/* Left Input Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Section 1: Lokasi & Rack */}
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800/90 pb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">1. Lokasi & Penempatan Physical Server</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pilih rack cabinet dan posisi slot U unit di pusat data</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Rack Server Penempatan <span className="text-blue-400">*</span>
              </label>
              <select required value={form.rack_id} onChange={e => setForm({ ...form, rack_id: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all">
                <option value="">-- Pilih Rack Penempatan --</option>
                {buildings.flatMap(b => (b.floors ?? []).flatMap(f => (f.rooms ?? []).flatMap(r => (r.racks ?? []).map(rk => (
                  <option key={rk.id} value={rk.id}>{b.name} › {f.name} › {r.name} › {rk.name}</option>
                )))))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Posisi Slot Rack (U Unit)
                </label>
                <input type="number" value={form.rack_position} placeholder="Contoh: 40 (Slot U dari bawah)"
                  onChange={e => setForm({ ...form, rack_position: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Tinggi Perangkat (Unit U) <span className="text-blue-400">*</span>
                </label>
                <input type="number" min={1} required value={form.rack_units}
                  onChange={e => setForm({ ...form, rack_units: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>
          </div>

          {/* Section 2: Identitas Hardware */}
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800/90 pb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <HardDrive size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">2. Spesifikasi & Identitas Hardware</h3>
                <p className="text-xs text-slate-400 mt-0.5">Nama perangkat, tipe hardware, vendor fabricator, dan tipe seri</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Nama Perangkat <span className="text-blue-400">*</span>
                </label>
                <input type="text" required value={form.name}
                  placeholder="Contoh: Core Switch NOC-01"
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Tipe Hardware <span className="text-blue-400">*</span>
                </label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all capitalize">
                  {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Vendor / Merek
                </label>
                <input type="text" value={form.vendor} placeholder="Cisco / Dell / HP / Mikrotik"
                  onChange={e => setForm({ ...form, vendor: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Model / Seri Perangkat
                </label>
                <input type="text" value={form.model} placeholder="Catalyst 9500 / PowerEdge R740"
                  onChange={e => setForm({ ...form, model: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>
          </div>

          {/* Section 3: Networking & Serial Number */}
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800/90 pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Network size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">3. Identifikasi Jaringan & Serial</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pengalamatan IP IPv4, MAC Address, dan Serial Number pabrik</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">IP Address IPv4</label>
                <input type="text" value={form.ip_address} placeholder="10.0.1.1"
                  onChange={e => setForm({ ...form, ip_address: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">MAC Address</label>
                <input type="text" value={form.mac_address} placeholder="00:1B:44:11:3A:B7"
                  onChange={e => setForm({ ...form, mac_address: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Serial Number</label>
                <input type="text" value={form.serial_number} placeholder="CSC-9500-001"
                  onChange={e => setForm({ ...form, serial_number: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>
          </div>

          {/* Section 4: Lifecycle & Garansi */}
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800/90 pb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">4. Lifecycle Garansi & Operasional</h3>
                <p className="text-xs text-slate-400 mt-0.5">Status aktif operasi dan tanggal pembelian & garansi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Status Operasional</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all capitalize">
                  {DEVICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Tanggal Pembelian</label>
                <input type="date" value={form.purchase_date}
                  onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Masa Garansi Expire</label>
                <input type="date" value={form.warranty_expiry}
                  onChange={e => setForm({ ...form, warranty_expiry: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => navigate("/assets")}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={18} />
                {saving ? "Menyimpan Perangkat..." : (isEditing ? "Simpan Perubahan Perangkat" : "Simpan Perangkat Aset Baru")}
              </button>
            </div>
          </div>

        </div>

        {/* Right Live Preview Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl sticky top-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Live Preview Aset Perangkat</h3>
            </div>

            {/* Device Visual Card */}
            <div className="glass rounded-2xl p-6 border border-blue-500/40 bg-slate-900/90 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Server size={24} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-100 text-base leading-snug">
                    {form.name || "Nama Perangkat"}
                  </h4>
                  <p className="text-xs text-slate-400 capitalize font-mono mt-0.5">
                    {form.type ? form.type.replace("_", " ") : "server"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-b border-slate-800 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Merek / Model:</span>
                  <span className="font-bold text-slate-200">{form.vendor || "-"} {form.model || ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="font-mono text-blue-300 font-bold">{form.ip_address || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Posisi Slot Rack:</span>
                  <span className="font-bold text-amber-400">Slot U{form.rack_position || 1} ({form.rack_units}U)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Operasi:</span>
                  <span className="font-bold uppercase text-emerald-400">{form.status}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Tersinkronisasi otomatis dengan 3D Digital Twin</span>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
