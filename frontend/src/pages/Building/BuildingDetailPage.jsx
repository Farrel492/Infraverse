import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import useAuthStore from "../../stores/authStore";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { 
  Plus, Server, ArrowLeft, Layers, DoorOpen, HardDrive, 
  Cpu, ShieldAlert, Activity, ChevronRight, Zap, CheckCircle2, 
  AlertTriangle, Wrench, Eye, Sparkles, ExternalLink, Settings2, X,
  Edit2, Trash2, Save
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
  const [roomDevices, setRoomDevices] = useState([]);
  const [loading, setLoading]         = useState(true);

  // Rack Capacity Modal
  const [showCapModal, setShowCapModal] = useState(false);
  const [capValue, setCapValue]         = useState("");
  const [savingCap, setSavingCap]       = useState(false);
  const capInputRef = useRef(null);

  // Floor Edit/Delete
  const [editFloor, setEditFloor]       = useState(null); // {id, name, floor_number}
  const [deleteFloor, setDeleteFloor]   = useState(null);
  const [savingFloor, setSavingFloor]   = useState(false);
  const [deletingFloor, setDeletingFloor] = useState(false);

  // Room Edit/Delete
  const [editRoom, setEditRoom]         = useState(null); // {id, name, type, floor_id}
  const [deleteRoom, setDeleteRoom]     = useState(null);
  const [savingRoom, setSavingRoom]     = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);

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

  useEffect(() => {
    const fetchRoomDevices = async () => {
      if (!activeRoom) {
        setRoomDevices([]);
        return;
      }
      try {
        const res = await buildingService.getRoomDevices(activeRoom.id);
        setRoomDevices(res.data || []);
      } catch (err) {
        setRoomDevices([]);
      }
    };
    fetchRoomDevices();
  }, [activeRoom]);

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

  const openCapModal = () => {
    setCapValue(String(activeRack?.total_u ?? 42));
    setShowCapModal(true);
    setTimeout(() => capInputRef.current?.focus(), 100);
  };

  const handleSaveCapacity = async () => {
    const newCap = parseInt(capValue, 10);
    if (!newCap || newCap < 1 || newCap > 100) {
      toast.error("Kapasitas harus antara 1 hingga 100 U.");
      return;
    }
    setSavingCap(true);
    try {
      await buildingService.updateRack(activeRoom.id, activeRack.id, { total_u: newCap, name: activeRack.name, position: activeRack.position });
      toast.success(`Kapasitas rack diperbarui menjadi ${newCap}U.`);
      setShowCapModal(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.message ?? err.response?.data?.errors?.total_u?.[0] ?? "Gagal memperbarui kapasitas.";
      toast.error(msg);
    } finally {
      setSavingCap(false);
    }
  };

  // ===== FLOOR EDIT/DELETE HANDLERS =====
  const handleSaveFloor = async () => {
    if (!editFloor?.name?.trim()) { toast.error("Nama lantai wajib diisi."); return; }
    setSavingFloor(true);
    try {
      await buildingService.updateFloor(id, editFloor.id, {
        name: editFloor.name.trim(),
        floor_number: parseInt(editFloor.floor_number) || editFloor.floor_number,
        building_id: parseInt(id),
      });
      toast.success("Data lantai berhasil diperbarui!");
      setEditFloor(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui lantai.");
    } finally {
      setSavingFloor(false);
    }
  };

  const handleDeleteFloor = async () => {
    setDeletingFloor(true);
    try {
      await buildingService.deleteFloor(id, deleteFloor.id);
      toast.success(`Lantai "${deleteFloor.name}" berhasil dihapus.`);
      setDeleteFloor(null);
      setActiveFloor(null);
      setActiveRoom(null);
      setActiveRack(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal menghapus lantai.");
    } finally {
      setDeletingFloor(false);
    }
  };

  // ===== ROOM EDIT/DELETE HANDLERS =====
  const handleSaveRoom = async () => {
    if (!editRoom?.name?.trim()) { toast.error("Nama ruangan wajib diisi."); return; }
    setSavingRoom(true);
    try {
      await buildingService.updateRoom(editRoom.floor_id, editRoom.id, {
        name: editRoom.name.trim(),
        type: editRoom.type,
        floor_id: editRoom.floor_id,
      });
      toast.success("Data ruangan berhasil diperbarui!");
      setEditRoom(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui ruangan.");
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteRoom = async () => {
    setDeletingRoom(true);
    try {
      await buildingService.deleteRoom(deleteRoom.floor_id, deleteRoom.id);
      toast.success(`Ruangan "${deleteRoom.name}" berhasil dihapus.`);
      setDeleteRoom(null);
      setActiveRoom(null);
      setActiveRack(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal menghapus ruangan.");
    } finally {
      setDeletingRoom(false);
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

  // Generate layout items with multi-U grouping (e.g. 3U server occupies U24 down to U22)
  const coveredSlots = new Set();
  const sortedDevices = [...rackDevices].sort((a, b) => (b.rack_position ?? 0) - (a.rack_position ?? 0));
  const deviceByStartSlot = {};

  sortedDevices.forEach(d => {
    if (d.rack_position) {
      deviceByStartSlot[d.rack_position] = d;
      const units = Math.max(1, d.rack_units ?? 1);
      for (let offset = 0; offset < units; offset++) {
        const slot = d.rack_position - offset;
        if (slot >= 1) coveredSlots.add(slot);
      }
    }
  });

  const layoutItems = [];
  for (let u = totalU; u >= 1; u--) {
    if (deviceByStartSlot[u]) {
      const dev = deviceByStartSlot[u];
      const units = Math.max(1, dev.rack_units ?? 1);
      const endU = Math.max(1, u - units + 1);
      layoutItems.push({
        type: "device",
        device: dev,
        startU: u,
        endU: endU,
        units: units,
        slots: Array.from({ length: units }, (_, k) => u - k).filter(s => s >= 1),
      });
      u = endU; // fast-forward past the spanned slots
    } else if (!coveredSlots.has(u)) {
      layoutItems.push({
        type: "empty",
        uNum: u,
      });
    }
  }

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
            {canWrite && (
              <button 
                id="btn-add-floor"
                onClick={() => navigate(`/buildings/${id}/floors/create`)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} /> Lantai
              </button>
            )}
          </div>

          <div className="space-y-3">
            {floors.map((f) => {
              const isActive = activeFloor?.id === f.id;
              const roomCount = f.rooms?.length ?? 0;
              return (
                <div
                  key={f.id}
                  onClick={() => handleSelectFloor(f)}
                  className={`w-full text-left p-6 rounded-3xl border transition-all shadow-md cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-[0_6px_25px_rgba(59,130,246,0.4)] ring-1 ring-white/20"
                      : "glass border-slate-700/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
                  }`}
                >
                  {/* Card Header: Level badge on left, Edit/Delete on right */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[11px] font-mono px-3 py-1 rounded-lg font-bold shadow-xs ${
                      isActive ? "bg-white/25 text-white" : "bg-slate-800/90 text-blue-400 border border-slate-700/80"
                    }`}>
                      Tingkat {f.floor_number}
                    </span>
                    {canWrite && (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setEditFloor({ id: f.id, name: f.name, floor_number: f.floor_number })}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            isActive ? "bg-white/20 hover:bg-white/30 text-white" : "bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700"
                          }`}
                          title="Edit Lantai"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteFloor(f)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            isActive ? "bg-red-500/40 hover:bg-red-500/70 text-white" : "bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white border border-slate-700"
                          }`}
                          title="Hapus Lantai"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Floor Name */}
                  <p className={`font-black text-sm leading-snug break-words my-1 ${isActive ? "text-white" : "text-slate-100"}`}>
                    {f.name}
                  </p>

                  {/* Floor Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10 text-xs font-semibold">
                    <span className={isActive ? "text-blue-100 opacity-90" : "text-slate-400"}>
                      {roomCount} Ruangan Terdaftar
                    </span>
                    <ChevronRight size={16} className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                  </div>
                </div>
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
                    Tambah Lantai Pertama
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
            {activeFloor && canWrite && (
              <button 
                id="btn-add-room"
                onClick={() => navigate(`/buildings/${id}/rooms/create?floor_id=${activeFloor.id}`)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} /> Ruang
              </button>
            )}
          </div>

          <div className="space-y-3">
            {rooms.map((r) => {
              const isActive = activeRoom?.id === r.id;
              const rackCount = r.racks?.length ?? 0;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRoom(r)}
                  className={`w-full text-left p-6 rounded-3xl border transition-all shadow-md cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-[0_6px_25px_rgba(16,185,129,0.4)] ring-1 ring-white/20"
                      : "glass border-slate-700/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
                  }`}
                >
                  {/* Card Header: Type badge on left, Edit/Delete on right */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[11px] px-3 py-1 rounded-lg font-bold capitalize shadow-xs ${
                      isActive ? "bg-white/25 text-white" : "bg-slate-800/90 text-emerald-300 border border-slate-700/80"
                    }`}>
                      {r.type.replace("_"," ")}
                    </span>
                    {canWrite && (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setEditRoom({ id: r.id, name: r.name, type: r.type, floor_id: r.floor_id ?? activeFloor?.id })}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            isActive ? "bg-white/20 hover:bg-white/30 text-white" : "bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700"
                          }`}
                          title="Edit Ruangan"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteRoom({ ...r, floor_id: r.floor_id ?? activeFloor?.id })}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            isActive ? "bg-red-500/40 hover:bg-red-500/70 text-white" : "bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white border border-slate-700"
                          }`}
                          title="Hapus Ruangan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Room Name */}
                  <p className={`font-black text-sm leading-snug break-words my-1 ${isActive ? "text-white" : "text-slate-100"}`}>
                    {r.name}
                  </p>

                  {/* Room Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10 text-xs font-semibold">
                    <span className={isActive ? "text-emerald-100 opacity-90" : "text-slate-400 font-medium"}>
                      {rackCount} Rack Terpasang
                    </span>
                    <ChevronRight size={16} className={isActive ? "text-white" : "text-slate-500"} />
                  </div>
                </div>
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
                    Tambah Ruangan Baru
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
              {activeRoom && canWrite && (
                <button 
                  id="btn-add-rack"
                  onClick={() => navigate(`/buildings/${id}/racks/create?room_id=${activeRoom.id}`)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> Tambah Rack
                </button>
              )}
              {activeRack && canWrite && (
                <>
                  <button 
                    id="btn-edit-rack-capacity"
                    onClick={openCapModal}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/40 transition-all shadow-sm cursor-pointer"
                  >
                    <Settings2 size={14} /> Ubah Kapasitas
                  </button>
                  <button 
                    id="btn-install-device"
                    onClick={() => navigate(`/assets/create?rack_id=${activeRack.id}`)}
                    className="flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 border border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all cursor-pointer"
                  >
                    <Sparkles size={14} /> Pasang Perangkat
                  </button>
                </>
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
                  {rk.name}
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

                  {/* Physical U Slots (Multi-U Device Spans & Empty Slots) */}
                  <div className="space-y-1.5 font-mono">
                    {layoutItems.map(item => {
                      if (item.type === "device") {
                        const dev = item.device;
                        const units = item.units;
                        const statusColor = dev.status === "active" ? "#22c55e" : dev.status === "down" ? "#ef4444" : "#eab308";
                        
                        return (
                          <div
                            key={`dev-${dev.id}-${item.startU}`}
                            onClick={() => navigate(`/assets/${dev.id}/edit`)}
                            className="group relative cursor-pointer p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/90 hover:border-blue-400 transition-all shadow-md flex items-center justify-between"
                            style={{ minHeight: `${Math.max(52, units * 48)}px` }}
                          >
                            <div className="flex items-center gap-3.5">
                              {/* Stacked U Slots Indicator */}
                              {units > 1 ? (
                                <div className="flex flex-col items-center justify-center font-mono text-[10px] font-bold text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 leading-tight">
                                  {item.slots.map(s => (
                                    <span key={s} className="text-blue-300">U{s}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                  U{item.startU}
                                </span>
                              )}

                              <div>
                                <p className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors flex items-center gap-2">
                                  {dev.name}
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {units}U
                                  </span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                                    {dev.type}
                                  </span>
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  Slot: U{item.startU}{units > 1 ? ` – U${item.endU}` : ""} | IP: {dev.ip_address ?? "-"} | {dev.vendor ?? ""} {dev.model ?? ""} ({dev.power_consumption_w ?? 0}W)
                                </p>
                                {/* Server Drive Bays / Vents decoration */}
                                {units >= 2 && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    {Array.from({ length: Math.min(8, units * 2) }).map((_, bi) => (
                                      <div key={bi} className="w-5 h-2.5 rounded-xs bg-slate-950/80 border border-slate-700/80 flex items-center justify-center">
                                        <div className="w-1.5 h-0.5 bg-slate-600 rounded-2xs" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Dual Status LEDs */}
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                              </div>
                              <span className="text-[11px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/30 flex items-center gap-1">
                                Kelola &rarr;
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Empty Slot Render
                      const uNum = item.uNum;
                      return (
                        <div
                          key={`empty-${uNum}`}
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

            {/* Standalone Room Devices (Access Points, etc.) */}
            {activeRoom && roomDevices.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3.5 border-b border-slate-800 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Perangkat Standalone Ruangan</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Access Point & Perangkat di luar Rack</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roomDevices.map(dev => (
                    <div
                      key={`room-dev-${dev.id}`}
                      onClick={() => navigate(`/assets/${dev.id}/edit`)}
                      className="group cursor-pointer p-3.5 rounded-xl bg-slate-900 border border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-800 transition-all shadow-md flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                        <HardDrive size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
                          {dev.name}
                        </h4>
                        <div className="text-[10px] font-semibold text-slate-500 mt-0.5 flex gap-2">
                          <span className="uppercase">{dev.type.replace('_',' ')}</span>
                          <span>|</span>
                          <span className="text-slate-400">{dev.ip_address || "Tanpa IP"}</span>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ===== RACK CAPACITY MODAL ===== */}
      {showCapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-strong rounded-3xl border border-slate-700/70 shadow-2xl p-8 w-full max-w-md relative my-auto">
            <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-amber-500 to-orange-500" />
            <button onClick={() => setShowCapModal(false)} className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400"><Settings2 size={20} /></div>
              <div>
                <h3 className="text-base font-black text-slate-100">Ubah Kapasitas Slot Rak</h3>
                <p className="text-xs text-slate-400 mt-0.5">Rack: <span className="text-amber-400 font-bold">{activeRack?.name}</span></p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className="form-label">
                  <span>Kapasitas Baru (Unit U) <span className="text-amber-400">*</span></span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box text-amber-400">
                    <Settings2 size={18} />
                  </div>
                  <input ref={capInputRef} type="number" min={1} max={100} value={capValue} onChange={e => setCapValue(e.target.value)}
                    className="input-control font-mono font-bold" placeholder="Contoh: 42" />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Kapasitas saat ini: <span className="text-amber-400 font-bold">{activeRack?.total_u ?? 42}U</span>. Tidak bisa dikurangi di bawah slot yang terpakai.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCapModal(false)} className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer">Batalkan</button>
                <button onClick={handleSaveCapacity} disabled={savingCap} className="flex-1 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                  {savingCap ? "Menyimpan..." : <><CheckCircle2 size={16} /> Simpan Kapasitas</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FLOOR EDIT MODAL ===== */}
      {editFloor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-strong rounded-3xl border border-slate-700/70 shadow-2xl p-8 w-full max-w-md relative my-auto">
            <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-blue-500 to-indigo-500" />
            <button onClick={() => setEditFloor(null)} className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400"><Layers size={20} /></div>
              <div>
                <h3 className="text-base font-black text-slate-100">Edit Lantai Fisik</h3>
                <p className="text-xs text-slate-400 mt-0.5">Perbarui nama atau nomor tingkat lantai gedung</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label"><span>Nama / Label Lantai <span className="text-blue-400">*</span></span></label>
                <div className="input-group">
                  <div className="input-icon-box text-blue-400">
                    <Layers size={18} />
                  </div>
                  <input type="text" value={editFloor.name} onChange={e => setEditFloor(f => ({ ...f, name: e.target.value }))}
                    className="input-control" />
                </div>
              </div>
              <div>
                <label className="form-label"><span>Nomor Tingkat Lantai</span></label>
                <div className="input-group">
                  <div className="input-icon-box text-indigo-400 font-mono font-bold">#</div>
                  <input type="number" value={editFloor.floor_number} onChange={e => setEditFloor(f => ({ ...f, floor_number: e.target.value }))}
                    className="input-control font-mono font-bold" />
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button onClick={() => setEditFloor(null)} className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer">Batal</button>
                <button onClick={handleSaveFloor} disabled={savingFloor} className="flex-1 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                  <Save size={16} /> {savingFloor ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FLOOR DELETE CONFIRM ===== */}
      {deleteFloor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="glass rounded-3xl border border-red-500/40 shadow-2xl p-8 w-full max-w-sm">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100">Hapus Lantai?</h3>
                <p className="text-sm text-slate-400 mt-1.5">Lantai <span className="text-red-400 font-bold">"{deleteFloor.name}"</span> beserta semua ruangan dan rack di dalamnya akan dihapus permanen.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleteFloor(null)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer">Batal</button>
                <button onClick={handleDeleteFloor} disabled={deletingFloor} className="flex-1 py-3 rounded-2xl text-sm font-black text-white bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all disabled:opacity-50 cursor-pointer">
                  {deletingFloor ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ROOM EDIT MODAL ===== */}
      {editRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-strong rounded-3xl border border-slate-700/70 shadow-2xl p-8 w-full max-w-md relative my-auto">
            <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-emerald-500 to-teal-500" />
            <button onClick={() => setEditRoom(null)} className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"><DoorOpen size={20} /></div>
              <div>
                <h3 className="text-base font-black text-slate-100">Edit Ruangan Spasial</h3>
                <p className="text-xs text-slate-400 mt-0.5">Perbarui nama dan tipe peruntukan ruangan</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label"><span>Nama Ruangan <span className="text-emerald-400">*</span></span></label>
                <div className="input-group">
                  <div className="input-icon-box text-emerald-400">
                    <DoorOpen size={18} />
                  </div>
                  <input type="text" value={editRoom.name} onChange={e => setEditRoom(r => ({ ...r, name: e.target.value }))}
                    className="input-control" />
                </div>
              </div>
              <div>
                <label className="form-label"><span>Tipe Peruntukan Ruangan</span></label>
                <div className="input-group">
                  <select value={editRoom.type} onChange={e => setEditRoom(r => ({ ...r, type: e.target.value }))}
                    className="select-control">
                    <option value="server_room">Ruang Server / Data Center NOC</option>
                    <option value="office">Ruang Kantor Staf IT</option>
                    <option value="classroom">Ruang Kelas / Pelatihan</option>
                    <option value="lab">Laboratorium Jaringan & IoT</option>
                    <option value="storage">Gudang Sparepart & Kabel</option>
                    <option value="other">Fasilitas Lainnya</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button onClick={() => setEditRoom(null)} className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer">Batal</button>
                <button onClick={handleSaveRoom} disabled={savingRoom} className="flex-1 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                  <Save size={16} /> {savingRoom ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ROOM DELETE CONFIRM ===== */}
      {deleteRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="glass rounded-3xl border border-red-500/40 shadow-2xl p-8 w-full max-w-sm">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100">Hapus Ruangan?</h3>
                <p className="text-sm text-slate-400 mt-1.5">Ruangan <span className="text-red-400 font-bold">"{deleteRoom.name}"</span> beserta semua rack dan perangkat di dalamnya akan dihapus permanen.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleteRoom(null)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all">Batal</button>
                <button onClick={handleDeleteRoom} disabled={deletingRoom} className="flex-1 py-3 rounded-2xl text-sm font-black text-white bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all disabled:opacity-50">
                  {deletingRoom ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
