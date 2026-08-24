if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "src\pages\Mapping","src\pages\Dashboard","src\services" | Out-Null

Write-Host "Menulis services..." -ForegroundColor Cyan

@'
import api from "./api";
export const mappingService = {
  getTopology: () => api.get("/mapping/topology"),
  addConnection: (data) => api.post("/mapping/connections", data),
  deleteConnection: (id) => api.delete(`/mapping/connections/${id}`),
};
'@ | Set-Content -Path "src\services\mappingService.js" -Encoding ascii

@'
import api from "./api";
export const analyticsService = {
  getSummary:    () => api.get("/analytics/summary"),
  getPredictive: () => api.get("/analytics/predictive"),
};
'@ | Set-Content -Path "src\services\analyticsService.js" -Encoding ascii

Write-Host "Menulis MappingPage (topologi interaktif)..." -ForegroundColor Cyan

@'
import { useEffect, useRef, useState } from "react";
import { mappingService } from "../../services/mappingService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";

const TYPE_COLOR = {
  router: "#3b82f6", switch: "#8b5cf6", firewall: "#ef4444",
  server: "#10b981", access_point: "#f59e0b", ups: "#ec4899", other: "#6b7280",
};
const TYPE_ICON = {
  router:"🔀", switch:"🔌", firewall:"🛡", server:"🖥", access_point:"📡", ups:"🔋", other:"📦",
};
const STATUS_BORDER = {
  active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444",
};
const CONN_COLOR = { fiber:"#3b82f6", utp:"#94a3b8", wireless:"#f59e0b", other:"#6b7280" };
const NODE_W = 140, NODE_H = 60, RADIUS = 220;

function autoLayout(nodes) {
  const pinned = { router:0, firewall:1, switch:2, server:3, access_point:4, ups:5, other:6 };
  const sorted = [...nodes].sort((a,b) => (pinned[a.type]??6)-(pinned[b.type]??6));
  const cx = 520, cy = 320;
  return sorted.map((n, i) => {
    const angle = (2 * Math.PI * i) / sorted.length - Math.PI / 2;
    return { ...n, x: cx + RADIUS * Math.cos(angle), y: cy + RADIUS * Math.sin(angle) };
  });
}

export default function MappingPage() {
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";
  const svgRef  = useRef(null);

  const [nodes, setNodes]       = useState([]);
  const [edges, setEdges]       = useState([]);
  const [rawNodes, setRawNodes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [drag, setDrag]         = useState(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [connForm, setConnForm] = useState({ source_device_id:"", target_device_id:"", connection_type:"utp", port_source:"", port_target:"" });
  const [saving, setSaving]     = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

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

  const visibleNodes = filterStatus
    ? nodes.filter(n => n.status === filterStatus)
    : nodes;
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));

  const getNode = (id) => nodes.find(n => n.id === id);

  const onMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const svg = svgRef.current;
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const node = nodes.find(n => n.id === nodeId);
    setDrag({ nodeId, offsetX: svgP.x - node.x, offsetY: svgP.y - node.y });
    setSelected(nodeId);
  };

  const onMouseMove = (e) => {
    if (!drag) return;
    const svg = svgRef.current;
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    setNodes(prev => prev.map(n =>
      n.id === drag.nodeId
        ? { ...n, x: svgP.x - drag.offsetX, y: svgP.y - drag.offsetY }
        : n
    ));
  };

  const onMouseUp = () => setDrag(null);

  const handleDeleteConn = async (id) => {
    if (!window.confirm("Hapus koneksi ini?")) return;
    await mappingService.deleteConnection(id);
    load();
  };

  const handleAddConn = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await mappingService.addConnection(connForm);
      setShowAdd(false); load();
    } finally { setSaving(false); }
  };

  const selectedNode = selected ? nodes.find(n => n.id === selected) : null;
  const selectedEdges = selected ? edges.filter(e => e.source === selected || e.target === selected) : [];

  if (loading) return <div className="p-8 text-slate-400">Memuat topologi jaringan...</div>;

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1 relative bg-slate-900">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs focus:outline-none">
            <option value="">Semua Status</option>
            {["active","inactive","maintenance","down"].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
          {canWrite && (
            <button onClick={() => setShowAdd(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg">
              + Tambah Koneksi
            </button>
          )}
          <button onClick={() => { setNodes(autoLayout(rawNodes)); setSelected(null); }}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg">
            Reset Layout
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs space-y-1">
          <p className="text-slate-400 font-medium mb-2">Tipe Koneksi</p>
          {Object.entries(CONN_COLOR).map(([k,c]) => (
            <div key={k} className="flex items-center gap-2">
              <div className="w-6 h-0.5" style={{ background: c }} />
              <span className="text-slate-400 capitalize">{k}</span>
            </div>
          ))}
        </div>

        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 1040 640"
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onClick={() => setSelected(null)}
          style={{ cursor: drag ? "grabbing" : "default" }}
        >
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#475569" />
            </marker>
          </defs>

          {/* Grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
          </pattern>
          <rect width="1040" height="640" fill="url(#grid)" />

          {/* Edges */}
          {visibleEdges.map((e) => {
            const s = getNode(e.source);
            const t = getNode(e.target);
            if (!s || !t) return null;
            const sx = s.x + NODE_W / 2, sy = s.y + NODE_H / 2;
            const tx = t.x + NODE_W / 2, ty = t.y + NODE_H / 2;
            const mx = (sx + tx) / 2, my = (sy + ty) / 2;
            const isHighlighted = selected && (e.source === selected || e.target === selected);
            return (
              <g key={e.id}>
                <line x1={sx} y1={sy} x2={tx} y2={ty}
                  stroke={CONN_COLOR[e.type] ?? "#94a3b8"}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={e.type === "wireless" ? "6,4" : undefined}
                  strokeOpacity={selected && !isHighlighted ? 0.2 : 1}
                  markerEnd="url(#arrow)"
                />
                <text x={mx} y={my - 5} textAnchor="middle" fontSize="9" fill="#64748b">
                  {e.port_source && e.port_target ? `${e.port_source}→${e.port_target}` : e.type}
                </text>
                {canWrite && isHighlighted && (
                  <text x={mx} y={my + 12} textAnchor="middle" fontSize="9" fill="#ef4444"
                    style={{ cursor:"pointer" }}
                    onClick={(ev) => { ev.stopPropagation(); handleDeleteConn(e.id); }}>
                    ✕ hapus
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {visibleNodes.map((n) => {
            const isSelected = n.id === selected;
            const borderColor = STATUS_BORDER[n.status] ?? "#6b7280";
            return (
              <g key={n.id} transform={`translate(${n.x},${n.y})`}
                style={{ cursor: "grab" }}
                onMouseDown={(e) => onMouseDown(e, n.id)}
                onClick={(e) => { e.stopPropagation(); setSelected(n.id); }}
              >
                <rect width={NODE_W} height={NODE_H} rx="8"
                  fill={isSelected ? "#1e3a5f" : "#1e293b"}
                  stroke={isSelected ? "#3b82f6" : borderColor}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                <text x="12" y="22" fontSize="14">{TYPE_ICON[n.type] ?? "📦"}</text>
                <text x="32" y="22" fontSize="11" fontWeight="600" fill="#f1f5f9">
                  {n.name.length > 14 ? n.name.slice(0,14)+"…" : n.name}
                </text>
                <text x="12" y="38" fontSize="9" fill="#64748b">{n.vendor} {n.model}</text>
                <text x="12" y="52" fontSize="9" fill="#64748b" fontFamily="monospace">{n.ip ?? ""}</text>
                <circle cx={NODE_W - 10} cy={10} r="5" fill={borderColor} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Side panel */}
      <div className="w-72 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
        {selectedNode ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{TYPE_ICON[selectedNode.type]}</span>
              <div>
                <h3 className="font-semibold text-slate-100">{selectedNode.name}</h3>
                <p className="text-xs text-slate-400 capitalize">{selectedNode.type}</p>
              </div>
            </div>
            {[
              ["Vendor / Model", `${selectedNode.vendor ?? "—"} ${selectedNode.model ?? ""}`],
              ["IP Address", selectedNode.ip ?? "—"],
              ["Status", selectedNode.status],
              ["Lokasi", selectedNode.location ?? "—"],
            ].map(([label, val]) => (
              <div key={label} className="mb-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm text-slate-200 capitalize">{val}</p>
              </div>
            ))}
            <hr className="border-slate-700 my-3" />
            <p className="text-xs text-slate-500 mb-2">Koneksi ({selectedEdges.length})</p>
            {selectedEdges.map(e => {
              const other = e.source === selectedNode.id ? getNode(e.target) : getNode(e.source);
              const dir   = e.source === selectedNode.id ? "→" : "←";
              return (
                <div key={e.id} className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <span style={{ color: CONN_COLOR[e.type] }}>●</span>
                  {dir} {other?.name ?? "?"} <span className="text-slate-600">({e.type})</span>
                </div>
              );
            })}
          </>
        ) : (
          <div className="text-center text-slate-500 text-sm mt-8">
            <p className="text-2xl mb-2">🔗</p>
            <p>Klik node untuk melihat detail</p>
            <hr className="border-slate-700 my-4" />
            <p className="font-medium text-slate-400">{nodes.length} Perangkat</p>
            <p className="mt-1">{edges.length} Koneksi</p>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Tambah Koneksi" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAddConn} className="space-y-3">
            {[
              { label:"Dari Perangkat", key:"source_device_id" },
              { label:"Ke Perangkat",   key:"target_device_id" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <select required value={connForm[key]}
                  onChange={e => setConnForm({...connForm, [key]: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Pilih perangkat</option>
                  {rawNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipe Koneksi</label>
              <select value={connForm.connection_type}
                onChange={e => setConnForm({...connForm, connection_type: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                {["fiber","utp","wireless","other"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {[
              { label:"Port Sumber", key:"port_source" },
              { label:"Port Tujuan", key:"port_target" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input value={connForm[key]}
                  onChange={e => setConnForm({...connForm, [key]: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Mapping\MappingPage.jsx" -Encoding ascii

Write-Host "Menulis DashboardPage (analytics nyata)..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { analyticsService } from "../../services/analyticsService";

const riskColor = { high:"text-red-400 bg-red-500/10 border-red-500/20", medium:"text-yellow-400 bg-yellow-500/10 border-yellow-500/20" };
const statusColor = { active:"text-green-400", inactive:"text-slate-400", maintenance:"text-yellow-400", down:"text-red-400" };
const typeIcon = { router:"🔀", switch:"🔌", firewall:"🛡", server:"🖥", access_point:"📡", ups:"🔋", other:"📦" };

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary]     = useState(null);
  const [predictive, setPredictive] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getSummary(),
      analyticsService.getPredictive(),
    ]).then(([s, p]) => {
      setSummary(s.data);
      setPredictive(p.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-400">Memuat dashboard...</div>;

  const stats = [
    { label:"Total Perangkat",   value: summary.total_devices,          icon:"🖥",  color:"blue",   path:"/assets" },
    { label:"Perangkat Aktif",   value: summary.by_status?.active ?? 0, icon:"✅",  color:"green",  path:"/assets?status=active" },
    { label:"Perangkat Down",    value: summary.by_status?.down ?? 0,   icon:"🔴",  color:"red",    path:"/assets?status=down" },
    { label:"Maintenance/30hr",  value: summary.upcoming_maintenances?.length ?? 0, icon:"🔧", color:"yellow", path:"/assets" },
    { label:"Garansi Kedaluwarsa", value: summary.warranty_expired,     icon:"⚠️", color:"orange",  path:"/assets" },
    { label:"Simulasi Dijalankan", value: summary.simulations_run,      icon:"⚡",  color:"purple", path:"/simulation" },
  ];

  const colorMap = {
    blue:"border-blue-500/30 bg-blue-500/10", green:"border-green-500/30 bg-green-500/10",
    red:"border-red-500/30 bg-red-500/10", yellow:"border-yellow-500/30 bg-yellow-500/10",
    orange:"border-orange-500/30 bg-orange-500/10", purple:"border-purple-500/30 bg-purple-500/10",
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Selamat datang, {user?.name} 👋</h2>
        <p className="text-slate-400 text-sm mt-1">InfraVerse · Smart Infrastructure Digital Twin Platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(s => (
          <button key={s.label} onClick={() => navigate(s.path)}
            className={`border rounded-xl p-4 text-left hover:brightness-110 transition-all ${colorMap[s.color]}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* By Type */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Perangkat per Tipe</h3>
          <div className="space-y-2">
            {Object.entries(summary.by_type ?? {}).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="w-6 text-center">{typeIcon[type] ?? "📦"}</span>
                <span className="text-sm text-slate-300 capitalize w-28">{type.replace("_"," ")}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(count / summary.total_devices) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-100 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Prediksi Perangkat Perlu Perhatian
            <span className="ml-2 text-xs font-normal text-slate-500">({predictive.length} alert)</span>
          </h3>
          {predictive.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Semua perangkat dalam kondisi baik ✓</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {predictive.map(p => (
                <div key={p.device_id}
                  className={`border rounded-lg px-3 py-2 text-xs ${riskColor[p.risk]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{typeIcon[p.type] ?? "📦"}</span>
                    <span className="font-semibold">{p.name}</span>
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-xs font-bold uppercase ${p.risk === "high" ? "bg-red-500/30" : "bg-yellow-500/30"}`}>{p.risk}</span>
                  </div>
                  {p.reasons.map((r, i) => <p key={i} className="opacity-80">• {r}</p>)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Maintenance */}
      {summary.upcoming_maintenances?.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Maintenance Terjadwal (30 Hari ke Depan)</h3>
          <div className="space-y-2">
            {summary.upcoming_maintenances.map((m, i) => (
              <div key={i} className="flex items-center gap-4 text-sm text-slate-300 py-2 border-b border-slate-700/50 last:border-0">
                <span className="text-yellow-400">🔧</span>
                <span className="font-medium">{m.device}</span>
                <span className="text-slate-500 capitalize text-xs">{m.type}</span>
                <span className="ml-auto text-xs text-slate-400">{m.scheduled_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Stats */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Statistik Simulasi</h3>
        <div className="flex gap-8">
          <div>
            <p className="text-3xl font-bold text-purple-400">{summary.simulations_run}</p>
            <p className="text-xs text-slate-400 mt-1">Total simulasi dijalankan</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400">{summary.simulations_resolved}</p>
            <p className="text-xs text-slate-400 mt-1">Berhasil diselesaikan</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-400">
              {summary.simulations_run > 0
                ? Math.round((summary.simulations_resolved / summary.simulations_run) * 100)
                : 0}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Success rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Dashboard\DashboardPage.jsx" -Encoding ascii

Write-Host "Update AppRoutes (tambah Mapping)..." -ForegroundColor Cyan

@'
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import LoginPage from "../pages/Auth/LoginPage.jsx";
import RegisterPage from "../pages/Auth/RegisterPage.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";
import BuildingPage from "../pages/Building/BuildingPage.jsx";
import BuildingDetailPage from "../pages/Building/BuildingDetailPage.jsx";
import AssetsPage from "../pages/Assets/AssetsPage.jsx";
import MappingPage from "../pages/Mapping/MappingPage.jsx";
import MainLayout from "../components/layout/MainLayout.jsx";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="buildings"     element={<BuildingPage />} />
        <Route path="buildings/:id" element={<BuildingDetailPage />} />
        <Route path="assets"        element={<AssetsPage />} />
        <Route path="mapping"       element={<MappingPage />} />
      </Route>
    </Routes>
  );
}
'@ | Set-Content -Path "src\routes\AppRoutes.jsx" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Phase 4+5 frontend siap." -ForegroundColor Green
Write-Host "Buka http://localhost:5173/mapping dan /dashboard" -ForegroundColor Yellow