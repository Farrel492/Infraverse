import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import useAuthStore from "../../stores/authStore";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { 
  Plus, Server, ArrowLeft, Layers, DoorOpen, HardDrive, 
  Cpu, ShieldAlert, Activity, ChevronRight, Zap, CheckCircle2, 
  AlertTriangle, Wrench, Eye, Sparkles, ExternalLink 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function BuildingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";

  const [building, setBuilding]       = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);
  const [activeRoom, setActiveRoom]   = useState(null);
  const [activeRack, setActiveRack]   = useState(null);
  const [loading, setLoading]         = useState(true);

  const load = async () => {
    try {
      const res = await buildingService.getOne(id);
      setBuilding(res.data);
      if (res.data.floors?.length > 0) {
        // Keep activeFloor if already selected, or pick first
        const currentFloorId = activeFloor?.id;
        const matchedFloor = currentFloorId ? res.data.floors.find(f => f.id === currentFloorId) : res.data.floors[0];
        const selectedF = matchedFloor || res.data.floors[0];
        setActiveFloor(selectedF);

        if (selectedF.rooms?.length > 0) {
          const currentRoomId = activeRoom?.id;
          const matchedRoom = currentRoomId ? selectedF.rooms.find(r => r.id === currentRoomId) : selectedF.rooms[0];
          const selectedR = matchedRoom || selectedF.rooms[0];
          setActiveRoom(selectedR);

          if (selectedR.racks?.length > 0) {
            const currentRackId = activeRack?.id;
            const matchedRack = currentRackId ? selectedR.racks.find(rk => rk.id === currentRackId) : selectedR.racks[0];
            setActiveRack(matchedRack || selectedR.racks[0]);
          } else {
            setActiveRack(null);
          }
        } else {
          setActiveRoom(null);
          setActiveRack(null);
        }
      }
    } catch (err) {
      toast.error("Gagal memuat data inspeksi gedung.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const floors = building?.floors ?? [];
  const rooms  = activeFloor?.rooms ?? [];
  const racks  = activeRoom?.racks  ?? [];

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

  if (loading) return (
    <div className="p-12 flex items-center justify-center min-h-[65vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20" />
        <p className="text-sm text-slate-300 font-semibold">Memuat Struktur Spasial & Rack Server Gedung...</p>
      </div>
    </div>
  );

  if (!building) return <div className="p-10 text-red-400 font-bold">Gedung tidak ditemukan.</div>;

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
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Manajemen Gedung", href: "/buildings" },
        { label: `Inspeksi Spasial: ${building.name}` },
      ]} />

      {/* Top Banner */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate("/buildings")}
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Inspeksi Fasilitas Spasial
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">{building.location ?? "Kampus Utama"}</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                {building.name}
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Kelola hierarki spasial bertingkat: dari Lantai Fisik &rarr; Ruangan Server &rarr; Rak Server 42U &rarr; Slot Perangkat Hardware.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/digital-twin`)}
              className="px-5 py-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <Activity size={16} /> Buka Digital Twin 3D
            </button>
            <button 
              onClick={() => navigate(`/assets`)}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 text-xs font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <HardDrive size={16} className="text-blue-400" /> Katalog Aset Lengkap
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout: Floors (3-cols) -> Rooms (3-cols) -> Rack 42U Visualizer (6-cols) */}
      <div className="grid grid-cols-12 gap-8 items-start">

        {/* 1. LANTAI (3-cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 text-slate-200 font-bold text-xs uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Layers size={14} />
              </div>
              <span>Daftar Lantai ({floors.length})</span>
            </div>
            <button 
              id="btn-add-floor"
              onClick={() => navigate(`/buildings/${id}/floors/create`)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={14} /> + Lantai
            </button>
          </div>

          <div className="space-y-2.5">
            {floors.map((f) => {
              const isActive = activeFloor?.id === f.id;
              const roomCount = f.rooms?.length ?? 0;
              return (
                <button
                  key={f.id}
                  onClick={() => handleSelectFloor(f)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group shadow-md ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-[0_4px_25px_rgba(59,130,246,0.35)] ring-1 ring-white/20"
                      : "glass border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-blue-400 border border-slate-700"
                      }`}>
                        Tingkat {f.floor_number}
                      </span>
                      <p className={`font-bold text-sm leading-tight ${isActive ? "text-white" : "text-slate-100 group-hover:text-blue-300"}`}>
                        {f.name}
                      </p>
                    </div>
                    <p className={`text-xs ${isActive ? "text-blue-100 opacity-90" : "text-slate-400"}`}>
                      {roomCount} Ruangan Terdaftar
                    </p>
                  </div>
                  <ChevronRight size={16} className={isActive ? "text-white" : "text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"} />
                </button>
              );
            })}

            {floors.length === 0 && (
              <div className="p-8 glass rounded-3xl border border-slate-700/60 text-center space-y-3">
                <Layers size={32} className="mx-auto text-slate-500" />
                <p className="text-xs text-slate-300 font-semibold">Belum ada lantai di gedung ini.</p>
                {canWrite && (
                  <button 
                    onClick={() => navigate(`/buildings/${id}/floors/create`)} 
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 transition-all inline-block"
                  >
                    + Tambah Lantai Pertama
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. RUANGAN (3-cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 text-slate-200 font-bold text-xs uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <DoorOpen size={14} />
              </div>
              <span>Ruangan ({rooms.length})</span>
            </div>
            {activeFloor && (
              <button 
                id="btn-add-room"
                onClick={() => navigate(`/buildings/${id}/rooms/create?floor_id=${activeFloor.id}`)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} /> + Ruang
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {rooms.map((r) => {
              const isActive = activeRoom?.id === r.id;
              const rackCount = r.racks?.length ?? 0;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRoom(r)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group shadow-md ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-[0_4px_25px_rgba(16,185,129,0.35)] ring-1 ring-white/20"
                      : "glass border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="space-y-1.5">
                    <p className={`font-bold text-sm leading-tight ${isActive ? "text-white" : "text-slate-100 group-hover:text-emerald-300"}`}>
                      {r.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-emerald-300 border border-slate-700"
                      }`}>
                        {r.type.replace("_"," ")}
                      </span>
                      <span className={`text-xs ${isActive ? "text-emerald-100 opacity-90" : "text-slate-400 font-medium"}`}>
                        {rackCount} Rack Server
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className={isActive ? "text-white" : "text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"} />
                </button>
              );
            })}

            {rooms.length === 0 && (
              <div className="p-8 glass rounded-3xl border border-slate-700/60 text-center space-y-3">
                <DoorOpen size={32} className="mx-auto text-slate-500" />
                <p className="text-xs text-slate-300 font-semibold">
                  {activeFloor ? "Belum ada ruangan di lantai ini." : "Pilih lantai terlebih dahulu."}
                </p>
                {canWrite && activeFloor && (
                  <button 
                    onClick={() => navigate(`/buildings/${id}/rooms/create?floor_id=${activeFloor.id}`)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 transition-all inline-block"
                  >
                    + Tambah Ruangan Baru
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. VISUAL RACK 42U INSPECTOR (6-cols) */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-1 flex-wrap gap-3">
            <div className="flex items-center gap-2.5 text-slate-200 font-bold text-xs uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Server size={14} />
              </div>
              <span>Visualizer Rack Cabinet 42U</span>
            </div>

            <div className="flex items-center gap-2">
              {activeRoom && (
                <button 
                  id="btn-add-rack"
                  onClick={() => navigate(`/buildings/${id}/racks/create?room_id=${activeRoom.id}`)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> + Tambah Rack
                </button>
              )}
              {activeRack && (
                <button 
                  id="btn-install-device"
                  onClick={() => navigate(`/assets/create?rack_id=${activeRack.id}`)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 border border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all cursor-pointer"
                >
                  <Sparkles size={14} /> + Pasang Perangkat
                </button>
              )}
            </div>
          </div>

          {/* Racks Selector Tabs */}
          {racks.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {racks.map(rk => (
                <button
                  key={rk.id}
                  onClick={() => setActiveRack(rk)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border shadow-sm ${
                    activeRack?.id === rk.id
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      : "bg-slate-900/80 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  🖥️ {rk.name} {rk.position ? `(${rk.position})` : ""}
                </button>
              ))}
            </div>
          )}

          {/* 42U Rack Slot Visualizer Box */}
          <div className="glass-strong rounded-3xl border border-slate-700/60 p-6 space-y-5 shadow-2xl">
            {activeRack ? (
              <>
                {/* Rack Capacity Meter Bar */}
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      {activeRack.name} — Status Kapasitas Slot U
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {usedU} / {totalU} U Digunakan ({usedPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Klik pada <strong>Empty Slot</strong> untuk langsung memasang perangkat ke nomor U tersebut.
                  </p>
                </div>

                {/* 42U Physical Rack Slots Cabinet */}
                <div className="bg-slate-950 rounded-2xl p-4 border-2 border-slate-800 relative max-h-[500px] overflow-y-auto space-y-2 shadow-inner">
                  
                  {/* Top Rack Fan Header */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-widest shadow-sm">
                    <span className="flex items-center gap-2 font-bold text-slate-300">
                      ⚡ POWER DISTRIBUTOR (PDU A/B)
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> 220V ONLINE
                    </span>
                  </div>

                  {/* Physical U Slots (From U42 Down to U1) */}
                  <div className="space-y-1.5 font-mono">
                    {Array.from({ length: totalU }).map((_, idx) => {
                      const uNum = totalU - idx; // e.g. 42 down to 1
                      const device = rackSlotMap[uNum];

                      if (device) {
                        const units = device.rack_units ?? 1;
                        const statusColor = device.status === "active" ? "#22c55e" : device.status === "down" ? "#ef4444" : "#eab308";
                        
                        return (
                          <div
                            key={uNum}
                            onClick={() => navigate(`/assets/${device.id}/edit`)}
                            className="group relative cursor-pointer p-3 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 hover:border-blue-400 transition-all shadow-md flex items-center justify-between"
                            style={{ minHeight: `${units * 42}px` }}
                          >
                            <div className="flex items-center gap-3.5">
                              <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                U{uNum}
                              </span>
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
                              <div>
                                <p className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors flex items-center gap-2">
                                  {device.name}
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700 capitalize">
                                    {device.type}
                                  </span>
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  IP: {device.ip_address ?? "-"} | {device.vendor ?? ""} {device.model ?? ""} ({device.power_consumption_w ?? 0}W)
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/30 flex items-center gap-1">
                                Kelola &rarr;
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Empty Slot Render
                      return (
                        <div
                          key={uNum}
                          onClick={() => {
                            if (canWrite) {
                              navigate(`/assets/create?rack_id=${activeRack.id}&rack_position=${uNum}`);
                            }
                          }}
                          className={`px-3 py-2 rounded-xl border border-dashed text-xs flex items-center justify-between transition-all ${
                            canWrite 
                              ? "border-slate-800 hover:border-blue-500/60 hover:bg-blue-500/5 cursor-pointer text-slate-500 hover:text-blue-300 group"
                              : "border-slate-800/80 text-slate-600 bg-slate-950/40"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-slate-600 group-hover:text-blue-400">U{uNum}</span>
                            <span className="text-[10px] tracking-wider uppercase group-hover:hidden">KOSONG</span>
                            <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase hidden group-hover:inline-block">
                              + Pasang Perangkat di Slot U{uNum}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-600 group-hover:text-blue-400">
                            Available Slot
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <Server size={40} className="mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-300">Pilih Ruangan & Rack di kolom sebelah kiri.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Visualizer 42U akan langsung memetakan lokasi fisik perangkat server, switch, dan router.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
