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
  const [viewMode, setViewMode]            = useState(() => localStorage.getItem("infraverse_asset_view_mode") || "grid");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleting, setDeleting]            = useState(null);

  // Debounce search input to prevent lag
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // View mode persistence
  const changeViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("infraverse_asset_view_mode", mode);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await deviceService.getAll({
        search: debouncedSearch,
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

  // When building filter changes, load racks of that building
  useEffect(() => {
    setFilterRack("");
    setRacks([]);
    if (!filterBuilding) return;
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

  useEffect(() => { load(); }, [debouncedSearch, filterType, filterStatus, filterBuilding, filterRack]);

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
        <button 
          id="btn-add-asset"
          onClick={() => navigate("/assets/create")}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all cursor-pointer"
        >
          <Plus size={18} /> Tambah Perangkat Baru
        </button>
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
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => changeViewMode("grid")}
            className={`px-3.5 py-2 rounded-lg text-xs transition-all flex items-center gap-2 font-bold ${
              viewMode === "grid" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid size={15} /> Mode Kartu
          </button>
          <button
            onClick={() => changeViewMode("table")}
            className={`px-3.5 py-2 rounded-lg text-xs transition-all flex items-center gap-2 font-bold ${
              viewMode === "table" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <List size={15} /> Mode Tabel
          </button>
        </div>
      </div>

      {/* Main Asset Display */}
      {loading ? <SkeletonTable rows={6} /> : devices.length === 0 ? (
        <EmptyState icon={<Server size={40} className="text-blue-400" />}
          title="Tidak Ada Perangkat Ditemukan" description="Coba ubah kata kunci pencarian atau filter yang dipilih."
          action={canWrite ? { label:"Tambah Perangkat Baru", onClick: () => navigate("/assets/create") } : null} />
      ) : viewMode === "grid" ? (
        
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {devices.map((d, idx) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => navigate(`/assets/${d.id}`)}
              className="glass rounded-3xl p-6 border border-slate-700/60 hover:border-blue-500/50 shadow-[0_10px_35px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_45px_rgba(59,130,246,0.15)] transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-md">
                    {TYPE_ICON[d.type] ?? <Package size={20} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    {canWrite && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/assets/${d.id}/edit`)} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleting(d)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 shadow">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Device Title */}
                <h3 className="font-extrabold text-slate-100 text-lg group-hover:text-blue-300 transition-colors leading-snug">{d.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1 font-semibold">{d.vendor ?? ""} {d.model ?? ""}</p>

                {/* Info Pills */}
                <div className="mt-5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90">
                    <span className="text-slate-400 text-xs uppercase font-bold">IP Address</span>
                    <span className="font-mono text-blue-400 font-bold text-sm">{d.ip_address ?? "Static Direct"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90">
                    <span className="text-slate-400 text-xs uppercase font-bold">Lokasi Rack</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[180px]">
                      {d.rack?.room?.floor?.building?.name ? `${d.rack?.room?.floor?.building?.name} › ${d.rack?.name}` : "Standalone Device"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className={d.is_under_warranty ? "text-emerald-400" : "text-slate-500"} />
                  <span className={`text-xs font-bold ${d.is_under_warranty ? "text-emerald-400" : "text-slate-400"}`}>
                    {d.warranty_expiry ? (d.is_under_warranty ? "Garansi Aktif" : "Garansi Habis") : "Tanpa Garansi"}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Detail <ChevronRight size={14} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (

        /* TABLE VIEW */
        <div className="glass-strong rounded-3xl border border-slate-700/60 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase tracking-wider text-xs font-black">
                  <th className="px-6 py-4.5">Perangkat Hardware</th>
                  <th className="px-6 py-4.5">IP Address</th>
                  <th className="px-6 py-4.5">Lokasi Spasial</th>
                  <th className="px-6 py-4.5">Status Operasional</th>
                  <th className="px-6 py-4.5">Masa Garansi</th>
                  {canWrite && <th className="px-6 py-4.5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {devices.map((d) => (
                  <tr key={d.id}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/assets/${d.id}`)}>
                    
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 shadow">
                          {TYPE_ICON[d.type] ?? <Package size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 text-sm group-hover:text-blue-300 transition-colors">{d.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{d.vendor} {d.model}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4.5 font-mono text-blue-400 font-bold text-sm">{d.ip_address ?? "-"}</td>

                    <td className="px-6 py-4.5">
                      <p className="text-slate-200 font-semibold">{d.rack?.room?.floor?.building?.name ?? "-"}</p>
                      <p className="text-xs text-slate-400 font-medium">{d.rack?.name ?? "Tidak di rack"}</p>
                    </td>

                    <td className="px-6 py-4.5"><StatusBadge status={d.status} /></td>

                    <td className="px-6 py-4.5">
                      {d.warranty_expiry ? (
                        <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                          d.is_under_warranty ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}>
                          {d.is_under_warranty ? "Garansi Aktif" : "Garansi Habis"}
                        </span>
                      ) : <span className="text-slate-500 font-bold">-</span>}
                    </td>

                    {canWrite && (
                      <td className="px-6 py-4.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => navigate(`/assets/${d.id}/edit`)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleting(d)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all shadow">
                            <Trash2 size={14} />
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
