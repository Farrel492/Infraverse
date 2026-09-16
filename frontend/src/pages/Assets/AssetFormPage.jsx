import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { deviceService } from "../../services/deviceService";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import {
  Server, ArrowLeft, Save, MapPin, HardDrive, Network,
  ShieldCheck, Calendar, Activity, CheckCircle2, Shield, Router, 
  Wifi, Battery, Package, Sparkles, AlertCircle, Cpu
} from "lucide-react";
import toast from "react-hot-toast";

const DEVICE_TYPES = [
  { value: "server", label: "Server Compute Node", icon: <Server size={18} /> },
  { value: "switch", label: "Network Switch Core/Access", icon: <Network size={18} /> },
  { value: "router", label: "Edge/Gateway Router", icon: <Router size={18} /> },
  { value: "firewall", label: "Hardware Firewall / UTM", icon: <Shield size={18} /> },
  { value: "access_point", label: "Access Point WiFi 6", icon: <Wifi size={18} /> },
  { value: "ups", label: "Power UPS Battery Bank", icon: <Battery size={18} /> },
  { value: "other", label: "Perangkat Lainnya", icon: <Package size={18} /> },
];

const DEVICE_STATUSES = [
  { value: "active", label: "Aktif Normal (Online)", color: "emerald" },
  { value: "inactive", label: "Non-Aktif (Offline)", color: "slate" },
  { value: "maintenance", label: "Dalam Pemeliharaan", color: "amber" },
  { value: "down", label: "Kritis / Down Alert", color: "rose" },
];

export default function AssetFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [searchParams] = useSearchParams();
  const queryRackId = searchParams.get("rack_id");
  const querySlot   = searchParams.get("rack_position") || searchParams.get("slot");
  const navigate    = useNavigate();

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const [form, setForm] = useState({
    rack_id: queryRackId ?? "",
    name: "",
    type: "server",
    vendor: "",
    model: "",
    serial_number: "",
    ip_address: "",
    mac_address: "",
    status: "active",
    purchase_date: "",
    warranty_expiry: "",
    rack_position: querySlot ?? "",
    rack_units: 1,
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
        toast.error("Gagal memuat data pendukung formulir perangkat.");
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
        if (v !== "" && v !== null && v !== undefined) {
          fd.append(k, v);
        }
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
      const msg = errs ? Object.values(errs).flat().join(" ") : (err.response?.data?.message ?? "Terjadi kesalahan saat menyimpan perangkat.");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Find selected rack details for preview
  const allRacks = buildings.flatMap(b =>
    (b.floors ?? []).flatMap(f =>
      (f.rooms ?? []).flatMap(r =>
        (r.racks ?? []).map(rk => ({
          ...rk,
          fullLabel: `${b.name} › ${f.name} › ${r.name} › ${rk.name}`
        }))
      )
    )
  );

  const selectedRackObj = allRacks.find(r => String(r.id) === String(form.rack_id));

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-blue-500/20" />
          <p className="text-base font-semibold text-slate-300">Memuat formulir perangkat aset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Katalog Aset Digital", href: "/assets" },
        { label: isEditing ? `Edit ${form.name || "Perangkat"}` : "Tambah Perangkat Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate("/assets")}
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {isEditing ? "Mode Edit Perangkat" : "Registrasi Perangkat Baru"}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">Integrasi Digital Twin & Topology NOC</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                {isEditing ? `Edit Konfigurasi: ${form.name}` : "Pendaftaran Perangkat IT / Server Baru"}
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Petakan perangkat fisik ke dalam rack server cabinet, atur alamat IP jaringan, tipe hardware, dan pelacakan masa garansi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/assets")}
              className="px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all"
            >
              Kembali ke Katalog
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

      {/* Main Grid: Form Inputs & Live Preview */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Input Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Section 1: Lokasi & Rack Cabinet */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <MapPin size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">1. Lokasi Spasial & Posisi Rack Cabinet</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tentukan cabinet pusat data dan slot U unit tempat perangkat dipasang</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                  Rack Server Penempatan <span className="text-blue-400">*</span>
                </label>
                <select 
                  required 
                  value={form.rack_id} 
                  onChange={e => setForm({ ...form, rack_id: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                >
                  <option value="">-- Pilih Rack Cabinet Penempatan --</option>
                  {allRacks.map(rk => (
                    <option key={rk.id} value={rk.id}>{rk.fullLabel}</option>
                  ))}
                </select>
                {allRacks.length === 0 && (
                  <p className="text-xs text-amber-400 mt-2 font-medium">
                    ⚠️ Belum ada rack terdaftar. Buat rack di menu Inspeksi Gedung terlebih dahulu.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Posisi Slot Rack (Nomor U dari Bawah)
                  </label>
                  <input 
                    type="number" 
                    min={1} 
                    max={60}
                    value={form.rack_position} 
                    placeholder="Contoh: 14 (Slot U14)"
                    onChange={e => setForm({ ...form, rack_position: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Standar cabinet 42U menghitung posisi dari U1 (bawah) sampai U42 (atas).</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Tinggi Unit Perangkat (Slot U) <span className="text-blue-400">*</span>
                  </label>
                  <input 
                    type="number" 
                    min={1} 
                    max={10} 
                    required 
                    value={form.rack_units}
                    onChange={e => setForm({ ...form, rack_units: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                  />
                  {/* Presets */}
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 4].map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setForm({ ...form, rack_units: u })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                          Number(form.rack_units) === u
                            ? "bg-blue-600 text-white border-blue-400"
                            : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        {u}U
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Identitas & Spesifikasi Hardware */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <HardDrive size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">2. Spesifikasi & Identitas Hardware</h2>
                <p className="text-xs text-slate-400 mt-0.5">Nama perangkat, tipe hardware, vendor fabricator, dan tipe seri</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                  Nama Perangkat Hardware <span className="text-blue-400">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={form.name}
                  placeholder="Contoh: Core Switch NOC Main Nexus-01"
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
                  Tipe Hardware <span className="text-blue-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DEVICE_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: t.value })}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                        form.type === t.value
                          ? "bg-indigo-600/20 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.25)] text-white"
                          : "bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <div className={form.type === t.value ? "text-indigo-400" : "text-slate-500"}>
                        {t.icon}
                      </div>
                      <span className="text-xs font-bold capitalize">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Vendor / Pabrikan
                  </label>
                  <input 
                    type="text" 
                    value={form.vendor} 
                    placeholder="Contoh: Cisco / Dell / Mikrotik / Fortinet"
                    onChange={e => setForm({ ...form, vendor: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Model / Seri Perangkat
                  </label>
                  <input 
                    type="text" 
                    value={form.model} 
                    placeholder="Contoh: Catalyst 9500 / PowerEdge R750"
                    onChange={e => setForm({ ...form, model: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Jaringan & Serial Number */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Network size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">3. Konfigurasi Jaringan & Serial Pabrik</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pengalamatan IP IPv4, MAC Address, dan Nomor Seri Pabrik</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">Alamat IP (IPv4)</label>
                <input 
                  type="text" 
                  value={form.ip_address} 
                  placeholder="Contoh: 192.168.10.1"
                  onChange={e => setForm({ ...form, ip_address: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">MAC Address</label>
                <input 
                  type="text" 
                  value={form.mac_address} 
                  placeholder="00:1A:2B:3C:4D:5E"
                  onChange={e => setForm({ ...form, mac_address: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">Nomor Seri (S/N)</label>
                <input 
                  type="text" 
                  value={form.serial_number} 
                  placeholder="SN-9821-XCA-001"
                  onChange={e => setForm({ ...form, serial_number: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                />
              </div>
            </div>
          </div>

          {/* Section 4: Status Operasional & Garansi */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">4. Status Operasional & Siklus Hidup Garansi</h2>
                <p className="text-xs text-slate-400 mt-0.5">Status operasional perangkat dan informasi kontrak garansi pabrik</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
                  Status Operasional Perangkat
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DEVICE_STATUSES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm({ ...form, status: s.value })}
                      className={`p-3.5 rounded-2xl border text-center font-bold text-xs capitalize transition-all ${
                        form.status === s.value
                          ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.35)]"
                          : "bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Tanggal Pengadaan / Pembelian
                  </label>
                  <input 
                    type="date" 
                    value={form.purchase_date}
                    onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Batas Akhir Masa Garansi
                  </label>
                  <input 
                    type="date" 
                    value={form.warranty_expiry}
                    onChange={e => setForm({ ...form, warranty_expiry: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" 
                  />
                </div>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => navigate("/assets")}
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
                <span>{saving ? "Menyimpan Perangkat..." : (isEditing ? "Simpan Perubahan Aset" : "Daftarkan Perangkat Baru")}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Live Preview Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-7 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Live Preview Perangkat</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Unit {form.rack_units || 1}U
              </span>
            </div>

            {/* Hardware Mockup Card */}
            <div className="glass rounded-3xl p-6 border border-blue-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
                  {DEVICE_TYPES.find(t => t.value === form.type)?.icon ?? <Server size={22} />}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize bg-slate-900 border border-slate-700">
                  <span className={`w-2 h-2 rounded-full ${
                    form.status === "active" ? "bg-emerald-400 animate-pulse" :
                    form.status === "down" ? "bg-rose-500" :
                    form.status === "maintenance" ? "bg-amber-400" : "bg-slate-500"
                  }`} />
                  <span className="text-slate-200">{form.status}</span>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-100 text-lg leading-snug">
                  {form.name || "Nama Perangkat IT"}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {form.vendor || "Vendor"} {form.model || "Model / Seri"}
                </p>
              </div>

              {/* Specs Pills */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 font-medium">IP Address</span>
                  <span className="font-mono text-blue-400 font-bold">{form.ip_address || "Belum Ditetapkan"}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 font-medium">Lokasi Rack</span>
                  <span className="text-slate-200 font-semibold truncate max-w-[170px]">
                    {selectedRackObj?.name ?? (form.rack_id ? `Rack #${form.rack_id}` : "Belum Dipilih")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 font-medium">Slot Posisi U</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {form.rack_position ? `Slot U${form.rack_position}` : "Posisi Otomatis"}
                  </span>
                </div>
              </div>
            </div>

            {/* Guidance Callout */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1.5 leading-relaxed shadow-sm">
              <p className="font-bold flex items-center gap-1.5 text-indigo-200">
                <CheckCircle2 size={15} /> Integrasi Otomatis:
              </p>
              <p className="text-slate-400">
                Perangkat ini akan langsung muncul pada peta topologi 3D dan visualizer 42U gedung setelah disimpan.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
