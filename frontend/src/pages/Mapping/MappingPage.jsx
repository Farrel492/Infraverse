import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { mappingService } from "../../services/mappingService";
import useAuthStore from "../../stores/authStore";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import toast from "react-hot-toast";

// 3D Imports
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Box, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";
import { 
  Network, Plus, Router, Shield, Server, Wifi, Battery, 
  Package, Trash2, Layers, RefreshCw, Eye, Sparkles, Activity
} from "lucide-react";

const TYPE_COLOR  = { router:"#00f0ff", switch:"#818cf8", firewall:"#f87171", server:"#34d399", access_point:"#fbbf24", ups:"#f472b6", other:"#94a3b8" };
const TYPE_LABEL  = { router:"Router", switch:"Switch", firewall:"Firewall", server:"Server", access_point:"Access Point", ups:"UPS", other:"Other" };
const STATUS_C    = { active:"#22c55e", inactive:"#64748b", maintenance:"#f59e0b", down:"#ef4444" };
const CONN_COLOR  = { fiber:"#38bdf8", utp:"#94a3b8", wireless:"#fbbf24", other:"#a855f7" };

// 3D Layout Calculators
function calculateLayout(nodes, mode = "tier") {
  if (mode === "tier") {
    const tiers = {
      gateway: [], // firewall, router
      core: [],    // switch
      servers: [], // server, ups
      access: []   // access_point, other
    };
    nodes.forEach(n => {
      if (n.type === 'router' || n.type === 'firewall') tiers.gateway.push(n);
      else if (n.type === 'switch') tiers.core.push(n);
      else if (n.type === 'server' || n.type === 'ups') tiers.servers.push(n);
      else tiers.access.push(n);
    });

    const result = [];
    const layoutRow = (rowNodes, y, zOffset, xSpread) => {
      const len = rowNodes.length;
      rowNodes.forEach((n, i) => {
        const x = len <= 1 ? 0 : ((i - (len - 1) / 2) * xSpread);
        const z = zOffset + (i % 2 === 0 ? 1.5 : -1.5);
        result.push({ ...n, x, y, z });
      });
    };

    layoutRow(tiers.gateway, 9, -12, 11);
    layoutRow(tiers.core, 3, -4, 9);
    layoutRow(tiers.servers, -3, 6, 8);
    layoutRow(tiers.access, -9, 14, 7);

    return result;
  } else {
    // Wide Radial Orbit Layout
    const order = { router:0, firewall:1, switch:2, server:3, access_point:4, ups:5, other:6 };
    const sorted = [...nodes].sort((a,b) => (order[a.type]??6)-(order[b.type]??6));
    const RADIUS = 24;
    return sorted.map((n, i) => {
      const angle = (2 * Math.PI * i / sorted.length);
      const yOffset = (i % 2 === 0 ? 1 : -1) * (2 + Math.sin(angle * 3) * 3);
      return { ...n, x: RADIUS * Math.cos(angle), y: yOffset, z: RADIUS * Math.sin(angle) };
    });
  }
}

// ----------------------------------------------------
// 3D NODE COMPONENT WITH CUSTOM GEOMETRIES
// ----------------------------------------------------
function NetworkNode({ node, selected, isDown, onClick }) {
  const color = isDown ? "#ef4444" : (STATUS_C[node.status] || "#94a3b8");
  const glowColor = isDown ? "#7f1d1d" : (TYPE_COLOR[node.type] || color);
  
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = node.y + Math.sin(state.clock.elapsedTime * 2 + node.x) * 0.25;
    }
  });

  const renderGeometry = () => {
    switch (node.type) {
      case "router":
        // Glowing cyan dual-tier disc with antenna
        return (
          <group>
            <Cylinder args={[1.4, 1.4, 0.45, 32]}>
              <meshStandardMaterial color={selected ? "#0284c7" : "#082f49"} emissive="#00f0ff" emissiveIntensity={selected ? 0.8 : 0.4} metalness={0.9} roughness={0.1} />
            </Cylinder>
            <Cylinder args={[0.9, 0.9, 0.25, 32]} position={[0, 0.35, 0]}>
              <meshStandardMaterial color="#0369a1" emissive="#38bdf8" emissiveIntensity={0.5} />
            </Cylinder>
            <Cylinder args={[0.06, 0.06, 1.2, 8]} position={[0.7, 0.8, 0]}>
              <meshBasicMaterial color="#00f0ff" />
            </Cylinder>
            <Cylinder args={[0.06, 0.06, 1.2, 8]} position={[-0.7, 0.8, 0]}>
              <meshBasicMaterial color="#00f0ff" />
            </Cylinder>
            <Sphere args={[0.15, 12, 12]} position={[0.7, 1.4, 0]}>
              <meshBasicMaterial color="#00f0ff" />
            </Sphere>
            <Sphere args={[0.15, 12, 12]} position={[-0.7, 1.4, 0]}>
              <meshBasicMaterial color="#00f0ff" />
            </Sphere>
          </group>
        );

      case "switch":
        // Wide deep indigo rack hub with green port LEDs
        return (
          <group>
            <Box args={[2.5, 0.6, 1.4]}>
              <meshStandardMaterial color={selected ? "#4338ca" : "#1e1b4b"} emissive="#818cf8" emissiveIntensity={selected ? 0.7 : 0.35} metalness={0.8} roughness={0.2} />
            </Box>
            {/* LED port strip */}
            {[-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map((px, idx) => (
              <Sphere key={idx} args={[0.06, 8, 8]} position={[px, 0.1, 0.72]}>
                <meshBasicMaterial color={isDown ? "#ef4444" : "#22c55e"} />
              </Sphere>
            ))}
          </group>
        );

      case "server":
        // Tall dark emerald double-tower compute blade
        return (
          <group>
            <Box args={[1.5, 2.6, 1.4]}>
              <meshStandardMaterial color={selected ? "#047857" : "#064e3b"} emissive="#10b981" emissiveIntensity={selected ? 0.7 : 0.3} metalness={0.9} roughness={0.1} />
            </Box>
            {/* Server drive bays */}
            {[-0.8, -0.3, 0.2, 0.7].map((py, idx) => (
              <Box key={idx} args={[1.3, 0.35, 0.05]} position={[0, py, 0.72]}>
                <meshStandardMaterial color="#022c22" emissive="#34d399" emissiveIntensity={0.2} />
              </Box>
            ))}
          </group>
        );

      case "access_point":
        // Amber radiating disk with signal dome
        return (
          <group>
            <Cylinder args={[0.3, 1.3, 0.7, 32]}>
              <meshStandardMaterial color={selected ? "#b45309" : "#78350f"} emissive="#f59e0b" emissiveIntensity={selected ? 0.8 : 0.4} metalness={0.6} roughness={0.3} />
            </Cylinder>
            <Sphere args={[1.3, 16, 16]} position={[0, 0.1, 0]}>
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.15} />
            </Sphere>
          </group>
        );

      case "firewall":
        // Crimson red octagonal shield fortress
        return (
          <group>
            <Cylinder args={[1.3, 1.3, 0.8, 8]}>
              <meshStandardMaterial color={selected ? "#b91c1c" : "#7f1d1d"} emissive="#ef4444" emissiveIntensity={selected ? 0.8 : 0.45} metalness={0.8} roughness={0.2} />
            </Cylinder>
            <Box args={[0.4, 1.4, 0.4]} position={[0, 0.5, 0]}>
              <meshBasicMaterial color="#f87171" />
            </Box>
          </group>
        );

      case "ups":
        // Magenta battery power bank
        return (
          <group>
            <Box args={[1.6, 1.8, 1.4]}>
              <meshStandardMaterial color={selected ? "#be185d" : "#831843"} emissive="#ec4899" emissiveIntensity={selected ? 0.7 : 0.35} metalness={0.7} roughness={0.3} />
            </Box>
            <Box args={[1.2, 0.2, 0.05]} position={[0, 0.4, 0.72]}>
              <meshBasicMaterial color="#f472b6" />
            </Box>
          </group>
        );

      default:
        return (
          <Sphere args={[1.1, 32, 32]}>
            <meshStandardMaterial color={selected ? "#1e40af" : "#1e293b"} emissive={color} emissiveIntensity={0.35} metalness={0.7} roughness={0.3} />
          </Sphere>
        );
    }
  };

  return (
    <group position={[node.x, node.y, node.z]} onClick={(e) => { e.stopPropagation(); onClick(node.id); }} ref={meshRef}>
      {/* Outer ambient glow sphere */}
      {node.status === "active" && !isDown && (
        <Sphere args={[2.0, 16, 16]}>
          <meshBasicMaterial color={glowColor} transparent opacity={0.12} />
        </Sphere>
      )}

      {/* Geometry */}
      {renderGeometry()}

      {/* Status top beacon */}
      <Sphere args={[0.25, 12, 12]} position={[0, 1.8, 0]}>
        <meshBasicMaterial color={isDown ? "#ef4444" : color} />
      </Sphere>

      {/* Crisp HTML Label Card */}
      <Html position={[0, -2.0, 0]} center zIndexRange={[100, 0]}>
        <div className={`pointer-events-none px-4 py-2.5 rounded-2xl border backdrop-blur-2xl whitespace-nowrap transition-all shadow-2xl ${
          selected 
            ? "bg-blue-950/95 border-blue-400 scale-110 ring-2 ring-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.6)]" 
            : "bg-slate-900/90 border-slate-700/80 shadow-black/80"
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ background: isDown ? "#ef4444" : color, boxShadow: `0 0 12px ${isDown ? "#ef4444" : color}` }} 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-100">{node.name}</span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider" style={{ background: `${TYPE_COLOR[node.type]}25`, color: TYPE_COLOR[node.type] }}>
                  {TYPE_LABEL[node.type] ?? node.type}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                {node.ip ? node.ip : "Tanpa IP"} &bull; {node.location ? node.location.split("/")[0].trim() : "-"}
              </p>
              {isDown && <p className="text-[10px] font-black text-red-400 mt-0.5 animate-pulse">NODE CRITICAL DOWN</p>}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ----------------------------------------------------
// 3D EDGE COMPONENT WITH PULSING ANIMATION
// ----------------------------------------------------
function AnimatedEdge({ source, target, type, isDown, selected }) {
  const points = useMemo(() => [
    new THREE.Vector3(source.x, source.y, source.z),
    new THREE.Vector3(target.x, target.y, target.z)
  ], [source, target]);

  const color = isDown ? "#ef4444" : (CONN_COLOR[type] || "#94a3b8");

  const packetRef = useRef();
  useFrame((state) => {
    if (packetRef.current) {
      const t = (state.clock.elapsedTime * 1.5) % 1;
      packetRef.current.position.lerpVectors(points[0], points[1], t);
    }
  });

  return (
    <group>
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints(points)} />
        <lineBasicMaterial 
          attach="material" 
          color={color} 
          linewidth={selected ? 3 : 1.5} 
          transparent 
          opacity={isDown ? 0.3 : (selected ? 0.95 : 0.6)} 
        />
      </line>

      {!isDown && (
        <Sphere ref={packetRef} args={[0.25, 8, 8]}>
          <meshBasicMaterial color={color} transparent opacity={selected ? 1 : 0.75} />
        </Sphere>
      )}

      {selected && (
        <Html position={new THREE.Vector3().lerpVectors(points[0], points[1], 0.5)} center>
          <div className="bg-slate-900/95 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-200 border border-slate-700 backdrop-blur-md pointer-events-none shadow-xl">
            {type.toUpperCase()} LINK
          </div>
        </Html>
      )}
    </group>
  );
}

// ----------------------------------------------------
// MAIN MAPPING PAGE
// ----------------------------------------------------
export default function MappingPage() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const canWrite  = user?.role === "admin" || user?.role === "teknisi";

  const [rawNodes, setRawNodes]         = useState([]);
  const [nodes, setNodes]               = useState([]);
  const [edges, setEdges]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [simFailed, setSimFailed]       = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType]     = useState("");
  const [layoutMode, setLayoutMode]     = useState("tier");
  const [deletingConn, setDeletingConn] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await mappingService.getTopology();
      setRawNodes(res.data.nodes);
      setEdges(res.data.edges);
      const positioned = calculateLayout(res.data.nodes, layoutMode);
      setNodes(positioned);
    } catch {
      toast.error("Gagal memuat topologi graf 3D.");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  useEffect(() => {
    if (rawNodes.length > 0) {
      setNodes(calculateLayout(rawNodes, layoutMode));
    }
  }, [layoutMode, rawNodes]);

  const getNode = id => nodes.find(n => n.id === id);

  const visibleNodes = nodes.filter(n => {
    if (filterStatus && n.status !== filterStatus) return false;
    if (filterType && n.type !== filterType) return false;
    return true;
  });
  const visibleIds   = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));

  const getEffectiveStatus = (node) => {
    if (!simFailed) return node.status;
    if (node.id === simFailed) return "down";
    const isDownstream = visibleEdges.some(e =>
      (e.source === simFailed && e.target === node.id) ||
      (e.target === simFailed && e.source === node.id)
    );
    return isDownstream ? "down" : node.status;
  };

  const handleSimFail = (nodeId) => {
    if (simFailed === nodeId) {
      setSimFailed(null);
      toast("Mode simulasi dimatikan.");
    } else {
      setSimFailed(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      toast(`Simulasi Kegagalan: ${node?.name} down — jalur terdampak dimatikan`);
    }
  };

  const handleConfirmDeleteConn = async () => {
    if (!deletingConn) return;
    try {
      await mappingService.deleteConnection(deletingConn.id);
      toast.success("Koneksi topologi berhasil dihapus.");
      setDeletingConn(null);
      load();
    } catch {
      toast.error("Gagal menghapus koneksi topologi.");
    }
  };

  const selectedNode  = selected ? nodes.find(n => n.id === selected) : null;
  const selectedEdges = selected ? edges.filter(e => e.source === selected || e.target === selected) : [];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 gap-4">
      <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/30"></div>
      <p className="text-sm font-semibold text-slate-300">Menghitung Topologi Spasial Graf 3D...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden relative">
      
      {/* Top Header Control Bar */}
      <div className="px-8 py-5 flex items-center justify-between flex-wrap gap-4 z-20 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div>
          <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Peta Jaringan Topologi 3D" }]} />
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-1">
            Peta Jaringan Topologi Graf 3D
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-semibold mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{nodes.length} Perangkat Terhubung &bull; {edges.length} Interkoneksi Aktif</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Layout Mode Selector */}
          <select 
            value={layoutMode} 
            onChange={e => setLayoutMode(e.target.value)}
            className="px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="tier">📐 Tata Letak Hirarki NOC (Tiered)</option>
            <option value="radial">🪐 Tata Letak Orbit 3D Melingkar (Radial)</option>
          </select>

          {/* Filter Tipe Hardware */}
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="">Semua Tipe Hardware</option>
            <option value="router">Router (Cylinder Cyan)</option>
            <option value="switch">Switch (Hub Indigo)</option>
            <option value="server">Server (Tower Emerald)</option>
            <option value="firewall">Firewall (Benteng Red)</option>
            <option value="access_point">Access Point (Dish Amber)</option>
            <option value="ups">UPS Battery (Pink)</option>
          </select>

          {/* Filter Status */}
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="">Semua Status Operasional</option>
            {["active","inactive","maintenance","down"].map(s =>
              <option key={s} value={s} className="capitalize">{s}</option>
            )}
          </select>

          {simFailed && (
            <button onClick={() => setSimFailed(null)}
              className="px-4 py-3 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold rounded-2xl animate-pulse backdrop-blur-md shadow-md">
              Matikan Simulasi Kegagalan
            </button>
          )}

          {/* "+ Tambah Koneksi Baru" Button - Always visible and clickable */}
          <button 
            id="btn-add-connection"
            onClick={() => navigate("/mapping/create-connection")}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 shadow-[0_0_25px_rgba(59,130,246,0.45)] hover:shadow-[0_0_35px_rgba(59,130,246,0.7)] text-white text-sm font-black rounded-2xl transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>+ Tambah Koneksi Baru</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* 3D Canvas */}
        <div className="flex-1 relative cursor-grab active:cursor-grabbing">
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#030712_100%)] pointer-events-none z-10" />
          
          <Canvas camera={{ position: [0, 18, 32], fov: 45 }}>
            <color attach="background" args={['#030712']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[15, 25, 15]} intensity={1.8} color="#e2e8f0" />
            <pointLight position={[-15, 12, -15]} intensity={1.2} color="#3b82f6" />
            <pointLight position={[15, -10, 15]} intensity={0.8} color="#8b5cf6" />
            
            <OrbitControls 
              enableDamping 
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={70}
              maxPolarAngle={Math.PI / 2 + 0.15}
            />

            {/* Grid Floor */}
            <gridHelper args={[80, 80, "#334155", "#0f172a"]} position={[0, -12, 0]} />

            {/* Edges */}
            {visibleEdges.map(e => {
              const s = getNode(e.source);
              const t = getNode(e.target);
              if (!s || !t) return null;
              
              const isDown = simFailed && (e.source === simFailed || e.target === simFailed);
              const isSelected = selected && (e.source === selected || e.target === selected);
              
              return (
                <AnimatedEdge 
                  key={e.id}
                  source={s}
                  target={t}
                  type={e.type}
                  isDown={isDown}
                  selected={isSelected}
                />
              );
            })}

            {/* Nodes */}
            {visibleNodes.map(n => {
              const effStatus = getEffectiveStatus(n);
              return (
                <NetworkNode 
                  key={n.id}
                  node={n}
                  isDown={effStatus === "down"}
                  selected={n.id === selected}
                  onClick={setSelected}
                />
              );
            })}
          </Canvas>
          
          {/* Helper overlay */}
          <div className="absolute bottom-6 left-6 z-20 bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 p-5 rounded-3xl shadow-2xl">
            <h4 className="text-xs font-black text-slate-200 mb-2.5 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-blue-400" /> Kontrol Navigasi Topologi 3D
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
              <li>🖱️ <strong className="text-white">Klik & Geser Kiri:</strong> Rotasi kamera 360°</li>
              <li>🖱️ <strong className="text-white">Klik Kanan / Pan:</strong> Geser pandangan</li>
              <li>🔍 <strong className="text-white">Scroll Roda:</strong> Zoom in / out</li>
              <li>👆 <strong className="text-blue-400">Klik Node Perangkat:</strong> Inspeksi koneksi & simulasi</li>
            </ul>
          </div>
        </div>

        {/* Side Panel: Node Inspector */}
        <div className={`w-88 bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 p-6 overflow-y-auto flex-shrink-0 transition-transform duration-300 z-20 ${selected ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}>
          {selectedNode && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3.5">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-lg"
                    style={{ background: `${TYPE_COLOR[selectedNode.type]}25`, border: `1px solid ${TYPE_COLOR[selectedNode.type]}50`, color: TYPE_COLOR[selectedNode.type] }}
                  >
                    {selectedNode.type?.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-100 text-lg leading-tight">{selectedNode.name}</h3>
                    <p className="text-xs text-slate-400 capitalize font-semibold">{TYPE_LABEL[selectedNode.type] ?? selectedNode.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelected(null)} 
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Info Card */}
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Parameter Hardware</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status Operasional:</span>
                      <span className="font-bold capitalize" style={{ color: STATUS_C[selectedNode.status] }}>
                        {selectedNode.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP Address:</span>
                      <span className="font-mono text-slate-200 font-bold">{selectedNode.ip ?? "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vendor / Model:</span>
                      <span className="text-slate-200 truncate max-w-[150px]">{selectedNode.vendor ?? "-"} {selectedNode.model ?? ""}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lokasi Penempatan:</span>
                      <span className="text-slate-200">{selectedNode.location ?? "-"}</span>
                    </div>
                  </div>
                </div>

                {/* AI & Failure Simulation */}
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={14} className="text-indigo-400" /> Uji Kegagalan (Failure Sim)
                  </h4>
                  <button 
                    onClick={() => handleSimFail(selectedNode.id)}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all border shadow-lg ${
                      simFailed === selectedNode.id 
                      ? "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30 animate-pulse" 
                      : "bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600 hover:text-white"
                    }`}
                  >
                    {simFailed === selectedNode.id ? "Matikan Simulasi Insiden" : "Simulasikan Node Down"}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    Evaluasi efek domino dan pemutusan jalur interkoneksi ke node sekitar secara real-time.
                  </p>
                </div>

                {/* Connected Edges */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Jalur Interkoneksi Terhubung ({selectedEdges.length})
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedEdges.map(e => {
                      const other = e.source === selectedNode.id ? getNode(e.target) : getNode(e.source);
                      const dir   = e.source === selectedNode.id ? "→" : "←";
                      return (
                        <div key={e.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between group shadow-sm">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CONN_COLOR[e.type] }} />
                            <span className="text-xs font-bold text-slate-200 truncate">{dir} {other?.name ?? "?"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {e.type}
                            </span>
                            <button 
                              onClick={() => setDeletingConn(e)} 
                              title="Hapus Koneksi"
                              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {selectedEdges.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-4">Belum ada koneksi aktif untuk perangkat ini.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Connection Dialog */}
      {deletingConn && (
        <ConfirmDialog
          title="Konfirmasi Putus Koneksi Topologi"
          message={`Apakah Anda yakin ingin memutus koneksi interkoneksi ${deletingConn.type.toUpperCase()} ini? Tindakan ini akan menghapus link dari peta jaringan 3D.`}
          confirmLabel="Putuskan Koneksi"
          onConfirm={handleConfirmDeleteConn}
          onCancel={() => setDeletingConn(null)}
        />
      )}
    </div>
  );
}
