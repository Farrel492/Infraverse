import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { mappingService } from "../../services/mappingService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import toast from "react-hot-toast";

// 3D Imports
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line, Box, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

const TYPE_COLOR  = { router:"#3b82f6", switch:"#8b5cf6", firewall:"#ef4444", server:"#10b981", access_point:"#f59e0b", ups:"#ec4899", other:"#6b7280" };
const TYPE_ICON   = { router:"RT", switch:"SW", firewall:"FW", server:"SV", access_point:"AP", ups:"UP", other:"OT" };
const STATUS_C    = { active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444" };
const CONN_COLOR  = { fiber:"#3b82f6", utp:"#94a3b8", wireless:"#f59e0b", other:"#6b7280" };

// 3D Layout Generator
function autoLayout(nodes) {
  const order = { router:0, firewall:1, switch:2, server:3, access_point:4, ups:5, other:6 };
  const sorted = [...nodes].sort((a,b) => (order[a.type]??6)-(order[b.type]??6));
  const RADIUS = 12;
  return sorted.map((n, i) => {
    const angle = (2 * Math.PI * i / sorted.length);
    // Y is slightly varied to make it look dynamic
    const yOffset = Math.sin(angle * 3) * 2; 
    return { ...n, x: RADIUS * Math.cos(angle), y: yOffset, z: RADIUS * Math.sin(angle) };
  });
}

// ----------------------------------------------------
// 3D NODE COMPONENT
// ----------------------------------------------------
function NetworkNode({ node, selected, isDown, onClick }) {
  const color = isDown ? "#ef4444" : (STATUS_C[node.status] || "#94a3b8");
  const glowColor = isDown ? "#7f1d1d" : color;
  
  // Floating animation
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = node.y + Math.sin(state.clock.elapsedTime * 2 + node.x) * 0.3;
    }
  });

  return (
    <group position={[node.x, node.y, node.z]} onClick={(e) => { e.stopPropagation(); onClick(node.id); }} ref={meshRef}>
      {/* Glow effect (simple larger sphere with basic material) */}
      {node.status === "active" && !isDown && (
        <Sphere args={[1.5, 16, 16]}>
          <meshBasicMaterial color={glowColor} transparent opacity={0.15} />
        </Sphere>
      )}

      {/* Main Geometry based on type */}
      {["server", "ups"].includes(node.type) ? (
        <Box args={[1.2, 1.8, 1.2]}>
          <meshStandardMaterial color={selected ? "#1e40af" : "#1e293b"} emissive={color} emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
        </Box>
      ) : ["router", "firewall", "switch"].includes(node.type) ? (
        <Cylinder args={[1, 1, 0.5, 32]}>
          <meshStandardMaterial color={selected ? "#1e40af" : "#1e293b"} emissive={color} emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
        </Cylinder>
      ) : (
        <Sphere args={[1, 32, 32]}>
          <meshStandardMaterial color={selected ? "#1e40af" : "#1e293b"} emissive={color} emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
        </Sphere>
      )}

      {/* Status LED indicator */}
      <Sphere args={[0.2, 8, 8]} position={[0, 1.2, 0]}>
        <meshBasicMaterial color={isDown ? "#ef4444" : color} />
      </Sphere>

      {/* HTML Label */}
      <Html position={[0, -1.5, 0]} center zIndexRange={[100, 0]}>
        <div className={`pointer-events-none px-3 py-1.5 rounded-lg border backdrop-blur-md whitespace-nowrap transition-all ${selected ? 'bg-blue-900/80 border-blue-400 scale-110' : 'bg-slate-900/80 border-slate-700/50'}`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: isDown ? "#ef4444" : color, boxShadow: `0 0 8px ${isDown ? "#ef4444" : color}` }} />
            <div>
              <p className="text-xs font-bold text-slate-100">{node.name}</p>
              {isDown && <p className="text-[9px] font-bold text-red-400 mt-0.5">DOWN</p>}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ----------------------------------------------------
// 3D EDGE COMPONENT (With Packet Animation)
// ----------------------------------------------------
function AnimatedEdge({ source, target, type, isDown, selected }) {
  const points = useMemo(() => [
    new THREE.Vector3(source.x, source.y, source.z),
    new THREE.Vector3(target.x, target.y, target.z)
  ], [source, target]);

  const color = isDown ? "#ef4444" : (CONN_COLOR[type] || "#94a3b8");
  const dashScale = type === "wireless" || isDown ? 0.5 : 100;

  // Packet animation
  const packetRef = useRef();
  const [packetProgress, setPacketProgress] = useState(Math.random());

  useFrame((state, delta) => {
    if (isDown) return; // Stop animation if down
    let next = packetProgress + delta * 0.5; // Speed
    if (next > 1) next = 0;
    setPacketProgress(next);

    if (packetRef.current) {
      // Interpolate position along the line
      const vec = new THREE.Vector3().lerpVectors(points[0], points[1], next);
      packetRef.current.position.copy(vec);
    }
  });

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={selected ? 3 : 1.5}
        dashed={dashScale < 100}
        dashScale={dashScale}
        transparent
        opacity={selected ? 1 : 0.4}
      />
      {!isDown && (
        <Sphere ref={packetRef} args={[0.2, 8, 8]}>
          <meshBasicMaterial color={color} transparent opacity={selected ? 1 : 0.6} />
        </Sphere>
      )}
      {/* Optional: Add label on the line if selected */}
      {selected && (
        <Html position={new THREE.Vector3().lerpVectors(points[0], points[1], 0.5)} center>
          <div className="bg-slate-900/80 px-1.5 py-0.5 rounded text-[9px] text-slate-300 border border-slate-700 backdrop-blur-sm pointer-events-none">
            {type}
          </div>
        </Html>
      )}
    </group>
  );
}

// ----------------------------------------------------
// MAIN PAGE
// ----------------------------------------------------
export default function MappingPage() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const canWrite  = user?.role === "admin" || user?.role === "teknisi";

  const [nodes, setNodes]         = useState([]);
  const [edges, setEdges]         = useState([]);
  const [rawNodes, setRawNodes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [simFailed, setSimFailed] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [connForm, setConnForm]   = useState({ source_device_id:"", target_device_id:"", connection_type:"utp", port_source:"", port_target:"" });
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await mappingService.getTopology();
      const positioned = autoLayout(res.data.nodes);
      setNodes(positioned);
      setRawNodes(res.data.nodes);
      setEdges(res.data.edges);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getNode = id => nodes.find(n => n.id === id);

  const visibleNodes = filterStatus ? nodes.filter(n => n.status === filterStatus) : nodes;
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
      toast(`Simulasi: ${node?.name} down — jalur terdampak ditampilkan`);
    }
  };

  const handleDeleteConn = async (id) => {
    if (!window.confirm("Hapus koneksi ini?")) return;
    await mappingService.deleteConnection(id);
    toast.success("Koneksi dihapus.");
    load();
  };

  const handleAddConn = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await mappingService.addConnection(connForm);
      toast.success("Koneksi ditambahkan.");
      setShowAdd(false); load();
    } catch { toast.error("Gagal menambah koneksi."); }
    finally { setSaving(false); }
  };

  const selectedNode  = selected ? nodes.find(n => n.id === selected) : null;
  const selectedEdges = selected ? edges.filter(e => e.source === selected || e.target === selected) : [];

  if (loading) return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="px-8 pt-6 pb-3 flex items-center justify-between flex-wrap gap-3 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div>
          <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Digital Twin 3D" }]} />
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Smart 3D Mapping
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">{nodes.length} perangkat / {edges.length} koneksi aktif</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-300 text-xs focus:outline-none backdrop-blur-md">
            <option value="">Semua Status</option>
            {["active","inactive","maintenance","down"].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
          {simFailed && (
            <button onClick={() => setSimFailed(null)}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-xs rounded-lg animate-pulse backdrop-blur-md">
              Sim Mode ON — Matikan
            </button>
          )}
          {canWrite && (
            <button onClick={() => navigate("/mapping/create-connection")}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white text-xs font-bold rounded-xl transition-all">
              + Tambah Koneksi Baru
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* 3D Canvas */}
        <div className="flex-1 relative cursor-grab active:cursor-grabbing">
          {/* Overlay Grid/Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#0f172a_100%)] pointer-events-none z-10" />
          
          <Canvas camera={{ position: [0, 15, 25], fov: 45 }}>
            <color attach="background" args={['#09090b']} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1.5} color="#cbd5e1" />
            <pointLight position={[-10, 10, -10]} intensity={1} color="#3b82f6" />
            
            <OrbitControls 
              enableDamping 
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={50}
              maxPolarAngle={Math.PI / 2 + 0.1}
            />

            {/* Grid Floor */}
            <gridHelper args={[60, 60, "#1e293b", "#0f172a"]} position={[0, -5, 0]} />

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
          <div className="absolute bottom-6 left-6 z-20 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Navigasi 3D</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>🖱️ <strong className="text-slate-300">Kiri:</strong> Putar kamera</li>
              <li>🖱️ <strong className="text-slate-300">Kanan:</strong> Geser pandangan (Pan)</li>
              <li>🖱️ <strong className="text-slate-300">Scroll:</strong> Zoom in/out</li>
              <li>👆 <strong className="text-slate-300">Klik Node:</strong> Lihat detail</li>
            </ul>
          </div>
        </div>

        {/* Side panel (Sidebar) */}
        <div className={`w-80 bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 p-6 overflow-y-auto flex-shrink-0 transition-transform duration-300 z-20 ${selected ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}>
          {selectedNode && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black">
                    {TYPE_ICON[selectedNode.type] ?? "OT"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-lg leading-tight">{selectedNode.name}</h3>
                    <p className="text-xs text-slate-500 capitalize font-medium">{selectedNode.type?.replace("_"," ")}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Informasi Sistem</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Status</span>
                      <span className="text-xs font-bold capitalize" style={{color: STATUS_C[selectedNode.status]}}>{selectedNode.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">IP Address</span>
                      <span className="text-xs text-slate-300 font-mono">{selectedNode.ip ?? "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Vendor</span>
                      <span className="text-xs text-slate-300 truncate max-w-[120px]">{selectedNode.vendor ?? "-"} {selectedNode.model ?? ""}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Lokasi</span>
                      <span className="text-xs text-slate-300">{selectedNode.location ?? "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">AI Copilot & Simulasi</h4>
                  <button 
                    onClick={() => handleSimFail(selectedNode.id)}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all border ${
                      simFailed === selectedNode.id 
                      ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" 
                      : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:text-white"
                    }`}
                  >
                    {simFailed === selectedNode.id ? "Matikan Simulasi Kegagalan" : "Simulasikan Kegagalan (Failure)"}
                  </button>
                  <p className="text-[10px] text-slate-500 mt-2 text-center leading-relaxed">
                    Lihat dampak (efek domino) jika perangkat ini mengalami *down*.
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Koneksi Aktif ({selectedEdges.length})</h4>
                  <div className="space-y-2">
                    {selectedEdges.map(e => {
                      const other = e.source === selectedNode.id ? getNode(e.target) : getNode(e.source);
                      const dir   = e.source === selectedNode.id ? "→" : "←";
                      return (
                        <div key={e.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between group">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-2 h-2 rounded-full" style={{ background: CONN_COLOR[e.type] }} />
                            <span className="text-xs font-medium text-slate-300 truncate">{dir} {other?.name ?? "?"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 uppercase">{e.type}</span>
                            {canWrite && (
                              <button onClick={() => handleDeleteConn(e.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/20 rounded transition-all">
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <Modal 
          title="Tambah Koneksi Jaringan Baru" 
          subtitle="Hubungkan dua perangkat IT dengan jalur kabel Fiber Optic, UTP, atau Wireless."
          maxWidth="max-w-xl"
          onClose={() => setShowAdd(false)}
        >
          <form onSubmit={handleAddConn} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Dari Perangkat (Source) <span className="text-blue-400">*</span>
                </label>
                <select required value={connForm.source_device_id}
                  onChange={e => setConnForm({...connForm, source_device_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all">
                  <option value="">-- Pilih Perangkat Sumber --</option>
                  {rawNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ke Perangkat (Target) <span className="text-blue-400">*</span>
                </label>
                <select required value={connForm.target_device_id}
                  onChange={e => setConnForm({...connForm, target_device_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all">
                  <option value="">-- Pilih Perangkat Tujuan --</option>
                  {rawNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tipe Media Koneksi <span className="text-blue-400">*</span>
              </label>
              <select value={connForm.connection_type}
                onChange={e => setConnForm({...connForm, connection_type: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all capitalize">
                {["fiber","utp","wireless","other"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Port Sumber (e.g. Gi0/1)
                </label>
                <input value={connForm.port_source} placeholder="Gi0/1"
                  onChange={e => setConnForm({...connForm, port_source: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Port Tujuan (e.g. Fa0/24)
                </label>
                <input value={connForm.port_target} placeholder="Fa0/24"
                  onChange={e => setConnForm({...connForm, port_target: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div className="flex gap-4 pt-3">
              <button type="button" onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? "Menyimpan Koneksi..." : "Simpan Koneksi Jaringan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
