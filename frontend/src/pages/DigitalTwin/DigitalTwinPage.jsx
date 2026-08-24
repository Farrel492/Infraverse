import { useEffect, useState, useCallback } from "react";
import { digitalTwinService } from "../../services/digitalTwinService";
import { buildingService } from "../../services/buildingService";
import toast from "react-hot-toast";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import {
  Server, Router, Shield, Network, Wifi, Battery,
  Package, RefreshCw, Zap, ZapOff, RotateCcw, Layers, DoorOpen, Building2
} from "lucide-react";
import { motion } from "framer-motion";

const STATUS_COLOR = {
  active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444",
};
const STATUS_LABEL  = { active:"Aktif", inactive:"Nonaktif", maintenance:"Maintenance", down:"Down" };
const STATUS_BG     = {
  active:      "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
  inactive:    "bg-slate-500/10 border-slate-500/30 text-slate-400",
  maintenance: "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
  down:        "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
};

const TYPE_ICON_COMPONENT = {
  router:       Router,
  switch:       Network,
  firewall:     Shield,
  server:       Server,
  access_point: Wifi,
  ups:          Battery,
  other:        Package,
};

const TYPE_COLOR_HEX = {
  router:"#3b82f6", switch:"#8b5cf6", firewall:"#ef4444",
  server:"#10b981", access_point:"#f59e0b", ups:"#ec4899", other:"#6b7280",
};

const RACK_U_HEIGHT = 32;
const RACK_WIDTH    = 360;

function DeviceIcon({ type, size = 14 }) {
  const IconComponent = TYPE_ICON_COMPONENT[type] ?? Package;
  return <IconComponent size={size} />;
}

function RackUnit({ device, isSelected, onClick, simMode, affectedIds }) {
  const uH     = RACK_U_HEIGHT * (device.u_size ?? 1);
  const status = simMode && affectedIds.includes(device.id) ? "down" : device.status;
  const color  = STATUS_COLOR[status];
  const typeC  = TYPE_COLOR_HEX[device.type] ?? "#6b7280";
  const pulse  = status === "active" && !simMode;

  return (
    <motion.div 
      onClick={() => onClick(device)}
      whileHover={{ scale: 1.01 }}
      className={`relative flex items-center gap-3 px-3 cursor-pointer rounded-xl select-none transition-all duration-200 group border
        ${isSelected ? "border-blue-400 bg-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.3)] z-10" : "glass hover:bg-slate-800/80 border-slate-800"}
        ${simMode && affectedIds.includes(device.id) ? "animate-pulse border-red-500/60 bg-red-500/10" : ""}
      `}
      style={{
        height: `${uH}px`,
        borderLeft: `4px solid ${typeC}`,
      }}>
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all"
          style={{
            background: color,
            boxShadow: pulse ? `0 0 8px 2px ${color}` : `0 0 4px ${color}`,
          }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex-shrink-0">
            <DeviceIcon type={device.type} size={14} />
          </span>
          <p className="text-xs font-bold text-slate-100 truncate leading-none group-hover:text-blue-300 transition-colors">
            {device.name}
          </p>
        </div>
        {uH > 36 && (
          <p className="text-[10px] text-slate-400 truncate mt-1 leading-none">
            {device.vendor} {device.model}
          </p>
        )}
        {uH > 52 && device.ip && (
          <p className="text-[10px] font-mono text-blue-400 mt-0.5 leading-none">{device.ip}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
          U{device.u_pos}
        </span>
        {uH > 36 && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${STATUS_BG[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function RackView({ rack, selectedDevice, onSelectDevice, simMode, affectedIds }) {
  const totalSlots = rack.total_u ?? 42;
  const usedSlots  = rack.devices.reduce((acc, d) => acc + (d.u_size ?? 1), 0);
  const freeSlots  = totalSlots - usedSlots;

  return (
    <div className="flex-shrink-0" style={{ width: RACK_WIDTH }}>
      {/* Rack Header */}
      <div className="glass-strong border border-slate-700/60 rounded-t-2xl px-4 py-3.5 flex items-center justify-between shadow-lg">
        <div>
          <h3 className="font-bold text-slate-100 text-xs flex items-center gap-2">
            <Server size={14} className="text-blue-400" />
            {rack.name}
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
            {usedSlots}U / {totalSlots}U Terpakai ({freeSlots}U Kosong)
          </p>
        </div>
        <div className="text-right space-y-0.5">
          {rack.devices.filter(d => d.status === "active").length > 0 && (
            <div className="flex items-center gap-1.5 justify-end">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <span className="text-[10px] font-bold text-emerald-400">
                {rack.devices.filter(d => d.status === "active").length} Aktif
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Rack Cabinet Body */}
      <div className="border-x border-slate-700/60 bg-slate-950/90 relative shadow-inner">
        <div className="ml-2 flex flex-col gap-1.5 p-2"
          style={{ minHeight: totalSlots * RACK_U_HEIGHT + 16 }}>
          {[...rack.devices]
            .sort((a, b) => (a.u_pos ?? 99) - (b.u_pos ?? 99))
            .map((device) => (
              <RackUnit
                key={device.id}
                device={device}
                isSelected={selectedDevice?.id === device.id}
                onClick={(d) => onSelectDevice({ ...d, _rack: rack })}
                simMode={simMode}
                affectedIds={affectedIds}
              />
            ))}
          {freeSlots > 0 && (
            <div className="flex items-center justify-center text-[10px] font-mono font-bold text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-950/40"
              style={{ height: freeSlots * RACK_U_HEIGHT }}>
              {freeSlots}U Kosong
            </div>
          )}
        </div>
      </div>

      {/* Rack Footer */}
      <div className="glass border border-t-0 border-slate-700/60 rounded-b-2xl px-4 py-2.5">
        <div className="flex gap-2">
          {Object.entries(STATUS_COLOR).map(([s, c]) => {
            const count = rack.devices.filter(d => d.status === s).length;
            if (!count) return null;
            return (
              <div key={s} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span>{count} {STATUS_LABEL[s]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DigitalTwinPage() {
  const [sceneData, setSceneData]     = useState(null);
  const [buildings, setBuildings]      = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [updating, setUpdating]       = useState(false);
  const [simMode, setSimMode]         = useState(false);
  const [affectedIds, setAffectedIds] = useState([]);

  // Load buildings list on mount
  useEffect(() => {
    buildingService.getAll().then(res => {
      setBuildings(res.data);
      if (res.data.length > 0) setSelectedBuilding(res.data[0].id);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!selectedBuilding) return;
    setLoading(true);
    try {
      const res = await digitalTwinService.getScene(selectedBuilding);
      setSceneData(res.data);
    } finally { setLoading(false); }
  }, [selectedBuilding]);

  useEffect(() => { load(); }, [load]);

  const allDevices   = sceneData?.racks?.flatMap(r => r.devices) ?? [];
  const statusCounts = allDevices.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  const handleStatusChange = async (newStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await digitalTwinService.updateStatus(selected.id, newStatus);
      toast.success(`${selected.name} diubah ke ${STATUS_LABEL[newStatus]}`);
      setSelected(prev => ({ ...prev, status: newStatus }));
      setSceneData(prev => ({
        ...prev,
        racks: prev.racks.map(r => ({
          ...r,
          devices: r.devices.map(d =>
            d.id === selected.id ? { ...d, status: newStatus } : d
          ),
        })),
      }));
    } catch {
      toast.error("Gagal mengubah status.");
    } finally { setUpdating(false); }
  };

  const handleResetAll = async () => {
    if (!window.confirm("Reset semua perangkat ke status Aktif?")) return;
    for (const d of allDevices) {
      if (d.status !== "active") {
        await digitalTwinService.updateStatus(d.id, "active");
      }
    }
    toast.success("Semua perangkat direset ke Aktif.");
    setSimMode(false);
    setAffectedIds([]);
    setSelected(null);
    load();
  };

  const toggleSimMode = () => {
    if (!simMode) {
      const downIds = allDevices
        .filter(d => d.status === "down" || d.status === "maintenance")
        .map(d => d.id);
      setAffectedIds(downIds.length > 0 ? downIds : [allDevices[0]?.id].filter(Boolean));
      toast("Mode Simulasi Aktif");
    } else {
      setAffectedIds([]);
      toast("Mode Simulasi Dimatikan");
    }
    setSimMode(s => !s);
  };

  return (
    <div className="p-8 space-y-6 flex flex-col h-full">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Digital Twin Rack Inspector" }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100">
            Digital Twin Rack Inspector
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {sceneData?.building?.name ?? "Pilih Gedung"} — Pemantauan Posisi Fisik Rack per Ruangan
          </p>
        </div>

        {/* Building Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-blue-400" />
            <select
              value={selectedBuilding}
              onChange={e => { setSelectedBuilding(e.target.value); setSelected(null); }}
              className="px-3.5 py-2 bg-slate-900/80 border border-blue-500/40 rounded-xl text-slate-200 text-xs font-bold focus:outline-none focus:border-blue-400 transition-all"
            >
              <option value="">Pilih Gedung...</option>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <button onClick={toggleSimMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              simMode
                ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
                : "glass border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}>
            {simMode ? <ZapOff size={14} /> : <Zap size={14} />}
            {simMode ? "Sim Mode ON" : "Mode Simulasi"}
          </button>

          <button onClick={handleResetAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold glass border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
            <RotateCcw size={14} /> Reset Status
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6">
        {/* Racks View */}
        <div className="flex-1 overflow-x-auto overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-2">
                <RefreshCw size={32} className="text-blue-400 mx-auto animate-spin" />
                <p className="text-xs font-semibold text-slate-400">Memuat Visualisasi Rack Digital Twin...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {(() => {
                const racks = sceneData?.racks ?? [];
                // Group by floor_number then room_name
                const byFloor = {};
                racks.forEach(rack => {
                  const floorKey = rack.floor_id ?? "uncategorized";
                  const floorLabel = rack.floor_name ?? "Lantai Tidak Diketahui";
                  const roomKey = rack.room_id ?? "uncategorized";
                  const roomLabel = rack.room_name ?? "Ruangan Tidak Diketahui";
                  if (!byFloor[floorKey]) byFloor[floorKey] = { label: floorLabel, rooms: {} };
                  if (!byFloor[floorKey].rooms[roomKey]) byFloor[floorKey].rooms[roomKey] = { label: roomLabel, type: rack.room_type, racks: [] };
                  byFloor[floorKey].rooms[roomKey].racks.push(rack);
                });

                const ROOM_TYPE_COLOR = {
                  server_room: "border-blue-500/50 bg-blue-500/5",
                  office:      "border-emerald-500/50 bg-emerald-500/5",
                  lab:         "border-purple-500/50 bg-purple-500/5",
                  classroom:   "border-amber-500/50 bg-amber-500/5",
                  storage:     "border-slate-500/50 bg-slate-500/5",
                  other:       "border-slate-600/50 bg-slate-800/30",
                };

                return Object.entries(byFloor).map(([floorId, floorData]) => (
                  <div key={floorId} className="space-y-4">
                    {/* Floor Header */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-slate-700 rounded-xl">
                        <Layers size={13} className="text-blue-400" />
                        <span className="text-xs font-bold text-blue-300">{floorData.label}</span>
                      </div>
                      <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    {/* Rooms in this floor */}
                    {Object.entries(floorData.rooms).map(([roomId, roomData]) => (
                      <div key={roomId} className={`rounded-2xl border p-4 space-y-3 ${ROOM_TYPE_COLOR[roomData.type] ?? ROOM_TYPE_COLOR.other}`}>
                        {/* Room Header */}
                        <div className="flex items-center gap-2">
                          <DoorOpen size={13} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-200">{roomData.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/60 text-slate-400 border border-slate-800 capitalize">
                            {roomData.type?.replace("_"," ")}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-auto">
                            {roomData.racks.length} rack
                          </span>
                        </div>

                        {/* Racks in this room */}
                        <div className="flex gap-4 overflow-x-auto pb-1">
                          {roomData.racks.map(rack => (
                            <RackView
                              key={rack.id}
                              rack={rack}
                              selectedDevice={selected}
                              onSelectDevice={setSelected}
                              simMode={simMode}
                              affectedIds={affectedIds}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Sidebar Inspector Panel */}
        <div className="w-80 flex-shrink-0 glass-strong border border-slate-700/60 rounded-2xl p-5 overflow-y-auto shadow-2xl">
          {selected ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-slate-100 shadow-md"
                  style={{ background: (TYPE_COLOR_HEX[selected.type] ?? "#6b7280") }}>
                  <DeviceIcon type={selected.type} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-100 text-sm leading-snug">{selected.name}</h3>
                  <p className="text-[10px] text-slate-400 capitalize font-mono mt-0.5">
                    {selected.type?.replace("_"," ")}
                  </p>
                  {/* Show location from rack context */}
                  {selected._rack && (
                    <p className="text-[10px] text-blue-400 mt-1 flex items-center gap-1">
                      <DoorOpen size={10} />
                      {selected._rack.floor_name} › {selected._rack.room_name} › {selected._rack.name}
                    </p>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${STATUS_BG[selected.status]}`}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    background: STATUS_COLOR[selected.status],
                    boxShadow: selected.status === "active" ? `0 0 8px ${STATUS_COLOR.active}` : "none",
                  }} />
                <p className="text-xs font-bold">{STATUS_LABEL[selected.status]}</p>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  ["Vendor / Merek",  selected.vendor ?? "-"],
                  ["Model Hardware", selected.model  ?? "-"],
                  ["IP Address",      selected.ip     ?? "-"],
                  ["Posisi Slot",     `Slot U${selected.u_pos ?? "-"}`],
                  ["Ukuran Perangkat",`${selected.u_size ?? 1}U Unit`],
                ].map(([label, val]) => (
                  <div key={label}
                    className="flex justify-between items-center py-2 border-b border-slate-800/80">
                    <span className="text-slate-500 text-[11px]">{label}</span>
                    <span className="text-slate-200 font-mono font-bold text-[11px]">{val}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  Ubah Status Operasional
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_LABEL).map(([s, label]) => (
                    <button key={s}
                      disabled={updating || s === selected.status}
                      onClick={() => handleStatusChange(s)}
                      className={`py-2 px-3 text-xs rounded-xl border font-bold transition-all ${
                        s === selected.status
                          ? "opacity-100 shadow-md"
                          : "hover:brightness-125 opacity-50 hover:opacity-100"
                      }`}
                      style={{
                        borderColor: STATUS_COLOR[s] + "60",
                        color: STATUS_COLOR[s],
                        background: s === selected.status ? STATUS_COLOR[s] + "30" : "transparent",
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 space-y-3">
              <Server size={36} className="mx-auto text-blue-400/80" />
              <div>
                <h3 className="font-bold text-slate-200 text-xs">Inspektur Perangkat Rack</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Klik perangkat di dalam Rack untuk menguji status dan melihat detail teknis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
