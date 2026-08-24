import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { Plus, Server, ArrowLeft, Layers, DoorOpen, HardDrive, Cpu, ShieldAlert, Activity, ChevronRight, Zap, CheckCircle2, AlertTriangle, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BuildingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite  = user?.role === "admin" || user?.role === "teknisi";

  const [building, setBuilding]       = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);
  const [activeRoom, setActiveRoom]   = useState(null);
  const [activeRack, setActiveRack]   = useState(null);
  const [loading, setLoading]         = useState(true);
  
  const [floorModal, setFloorModal]   = useState(false);
  const [roomModal, setRoomModal]     = useState(false);
  const [rackModal, setRackModal]     = useState(false);
  const [floorForm, setFloorForm]     = useState({ name:"", floor_number:"" });
  const [roomForm, setRoomForm]       = useState({ name:"", type:"server_room" });
  const [rackForm, setRackForm]       = useState({ name:"", position:"", total_u:42 });
  const [saving, setSaving]           = useState(false);

  const load = async () => {
    try {
      const res = await buildingService.getOne(id);
      setBuilding(res.data);
      if (res.data.floors?.length > 0) {
        const f0 = res.data.floors[0];
        setActiveFloor(f0);
        if (f0.rooms?.length > 0) {
          const r0 = f0.rooms[0];
          setActiveRoom(r0);
          if (r0.racks?.length > 0) {
            setActiveRack(r0.racks[0]);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const floors = building?.floors ?? [];
  const rooms  = activeFloor?.rooms ?? [];
  const racks  = activeRoom?.racks  ?? [];
  const roomTypes = ["server_room","office","classroom","lab","storage","other"];

  const handleSelectFloor = (f) => {
    setActiveFloor(f);
    if (f.rooms?.length > 0) {
      setActiveRoom(f.rooms[0]);
      if (f.rooms[0].racks?.length > 0) {
        setActiveRack(f.rooms[0].racks[0]);
      } else {
        setActiveRack(null);
      }
    } else {
      setActiveRoom(null);
      setActiveRack(null);
    }
  };

  const handleSelectRoom = (r) => {
    setActiveRoom(r);
    if (r.racks?.length > 0) {
      setActiveRack(r.racks[0]);
    } else {
      setActiveRack(null);
    }
  };

  const saveFloor = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await buildingService.createFloor(id, { ...floorForm, building_id: id });
      setFloorModal(false); load();
    } finally { setSaving(false); }
  };
  const saveRoom = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await buildingService.createRoom(activeFloor.id, { ...roomForm, floor_id: activeFloor.id });
      setRoomModal(false); load();
    } finally { setSaving(false); }
  };
  const saveRack = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await buildingService.createRack(activeRoom.id, { ...rackForm, room_id: activeRoom.id });
      setRackModal(false); load();
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Memuat Struktur Spasial Gedung...</p>
      </div>
    </div>
  );

  if (!building) return <div className="p-8 text-red-400">Gedung tidak ditemukan.</div>;

  // Calculate Rack U stats
  const totalU = activeRack?.total_u ?? 42;
  const rackDevices = activeRack?.devices ?? [];
  const usedU = rackDevices.reduce((sum, d) => sum + (d.rack_units ?? 1), 0);
  const usedPercent = Math.min(100, Math.round((usedU / totalU) * 100));

  // Generate slot map U1..U42
  const rackSlotMap = {};
  rackDevices.forEach(dev => {
    const pos = dev.rack_position ?? 1;
    rackSlotMap[pos] = dev;
  });

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb items={[
        { label:"Dashboard", href:"/dashboard" },
        { label:"Gedung", href:"/buildings" },
        { label: building.name },
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 glass p-6 rounded-2xl border border-slate-700/60">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/buildings")}
            className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-100">{building.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {building.total_floors} Lantai
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{building.location ?? "Kampus Utama"}</span>
              <span>•</span>
              <span className="text-slate-300">{floors.length} Lantai Donfigurasikan</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/assets`)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-all flex items-center gap-2">
            <HardDrive size={14} className="text-blue-400" /> Semua Perangkat
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout: Floors -> Rooms -> Rack 42U Visualizer */}
      <div className="grid grid-cols-12 gap-6">

        {/* 1. LANTAI (3-cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
              <Layers size={14} className="text-blue-400" />
              <span>Daftar Lantai</span>
            </div>
            {canWrite && (
              <button onClick={() => navigate(`/buildings/${id}/floors/create`)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all">
                <Plus size={14} /> + Lantai
              </button>
            )}
          </div>

          <div className="space-y-2">
            {floors.map((f) => {
              const isActive = activeFloor?.id === f.id;
              const roomCount = f.rooms?.length ?? 0;
              return (
                <button
                  key={f.id}
                  onClick={() => handleSelectFloor(f)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 border-blue-400 text-white shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                      : "glass border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  <div>
                    <p className={`font-bold text-xs ${isActive ? "text-white" : "text-slate-200 group-hover:text-blue-300"}`}>
                      {f.name}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isActive ? "text-blue-100 opacity-90" : "text-slate-400"}`}>
                      {roomCount} Ruangan Terkonfigurasi
                    </p>
                  </div>
                  <ChevronRight size={14} className={isActive ? "text-white" : "text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"} />
                </button>
              );
            })}

            {floors.length === 0 && (
              <div className="p-6 glass rounded-2xl border border-slate-800 text-center">
                <p className="text-xs text-slate-400 mb-2">Belum ada data lantai.</p>
                {canWrite && (
                  <button onClick={() => navigate(`/buildings/${id}/floors/create`)} className="text-xs font-bold text-blue-400 hover:underline">
                    + Tambah Lantai 1
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. RUANGAN (3-cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
              <DoorOpen size={14} className="text-indigo-400" />
              <span>Ruangan {activeFloor ? `(${activeFloor.name})` : ""}</span>
            </div>
            {canWrite && activeFloor && (
              <button onClick={() => navigate(`/buildings/${id}/rooms/create?floor_id=${activeFloor.id}`)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all">
                <Plus size={14} /> + Ruang
              </button>
            )}
          </div>

          <div className="space-y-2">
            {rooms.map((r) => {
              const isActive = activeRoom?.id === r.id;
              const rackCount = r.racks?.length ?? 0;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRoom(r)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600/90 to-purple-600/90 border-indigo-400 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
                      : "glass border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  <div>
                    <p className={`font-bold text-xs ${isActive ? "text-white" : "text-slate-200 group-hover:text-indigo-300"}`}>
                      {r.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-semibold capitalize ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-indigo-300 border border-slate-700"
                      }`}>
                        {r.type.replace("_"," ")}
                      </span>
                      <span className={`text-[10px] ${isActive ? "text-indigo-100 opacity-90" : "text-slate-400"}`}>
                        {rackCount} Rack
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className={isActive ? "text-white" : "text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"} />
                </button>
              );
            })}

            {rooms.length === 0 && (
              <div className="p-6 glass rounded-2xl border border-slate-800 text-center">
                <p className="text-xs text-slate-400 mb-1">
                  {activeFloor ? "Belum ada ruangan di lantai ini." : "Pilih lantai terlebih dahulu."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. VISUAL RACK 42U INSPECTOR (6-cols) */}
        <div className="col-span-12 lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
              <Server size={14} className="text-emerald-400" />
              <span>Rack Server 42U Visualizer</span>
            </div>
            {canWrite && activeRoom && (
              <button onClick={() => navigate(`/buildings/${id}/racks/create?room_id=${activeRoom.id}`)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all">
                <Plus size={14} /> + Tambah Rack
              </button>
            )}
          </div>

          {/* Racks Selector Pills */}
          {racks.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {racks.map(rk => (
                <button
                  key={rk.id}
                  onClick={() => setActiveRack(rk)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    activeRack?.id === rk.id
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  🖥️ {rk.name} ({rk.position ?? "Posisi -"})
                </button>
              ))}
            </div>
          )}

          {/* 42U Rack Slot Visualizer Box */}
          <div className="glass-strong rounded-2xl border border-slate-700/60 p-5 space-y-4 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
            {activeRack ? (
              <>
                {/* Rack Capacity Meter Bar */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {activeRack.name} — Status Kapasitas U Slot
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {usedU} / {totalU} U Terpakai ({usedPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                </div>

                {/* 42U Physical Rack Slots Cabinet */}
                <div className="bg-slate-950 rounded-xl p-3 border-2 border-slate-800 relative max-h-[460px] overflow-y-auto space-y-1.5 shadow-inner">
                  
                  {/* Top Rack Fan Header */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <span>⚡ POWER DISTRIBUTOR (PDU A/B)</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> 220V ONLINE
                    </span>
                  </div>

                  {/* Physical U Slots (From U42 Down to U1) */}
                  <div className="space-y-1 font-mono">
                    {Array.from({ length: totalU }).map((_, idx) => {
                      const uNum = totalU - idx; // 42 down to 1
                      const device = rackSlotMap[uNum];

                      if (device) {
                        const units = device.rack_units ?? 1;
                        const statusColor = device.status === "active" ? "#22c55e" : device.status === "down" ? "#ef4444" : "#eab308";
                        
                        return (
                          <div
                            key={uNum}
                            onClick={() => navigate(`/assets`)}
                            className="group relative cursor-pointer p-2 rounded-lg bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 hover:border-blue-400 transition-all shadow-md flex items-center justify-between"
                            style={{ minHeight: `${units * 36}px` }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                U{uNum}
                              </span>
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                              <div>
                                <p className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors flex items-center gap-2">
                                  {device.name}
                                  <span className="text-[9px] font-normal px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 capitalize">
                                    {device.type}
                                  </span>
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  IP: {device.ip_address ?? "-"} | Model: {device.vendor ?? ""} {device.model ?? ""}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                              Detail &rarr;
                            </span>
                          </div>
                        );
                      }

                      // Empty Slot Render
                      return (
                        <div
                          key={uNum}
                          className="px-2 py-1.5 rounded-md border border-dashed border-slate-800/80 hover:border-slate-700 text-[10px] text-slate-600 flex items-center justify-between bg-slate-950/40"
                        >
                          <span className="font-bold text-slate-700">U{uNum}</span>
                          <span className="text-[9px] text-slate-800 tracking-widest uppercase">EMPTY SLOT</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Server size={32} className="mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">Pilih Ruangan & Rack di kolom sebelah kiri.</p>
                <p className="text-[11px] text-slate-600">Visualizer slot U42 akan langsung memvisualisasikan posisi server fisik.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modals */}
      {floorModal && (
        <Modal 
          title="Tambah Lantai Baru" 
          subtitle={`Daftarkan lantai spasial di ${building.name}`}
          maxWidth="max-w-lg"
          onClose={() => setFloorModal(false)}
        >
          <form onSubmit={saveFloor} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Nama / Label Lantai <span className="text-blue-400">*</span>
              </label>
              <input required value={floorForm.name}
                placeholder="Misal: Lantai 1 — Lobby & NOC Main Room"
                onChange={e => setFloorForm({...floorForm, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Nomor Urut Lantai <span className="text-blue-400">*</span>
              </label>
              <input type="number" required value={floorForm.floor_number}
                placeholder="1"
                onChange={e => setFloorForm({...floorForm, floor_number: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all" />
            </div>

            <div className="flex gap-4 pt-3">
              <button type="button" onClick={() => setFloorModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? "Menyimpan Lantai..." : "Simpan Lantai"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {roomModal && (
        <Modal 
          title="Tambah Ruangan Baru" 
          subtitle={`Tambahkan unit ruangan di ${activeFloor?.name}`}
          maxWidth="max-w-lg"
          onClose={() => setRoomModal(false)}
        >
          <form onSubmit={saveRoom} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Nama Ruangan <span className="text-blue-400">*</span>
              </label>
              <input required value={roomForm.name}
                placeholder="Misal: Server Room NOC A"
                onChange={e => setRoomForm({...roomForm, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Tipe / Peruntukan Ruangan <span className="text-blue-400">*</span>
              </label>
              <select value={roomForm.type}
                onChange={e => setRoomForm({...roomForm, type: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all capitalize">
                {roomTypes.map(t => (
                  <option key={t} value={t}>{t.replace("_"," ")}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 pt-3">
              <button type="button" onClick={() => setRoomModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? "Menyimpan Ruangan..." : "Simpan Ruangan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {rackModal && (
        <Modal 
          title="Tambah Rack Server Baru" 
          subtitle={`Tambahkan rack cabinet fisik di ${activeRoom?.name}`}
          maxWidth="max-w-lg"
          onClose={() => setRackModal(false)}
        >
          <form onSubmit={saveRack} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Kode / Nama Rack Cabinet <span className="text-blue-400">*</span>
              </label>
              <input required value={rackForm.name}
                placeholder="Misal: NOC-RACK-01"
                onChange={e => setRackForm({...rackForm, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Posisi Grid / Baris
                </label>
                <input value={rackForm.position}
                  placeholder="Misal: Row A - Slot 1"
                  onChange={e => setRackForm({...rackForm, position: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Kapasitas Slot (Total U)
                </label>
                <input type="number" min={1} value={rackForm.total_u}
                  onChange={e => setRackForm({...rackForm, total_u: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>

            {/* Quick capacity preset buttons */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-2">Preset Ukuran Rack Standar:</label>
              <div className="flex gap-2">
                {[12, 24, 42].map(u => (
                  <button key={u} type="button"
                    onClick={() => setRackForm({...rackForm, total_u: u})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      Number(rackForm.total_u) === u
                        ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        : "bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800"
                    }`}>
                    {u} Unit (U)
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-3">
              <button type="button" onClick={() => setRackModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? "Menyimpan Rack..." : "Simpan Rack Cabinet"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
