import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deviceService } from "../../services/deviceService";
import { buildingService } from "../../services/buildingService";
import useAuthStore from "../../stores/authStore";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonTable } from "../../components/shared/Skeleton.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import {
  Router, Shield, Network, Server, Wifi,
  Battery, Package, Search, Plus, Edit2, Trash2,
  LayoutGrid, List, HardDrive, MapPin, Building2, ChevronRight, ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

const DEVICE_TYPES    = ["router","switch","firewall","server","access_point","ups","other"];
const DEVICE_STATUSES = ["active","inactive","maintenance","down"];

const TYPE_ICON = {
  router:       <Router size={16} />,
  switch:       <Network size={16} />,
  firewall:     <Shield size={16} />,
  server:       <Server size={16} />,
  access_point: <Wifi size={16} />,
  ups:          <Battery size={16} />,
  other:        <Package size={16} />,
};

export default function AssetsPage() {
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";
  const navigate = useNavigate();

  const [devices, setDevices]             = useState([]);
  const [buildings, setBuildings]          = useState([]);
  const [racks, setRacks]                  = useState([]);
  const [loading, setLoading]              = useState(true);
  const [search, setSearch]                = useState("");
  const [filterType, setFilterType]        = useState("");
  const [filterStatus, setFilterStatus]    = useState("");
  const [filterBuilding, setFilterBuilding]= useState("");
  const [filterRack, setFilterRack]        = useState("");
  const [viewMode, setViewMode]            = useState("grid");
  const [showForm, setShowForm]            = useState(false);
  const [editing, setEditing]              = useState(null);
  const [deleting, setDeleting]            = useState(null);
  const [saving, setSaving]                = useState(false);
  const [error, setError]                  = useState("");

  const emptyForm = {
    rack_id:"", name:"", type:"router", vendor:"", model:"", serial_number:"",
    ip_address:"", mac_address:"", status:"active", purchase_date:"",
    warranty_expiry:"", rack_position:"", rack_units:1,
  };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await deviceService.getAll({
        search,
        type: filterType,
        status: filterStatus,
        building_id: filterBuilding,
        rack_id: filterRack,
      });
      setDevices(res.data);
    } finally { setLoading(false); }
  };

  // Load buildings on mount for filter dropdown
  useEffect(() => {
    buildingService.getAll().then(res => setBuildings(res.data)).catch(() => {});
  }, []);

  // When building filter changes, load racks of that building from device list
  useEffect(() => {
    setFilterRack("");
    setRacks([]);
    if (!filterBuilding) return;
    // Collect racks from already-loaded devices or fetch fresh
    buildingService.getOne(filterBuilding).then(res => {
      const building = res.data;
      const allRacks = (building.floors ?? []).flatMap(f =>
        (f.rooms ?? []).flatMap(r =>
          (r.racks ?? []).map(rk => ({
            ...rk,
            label: `${rk.name} — ${r.name} (${f.name})`,
          }))
        )
      );
      setRacks(allRacks);
    }).catch(() => {});
  }, [filterBuilding]);

  useEffect(() => { load(); }, [search, filterType, filterStatus, filterBuilding, filterRack]);


  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(""); setShowForm(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      rack_id: d.rack_id ?? "", name: d.name, type: d.type, vendor: d.vendor ?? "",
      model: d.model ?? "", serial_number: d.serial_number ?? "", ip_address: d.ip_address ?? "",
      mac_address: d.mac_address ?? "", status: d.status,
      purchase_date: d.purchase_date?.substring(0,10) ?? "",
      warranty_expiry: d.warranty_expiry?.substring(0,10) ?? "",
      rack_position: d.rack_position ?? "", rack_units: d.rack_units ?? 1,
    });
    setError(""); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
      if (editing) await deviceService.update(editing.id, fd);
      else await deviceService.create(fd);
      setShowForm(false); load();
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(" ") : (err.response?.data?.message ?? "Terjadi kesalahan."));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await deviceService.remove(deleting.id);
    setDeleting(null); load();
  };

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Katalog Aset Digital" }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100">
            Katalog Aset Perangkat IT
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {devices.length} Perangkat Terdaftar & Dipantau Real-Time
          </p>
        </div>
        {canWrite && (
          <button onClick={() => navigate("/assets/create")}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all">
            <Plus size={18} /> Tambah Perangkat Baru
          </button>
        )}
      </div>

      {/* Filter Bar + Grid/Table Toggle */}
      <div className="glass p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari nama, IP, vendor, serial..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-900/80 border border-slate-700/70 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-all" />
          </div>

          {/* Type Filter */}
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3.5 py-2 bg-slate-900/80 border border-slate-700/70 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition-all">
            <option value="">Semua Tipe Hardware</option>
            {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
          </select>

          {/* Status Filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3.5 py-2 bg-slate-900/80 border border-slate-700/70 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition-all">
            <option value="">Semua Status</option>
            {DEVICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Building Filter */}
          <select value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}
            className="px-3.5 py-2 bg-slate-900/80 border border-slate-700/70 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all">
            <option value="">Semua Gedung</option>
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Rack Filter (only shows when building is selected) */}
          {filterBuilding && (
            <select value={filterRack} onChange={e => setFilterRack(e.target.value)}
              className="px-3.5 py-2 bg-slate-900/80 border border-indigo-500/50 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-400 transition-all">
              <option value="">Semua Rack</option>
              {racks.map(rk => <option key={rk.id} value={rk.id}>{rk.label}</option>)}
            </select>
          )}
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg text-xs transition-all flex items-center gap-1.5 font-bold ${
              viewMode === "grid" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid size={14} /> Kartu Grid
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg text-xs transition-all flex items-center gap-1.5 font-bold ${
              viewMode === "table" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <List size={14} /> Tabel
          </button>
        </div>
      </div>

      {/* Main Asset Display */}
      {loading ? <SkeletonTable rows={6} /> : devices.length === 0 ? (
        <EmptyState icon={<Server size={40} className="text-blue-400" />}
          title="Tidak Ada Perangkat Ditemukan" description="Coba ubah kata kunci pencarian atau filter yang dipilih."
          action={canWrite ? { label:"Tambah Perangkat Baru", onClick: openAdd } : null} />
      ) : viewMode === "grid" ? (
        
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {devices.map((d, idx) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => navigate(`/assets/${d.id}`)}
              className="glass rounded-2xl p-5 border border-slate-700/60 hover:border-blue-500/50 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)] transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    {TYPE_ICON[d.type] ?? <Package size={18} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    {canWrite && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setDeleting(d)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Device Title */}
                <h3 className="font-bold text-slate-100 text-base group-hover:text-blue-300 transition-colors leading-snug">{d.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{d.vendor ?? ""} {d.model ?? ""}</p>

                {/* Info Pills */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">IP Address</span>
                    <span className="font-mono text-blue-400 font-bold">{d.ip_address ?? "Static Direct"}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Lokasi Rack</span>
                    <span className="text-slate-300 font-medium truncate max-w-[160px]">
                      {d.rack?.room?.floor?.building?.name ? `${d.rack?.room?.floor?.building?.name} › ${d.rack?.name}` : "Standalone Device"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Warranty Health Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className={d.is_under_warranty ? "text-emerald-400" : "text-slate-500"} />
                  <span className={`text-[11px] font-bold ${d.is_under_warranty ? "text-emerald-400" : "text-slate-500"}`}>
                    {d.warranty_expiry ? (d.is_under_warranty ? "Garansi Aktif" : "Garansi Habis") : "Tanpa Garansi"}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                  Detail &rarr;
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (

        /* TABLE VIEW */
        <div className="glass-strong rounded-2xl border border-slate-700/60 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-4">Perangkat Hardware</th>
                  <th className="px-5 py-4">IP Address</th>
                  <th className="px-5 py-4">Lokasi Spasial</th>
                  <th className="px-5 py-4">Status Operasional</th>
                  <th className="px-5 py-4">Masa Garansi</th>
                  {canWrite && <th className="px-5 py-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {devices.map((d) => (
                  <tr key={d.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/assets/${d.id}`)}>
                    
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                          {TYPE_ICON[d.type] ?? <Package size={14} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 text-xs group-hover:text-blue-300 transition-colors">{d.name}</p>
                          <p className="text-[10px] text-slate-500">{d.vendor} {d.model}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-blue-400 font-bold">{d.ip_address ?? "-"}</td>

                    <td className="px-5 py-4">
                      <p className="text-slate-300 font-medium">{d.rack?.room?.floor?.building?.name ?? "-"}</p>
                      <p className="text-[10px] text-slate-500">{d.rack?.name ?? "Tidak di rack"}</p>
                    </td>

                    <td className="px-5 py-4"><StatusBadge status={d.status} /></td>

                    <td className="px-5 py-4">
                      {d.warranty_expiry ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          d.is_under_warranty ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {d.is_under_warranty ? "Garansi Aktif" : "Garansi Habis"}
                        </span>
                      ) : <span className="text-slate-600">-</span>}
                    </td>

                    {canWrite && (
                      <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => navigate(`/assets/${d.id}/edit`)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => setDeleting(d)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <Modal 
          title={editing ? "Edit Konfigurasi Perangkat Aset" : "Daftarkan Perangkat Aset Baru"} 
          subtitle="Masukkan informasi lokasi fisik rack, spesifikasi teknis, & data jaringan."
          maxWidth="max-w-3xl"
          onClose={() => setShowForm(false)}
        >
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs font-semibold text-red-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-h-[72vh] overflow-y-auto pr-2">
            {/* Section 1: Lokasi & Rack */}
            <div className="glass p-4 rounded-2xl border border-slate-700/60 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <MapPin size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">1. Lokasi & Penempatan Physical Server</h4>
                  <p className="text-[11px] text-slate-400">Pilih rack dan slot U tempat perangkat terpasang</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rack Server Penempatan <span className="text-blue-400">*</span></label>
                  <select required value={form.rack_id} onChange={e => setForm({...form, rack_id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium">
                    <option value="">-- Pilih Rack Penempatan --</option>
                    {racks.length > 0 ? (
                      racks.map(rk => (
                        <option key={rk.id} value={rk.id}>{rk.label ?? rk.name}</option>
                      ))
                    ) : (
                      buildings.flatMap(b => (b.floors ?? []).flatMap(f => (f.rooms ?? []).flatMap(r => (r.racks ?? []).map(rk => (
                        <option key={rk.id} value={rk.id}>{b.name} › {f.name} › {r.name} › {rk.name}</option>
                      )))))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Posisi Slot Rack (U Unit)</label>
                  <input type="number" value={form.rack_position} placeholder="Misal: 40 (Posisi U dari bawah)"
                    onChange={e => setForm({...form, rack_position: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tinggi Perangkat (Unit U)</label>
                  <input type="number" min={1} value={form.rack_units} placeholder="1"
                    onChange={e => setForm({...form, rack_units: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            </div>

            {/* Section 2: Identitas Hardware */}
            <div className="glass p-4 rounded-2xl border border-slate-700/60 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <HardDrive size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">2. Spesifikasi & Identitas Hardware</h4>
                  <p className="text-[11px] text-slate-400">Nama perangkat, merek, model, dan jenis hardware</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Perangkat <span className="text-blue-400">*</span></label>
                  <input type="text" required value={form.name}
                    placeholder="Core Switch NOC-01"
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipe Hardware <span className="text-blue-400">*</span></label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all capitalize font-medium">
                    {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vendor / Merek Fabricator</label>
                  <input type="text" value={form.vendor} placeholder="Cisco / Dell / HP / Mikrotik"
                    onChange={e => setForm({...form, vendor: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Model / Seri Perangkat</label>
                  <input type="text" value={form.model} placeholder="Catalyst 9500 / PowerEdge R740"
                    onChange={e => setForm({...form, model: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            </div>

            {/* Section 3: Network & Serial Number */}
            <div className="glass p-4 rounded-2xl border border-slate-700/60 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Network size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">3. Networking & Identifikasi Digital</h4>
                  <p className="text-[11px] text-slate-400">Pengalamatan IP, MAC Address, dan Serial Number</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">IP Address IPv4</label>
                  <input type="text" value={form.ip_address} placeholder="10.0.1.1"
                    onChange={e => setForm({...form, ip_address: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">MAC Address</label>
                  <input type="text" value={form.mac_address} placeholder="00:1B:44:11:3A:B7"
                    onChange={e => setForm({...form, mac_address: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Serial Number Hardware</label>
                  <input type="text" value={form.serial_number} placeholder="CSC-9500-001"
                    onChange={e => setForm({...form, serial_number: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            </div>

            {/* Section 4: Status & Lifecycle Garansi */}
            <div className="glass p-4 rounded-2xl border border-slate-700/60 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">4. Lifecycle & Status Operasional</h4>
                  <p className="text-[11px] text-slate-400">Status aktif perangkat dan tanggal masa berlaku garansi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Operasional</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all font-semibold capitalize">
                    {DEVICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal Pembelian</label>
                  <input type="date" value={form.purchase_date}
                    onChange={e => setForm({...form, purchase_date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Batas Expire Garansi</label>
                  <input type="date" value={form.warranty_expiry}
                    onChange={e => setForm({...form, warranty_expiry: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? "Menyimpan Perangkat..." : "Simpan Perangkat Aset"}
              </button>
            </div>
          </form>
        </Modal>
      )}


      {deleting && (
        <ConfirmDialog
          message={`Hapus perangkat "${deleting.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
