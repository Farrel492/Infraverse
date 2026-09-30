import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { deviceService } from "../../services/deviceService";
import { buildingService } from "../../services/buildingService";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import {
  Server, ArrowLeft, Save, MapPin, HardDrive, Network,
  ShieldCheck, Calendar, CheckCircle2, Shield, Router, 
  Wifi, Battery, Package, Sparkles, AlertCircle, Cpu,
  Globe, Hash, Compass, Layers, Zap
} from "lucide-react";
import toast from "react-hot-toast";

const DEVICE_TYPES = [
  { value: "server", label: "Server Compute Node", icon: Server, color: "blue" },
  { value: "switch", label: "Network Switch Core/Access", icon: Network, color: "indigo" },
  { value: "router", label: "Edge/Gateway Router", icon: Router, color: "emerald" },
  { value: "firewall", label: "Hardware Firewall / UTM", icon: Shield, color: "rose" },
  { value: "access_point", label: "Access Point WiFi 6", icon: Wifi, color: "amber" },
  { value: "ups", label: "Power UPS Battery Bank", icon: Battery, color: "violet" },
  { value: "other", label: "Perangkat Lainnya", icon: Package, color: "slate" },
];

const DEVICE_STATUSES = [
  { value: "active", label: "Aktif Normal (Online)", color: "emerald", dot: "bg-emerald-400 animate-pulse" },
  { value: "inactive", label: "Non-Aktif (Offline)", color: "slate", dot: "bg-slate-400" },
  { value: "maintenance", label: "Dalam Pemeliharaan", color: "amber", dot: "bg-amber-400" },
  { value: "down", label: "Kritis / Down Alert", color: "rose", dot: "bg-rose-500 animate-ping" },
];

const DEVICE_TEMPLATES = [
  { name: "Core Switch NOC Cisco Catalyst 9500", type: "switch", vendor: "Cisco", model: "Catalyst 9500 48P", units: 1 },
  { name: "Virtualization Node Dell PowerEdge R750", type: "server", vendor: "Dell", model: "PowerEdge R750", units: 2 },
  { name: "Border Gateway MikroTik CCR2004", type: "router", vendor: "MikroTik", model: "CCR2004-16G-2S+", units: 1 },
  { name: "Perimeter Firewall FortiGate 100F", type: "firewall", vendor: "Fortinet", model: "FortiGate 100F", units: 1 },
  { name: "Backup Power Bank APC Smart-UPS RT 5kVA", type: "ups", vendor: "APC Schneider", model: "SRT5KXLI", units: 3 },
];

export default function AssetFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [searchParams] = useSearchParams();
  const queryRackId = searchParams.get("rack_id");
  const querySlot   = searchParams.get("rack_position") || searchParams.get("slot");
  const navigate    = useNavigate();

  const [buildings, setBuildings] = useState([]);
  const [racksList, setRacksList] = useState([]);
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
        const [bRes, rkRes] = await Promise.all([
          buildingService.getAll(),
          buildingService.getAllRacks().catch(() => ({ data: [] })),
        ]);
        setBuildings(bRes.data || []);
        setRacksList(rkRes.data || []);

        if (isEditing) {
          const dRes = await deviceService.getOne(id);
          const d = dRes.data;
          setForm({
            rack_id: d.rack_id ? String(d.rack_id) : "",
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
    if (!form.name.trim()) {
      toast.error("Nama perangkat wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) {
          fd.append(k, v);
        } else {
          fd.append(k, "");
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

  const applyTemplate = (tpl) => {
    setForm(f => ({
      ...f,
      name: tpl.name,
      type: tpl.type,
      vendor: tpl.vendor,
      model: tpl.model,
      rack_units: tpl.units,
    }));
    toast.success(`Template ${tpl.name} diterapkan.`);
  };

  const allRacks = racksList.length > 0
    ? racksList.map(rk => {
        const bName = rk.room?.floor?.building?.name ?? "Gedung";
        const fName = rk.room?.floor?.name ?? "Lantai";
        const rName = rk.room?.name ?? "Ruang";
        return {
          ...rk,
          fullLabel: `${bName} › ${fName} › ${rName} › ${rk.name} (${rk.total_u ?? 42}U)`
        };
      })
    : buildings.flatMap(b =>
        (b.floors ?? []).flatMap(f =>
          (f.rooms ?? []).flatMap(r =>
            (r.racks ?? []).map(rk => ({
              ...rk,
              fullLabel: `${b.name} › ${f.name} › ${r.name} › ${rk.name} (${rk.total_u ?? 42}U)`
            }))
          )
        )
      );

  const selectedRackObj = allRacks.find(r => String(r.id) === String(form.rack_id));
  const selectedTypeObj = DEVICE_TYPES.find(t => t.value === form.type) || DEVICE_TYPES[0];
  const TypeIcon = selectedTypeObj.icon;

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
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg hover:shadow-slate-800/50 cursor-pointer"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {isEditing ? "Mode Edit Perangkat" : "Registrasi Perangkat Baru"}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">Integrasi Digital Twin & Topologi NOC</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                {isEditing ? `Edit Konfigurasi: ${form.name}` : "Pendaftaran Perangkat IT / Server Baru"}
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Petakan perangkat fisik ke dalam rack server cabinet, atur alamat IP jaringan, tipe hardware, dan pelacakan siklus hidup garansi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/assets")}
              className="px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
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

      {/* Main Grid: Form Inputs (7 Cols) & Live Blade Mockup Preview (5 Cols) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Lokasi Spasial & Rack Cabinet */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <MapPin size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">1. Lokasi Spasial & Rack Cabinet</h2>
                <p className="text-xs text-slate-400 mt-0.5">Tentukan cabinet pusat data dan posisi slot U unit tempat perangkat dipasang</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Rack Select */}
              <div>
                <label className="form-label">
                  <span>Rack Server Penempatan</span>
                  <span className="text-[11px] font-semibold text-slate-500">(Opsional / Standalone)</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box">
                    <Server size={20} />
                  </div>
                  <select 
                    value={form.rack_id} 
                    onChange={e => setForm({ ...form, rack_id: e.target.value })}
                    className="select-control"
                  >
                    <option value="">-- Perangkat Standalone / Tanpa Rack Cabinet --</option>
                    {allRacks.map(rk => (
                      <option key={rk.id} value={rk.id}>
                        {rk.fullLabel}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedRackObj && (
                  <div className="flex items-center gap-2 mt-2.5">
                    <CheckCircle2 size={14} className="text-blue-400" />
                    <span className="text-xs text-blue-400 font-semibold">
                      Terpilih: {selectedRackObj.fullLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Slot Position & Rack Units */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">
                    <span>Posisi Slot Rack (Nomor U Bawah)</span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box">
                      <Layers size={20} />
                    </div>
                    <input 
                      type="number" 
                      min={1} 
                      max={60}
                      value={form.rack_position} 
                      placeholder="Contoh: 14 (Slot U14)"
                      onChange={e => setForm({ ...form, rack_position: e.target.value })}
                      className="input-control font-mono" 
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    <span>Tinggi Unit (Slot U) <span className="text-blue-400">*</span></span>
                    <span className="text-[11px] font-bold text-blue-400">{form.rack_units}U Tinggi</span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box">
                      <Hash size={20} />
                    </div>
                    <input 
                      type="number" 
                      min={1} 
                      max={12} 
                      required 
                      value={form.rack_units}
                      onChange={e => setForm({ ...form, rack_units: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="input-control font-mono font-bold" 
                    />
                  </div>
                  {/* Quick Unit Presets */}
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 4].map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setForm({ ...form, rack_units: u })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          Number(form.rack_units) === u
                            ? "bg-blue-600 text-white border-blue-400 shadow-md"
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
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <HardDrive size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">2. Spesifikasi & Identitas Hardware</h2>
                <p className="text-xs text-slate-400 mt-0.5">Nama perangkat, tipe hardware, vendor fabricator, dan tipe seri model</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Quick Template Picker */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Zap size={13} className="text-amber-400" />
                  Template Spesifikasi Cepat:
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEVICE_TEMPLATES.map(tpl => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-blue-300 hover:border-blue-500/50 transition-all cursor-pointer"
                    >
                      ⚡ {tpl.model} ({tpl.type.toUpperCase()})
                    </button>
                  ))}
                </div>
              </div>

              {/* Device Name */}
              <div>
                <label className="form-label">
                  <span>Nama Perangkat Hardware <span className="text-blue-400">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">Wajib Diisi</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box">
                    <TypeIcon size={20} />
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={form.name}
                    placeholder="Contoh: Core Switch NOC Main Nexus-01"
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-control" 
                  />
                </div>
              </div>

              {/* Device Type Cards */}
              <div>
                <label className="form-label">
                  <span>Tipe Hardware Perangkat <span className="text-blue-400">*</span></span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DEVICE_TYPES.map(t => {
                    const IconComp = t.icon;
                    const isSelected = form.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm({ ...form, type: t.value })}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/25 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] text-white"
                            : "bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <div className={isSelected ? "text-indigo-300" : "text-slate-500"}>
                          <IconComp size={18} />
                        </div>
                        <span className="text-xs font-bold capitalize leading-snug">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vendor & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">
                    <span>Vendor / Pabrikan</span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box">
                      <Package size={20} />
                    </div>
                    <input 
                      type="text" 
                      value={form.vendor} 
                      placeholder="Contoh: Cisco / Dell / Mikrotik / Fortinet"
                      onChange={e => setForm({ ...form, vendor: e.target.value })}
                      className="input-control" 
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    <span>Model / Seri Perangkat</span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box">
                      <Cpu size={20} />
                    </div>
                    <input 
                      type="text" 
                      value={form.model} 
                      placeholder="Contoh: Catalyst 9500 / PowerEdge R750"
                      onChange={e => setForm({ ...form, model: e.target.value })}
                      className="input-control" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Jaringan & Serial Pabrik */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Network size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">3. Konfigurasi Jaringan & Serial Pabrik</h2>
                <p className="text-xs text-slate-400 mt-0.5">Alamat IP IPv4 untuk monitoring, MAC Address fisik, dan Serial Number</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="form-label"><span>Alamat IP (IPv4)</span></label>
                <div className="input-group">
                  <div className="input-icon-box text-emerald-400">
                    <Globe size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={form.ip_address} 
                    placeholder="192.168.10.1"
                    onChange={e => setForm({ ...form, ip_address: e.target.value })}
                    className="input-control font-mono" 
                  />
                </div>
              </div>

              <div>
                <label className="form-label"><span>MAC Address</span></label>
                <div className="input-group">
                  <div className="input-icon-box text-indigo-400">
                    <Network size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={form.mac_address} 
                    placeholder="00:1A:2B:3C:4D:5E"
                    onChange={e => setForm({ ...form, mac_address: e.target.value })}
                    className="input-control font-mono" 
                  />
                </div>
              </div>

              <div>
                <label className="form-label"><span>Nomor Seri (S/N)</span></label>
                <div className="input-group">
                  <div className="input-icon-box text-blue-400">
                    <Hash size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={form.serial_number} 
                    placeholder="SN-9821-XCA-001"
                    onChange={e => setForm({ ...form, serial_number: e.target.value })}
                    className="input-control font-mono" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Status Operasional & Garansi */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">4. Status Operasional & Siklus Hidup Garansi</h2>
                <p className="text-xs text-slate-400 mt-0.5">Status operasional perangkat telemetri dan masa garansi resmi pabrik</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Operational Status */}
              <div>
                <label className="form-label">
                  <span>Status Operasional Perangkat</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DEVICE_STATUSES.map(s => {
                    const isSelected = form.status === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setForm({ ...form, status: s.value })}
                        className={`p-3.5 rounded-2xl border text-center font-bold text-xs capitalize transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                            : "bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Purchase & Warranty Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="form-label"><span>Tanggal Pengadaan / Pembelian</span></label>
                  <div className="input-group">
                    <div className="input-icon-box text-blue-400">
                      <Calendar size={18} />
                    </div>
                    <input 
                      type="date" 
                      value={form.purchase_date}
                      onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                      className="input-control" 
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label"><span>Batas Akhir Masa Garansi</span></label>
                  <div className="input-group">
                    <div className="input-icon-box text-amber-400">
                      <ShieldCheck size={18} />
                    </div>
                    <input 
                      type="date" 
                      value={form.warranty_expiry}
                      onChange={e => setForm({ ...form, warranty_expiry: e.target.value })}
                      className="input-control" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => navigate("/assets")}
                className="w-full sm:w-1/3 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all shadow-md cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-black shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Save size={18} />
                <span>{saving ? "Menyimpan Perangkat..." : (isEditing ? "Simpan Perubahan Aset" : "Daftarkan Perangkat Baru")}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Live Hardware Blade Mockup Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Live Preview Perangkat Hardware</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Unit {form.rack_units || 1}U
              </span>
            </div>

            {/* Hardware Mockup Card */}
            <div className="glass rounded-3xl p-7 border border-blue-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
                  <TypeIcon size={28} />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold capitalize bg-slate-900 border border-slate-700">
                  <span className={`w-2 h-2 rounded-full ${
                    form.status === "active" ? "bg-emerald-400 animate-pulse" :
                    form.status === "down" ? "bg-rose-500 animate-ping" :
                    form.status === "maintenance" ? "bg-amber-400" : "bg-slate-500"
                  }`} />
                  <span className="text-slate-200">{form.status}</span>
                </div>
              </div>

              <div className="relative z-10">
                <h4 className="font-extrabold text-slate-100 text-lg leading-snug">
                  {form.name || "Nama Perangkat IT"}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {form.vendor || "Vendor"} {form.model || "Model / Seri"}
                </p>
              </div>

              {/* Specs Pills */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs relative z-10">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 font-medium">Alamat IP</span>
                  <span className="font-mono text-blue-400 font-bold">{form.ip_address || "Belum Ditetapkan"}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 font-medium">Rack Cabinet</span>
                  <span className="text-slate-200 font-semibold truncate max-w-[200px]">
                    {selectedRackObj?.name ?? (form.rack_id ? `Rack #${form.rack_id}` : "Standalone (Tanpa Rack)")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 font-medium">Posisi Slot U</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {form.rack_position ? `Slot U${form.rack_position}` : "Posisi Otomatis"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs relative z-10">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Sinkronisasi Telemetri
                </span>
                <span className="text-blue-400 font-bold">Topologi 3D Ready</span>
              </div>
            </div>

            {/* Guidance Callout */}
            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 space-y-2 leading-relaxed shadow-lg">
              <p className="font-bold flex items-center gap-1.5 text-indigo-200">
                <Compass size={16} /> Integrasi Otomatis:
              </p>
              <p className="text-slate-300">
                Perangkat ini akan otomatis dipetakan ke dalam kanvas <strong>Peta Jaringan Topologi 3D</strong> dan slot visualizer kabinet 42U pada <strong>Digital Twin</strong>.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
