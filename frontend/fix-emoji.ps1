if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

Write-Host "Fix emoji - ganti dengan Lucide icons..." -ForegroundColor Cyan

@'
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Building2, Server, Network, Zap,
  Globe, Wrench, LogOut, ChevronRight, User
} from "lucide-react";
import useAuthStore from "../../stores/authStore";
import { authService } from "../../services/authService";
import { analyticsService } from "../../services/analyticsService";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard",    label: "Dashboard",    Icon: LayoutDashboard, alertKey: null },
  { to: "/buildings",    label: "Gedung",        Icon: Building2,       alertKey: null },
  { to: "/assets",       label: "Aset",          Icon: Server,          alertKey: "down" },
  { to: "/mapping",      label: "Peta Jaringan", Icon: Network,         alertKey: null },
  { to: "/simulation",   label: "Simulasi",      Icon: Zap,             alertKey: null },
  { to: "/digital-twin", label: "Digital Twin",  Icon: Globe,           alertKey: null },
  { to: "/maintenance",  label: "Maintenance",   Icon: Wrench,          alertKey: "maintenance" },
];

export default function MainLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState({ down: 0, maintenance: 0 });

  useEffect(() => {
    analyticsService.getSummary().then(res => {
      setAlerts({
        down:        res.data.by_status?.down ?? 0,
        maintenance: res.data.upcoming_maintenances?.length ?? 0,
      });
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); toast.success("Berhasil keluar."); }
    finally { clearAuth(); navigate("/login"); }
  };

  const roleColor = { admin:"text-red-400", teknisi:"text-blue-400", viewer:"text-green-400" };
  const roleLabel = { admin:"Administrator", teknisi:"Teknisi IT", viewer:"Viewer" };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-lg select-none">
              IV
            </div>
            <div>
              <h1 className="text-sm font-bold text-blue-400 leading-none">InfraVerse</h1>
              <p className="text-xs text-slate-500 mt-0.5">Digital Twin Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2 mt-1">
            Menu Utama
          </p>
          {navItems.map(({ to, label, Icon, alertKey }) => {
            const badgeCount = alertKey ? alerts[alertKey] : 0;
            return (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-700/70 hover:text-slate-100"
                  }`
                }>
                <span className="flex items-center gap-3">
                  <Icon size={16} strokeWidth={1.8} />
                  {label}
                </span>
                {badgeCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-700">
          <NavLink to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 ${
                isActive ? "bg-slate-700" : "hover:bg-slate-700/70"
              }`
            }>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-100 leading-none truncate">
                {user?.name ?? "User"}
              </p>
              <p className={`text-xs mt-0.5 ${roleColor[user?.role] ?? "text-slate-500"}`}>
                {roleLabel[user?.role] ?? user?.role}
              </p>
            </div>
            <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />
          </NavLink>
          <button onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-slate-500 hover:text-red-400 hover:bg-slate-700/70 rounded-lg transition-colors text-left flex items-center gap-2">
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
'@ | Set-Content -Path "src\components\layout\MainLayout.jsx" -Encoding ascii

Write-Host "Fix DashboardPage icons..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { analyticsService } from "../../services/analyticsService";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import {
  Server, CheckCircle, XCircle, Wrench, ShieldAlert,
  Zap, Router, Shield, Network, Cpu, Wifi, Battery, Package,
  TrendingUp, AlertTriangle, Calendar, Activity
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUS_COLOR = { active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444" };
const STATUS_LABEL = { active:"Aktif", inactive:"Nonaktif", maintenance:"Maintenance", down:"Down" };

const TYPE_ICON_MAP = {
  router:       <Router size={16} />,
  switch:       <Network size={16} />,
  firewall:     <Shield size={16} />,
  server:       <Server size={16} />,
  access_point: <Wifi size={16} />,
  ups:          <Battery size={16} />,
  other:        <Package size={16} />,
};
const TYPE_COLOR = ["#3b82f6","#8b5cf6","#ef4444","#10b981","#f59e0b","#ec4899","#6b7280"];
const RISK_COLOR = {
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

function AnimatedCounter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 20) || 1;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary]       = useState(null);
  const [predictive, setPredictive] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([analyticsService.getSummary(), analyticsService.getPredictive()])
      .then(([s, p]) => { setSummary(s.data); setPredictive(p.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 space-y-6">
      <div className="h-8 bg-slate-700 rounded w-64 animate-pulse mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  const statCards = [
    { label:"Total Perangkat",     value: summary.total_devices,                      Icon: Server,       color:"blue",   path:"/assets" },
    { label:"Perangkat Aktif",     value: summary.by_status?.active ?? 0,             Icon: CheckCircle,  color:"green",  path:"/assets" },
    { label:"Perangkat Down",      value: summary.by_status?.down ?? 0,               Icon: XCircle,      color:"red",    path:"/assets", alert: (summary.by_status?.down ?? 0) > 0 },
    { label:"Maintenance/30hr",    value: summary.upcoming_maintenances?.length ?? 0, Icon: Wrench,       color:"yellow", path:"/maintenance" },
    { label:"Garansi Kedaluwarsa", value: summary.warranty_expired,                   Icon: ShieldAlert,  color:"orange", path:"/assets" },
    { label:"Simulasi Dijalankan", value: summary.simulations_run,                    Icon: Zap,          color:"purple", path:"/simulation" },
  ];

  const colorMap = {
    blue:  "border-blue-500/30 bg-blue-500/5 hover:border-blue-400/60",
    green: "border-green-500/30 bg-green-500/5 hover:border-green-400/60",
    red:   "border-red-500/30 bg-red-500/5 hover:border-red-400/60",
    yellow:"border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-400/60",
    orange:"border-orange-500/30 bg-orange-500/5 hover:border-orange-400/60",
    purple:"border-purple-500/30 bg-purple-500/5 hover:border-purple-400/60",
  };
  const iconColor = {
    blue:"text-blue-400", green:"text-green-400", red:"text-red-400",
    yellow:"text-yellow-400", orange:"text-orange-400", purple:"text-purple-400",
  };

  const byTypeChart = Object.entries(summary.by_type ?? {}).map(([type, count], i) => ({
    name: type.replace("_"," "), count, fill: TYPE_COLOR[i % TYPE_COLOR.length],
  }));
  const byStatusChart = Object.entries(summary.by_status ?? {}).map(([status, value]) => ({
    name: STATUS_LABEL[status] ?? status, value, fill: STATUS_COLOR[status] ?? "#6b7280",
  }));

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">
            Selamat datang, {user?.name ?? "—"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            InfraVerse · Smart Infrastructure Digital Twin Platform
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">
            {new Date().toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </p>
          <p className="text-xs text-blue-400 mt-0.5 capitalize">Role: {user?.role}</p>
        </div>
      </div>

      {/* Banner tema lomba */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Activity size={20} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-300">
            Ekosistem Digital Cerdas untuk Indonesia
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            InfraVerse membantu pengelolaan infrastruktur digital kampus secara inklusif, efisien, dan berkelanjutan — mendukung transformasi digital Indonesia 2045.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(s => (
          <button key={s.label} onClick={() => navigate(s.path)}
            className={`border rounded-xl p-4 text-left transition-all relative overflow-hidden ${colorMap[s.color]}`}>
            {s.alert && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
            <div className={`mb-3 ${iconColor[s.color]}`}>
              <s.Icon size={22} strokeWidth={1.8} />
            </div>
            <p className="text-2xl font-bold text-slate-100">
              <AnimatedCounter value={s.value} />
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-tight">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Distribusi Perangkat per Tipe</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byTypeChart} margin={{ top:0, right:0, bottom:0, left:-20 }}>
              <XAxis dataKey="name" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:"#1e293b" }} />
              <Bar dataKey="count" name="Jumlah" radius={[4,4,0,0]}>
                {byTypeChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Status Perangkat</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatusChart} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value" nameKey="name">
                {byStatusChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color:"#94a3b8", fontSize:12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictive + Maintenance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Prediksi Perlu Perhatian</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              predictive.length > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
            }`}>
              {predictive.length} alert
            </span>
          </div>
          {predictive.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Semua perangkat dalam kondisi baik</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {predictive.map(p => (
                <div key={p.device_id} className={`border rounded-lg px-3 py-2.5 text-xs ${RISK_COLOR[p.risk]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={iconColor[p.risk === "high" ? "red" : "yellow"]}>
                        {TYPE_ICON_MAP[p.type] ?? <Package size={14} />}
                      </span>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold uppercase ${
                      p.risk === "high" ? "bg-red-500/30" : "bg-yellow-500/30"
                    }`}>{p.risk}</span>
                  </div>
                  {p.reasons.map((r, i) => <p key={i} className="opacity-75">• {r}</p>)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Maintenance Terjadwal</h3>
            <button onClick={() => navigate("/maintenance")}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Lihat Semua <ChevronRight size={12} />
            </button>
          </div>
          {(summary.upcoming_maintenances?.length ?? 0) === 0 ? (
            <div className="text-center py-6">
              <Calendar size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Tidak ada maintenance dalam 30 hari</p>
            </div>
          ) : (
            <div className="space-y-2">
              {summary.upcoming_maintenances.slice(0,5).map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
                  <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench size={14} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{m.device}</p>
                    <p className="text-xs text-slate-500 capitalize">{m.type}</p>
                  </div>
                  <p className="text-xs text-slate-400 flex-shrink-0">
                    {m.scheduled_date
                      ? new Date(m.scheduled_date).toLocaleDateString("id-ID", { day:"numeric", month:"short" })
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Simulation stats */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Statistik Simulation Center</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label:"Total Simulasi",        value: summary.simulations_run,       color:"text-purple-400" },
            { label:"Berhasil Diselesaikan", value: summary.simulations_resolved,  color:"text-green-400" },
            { label:"Success Rate",          value: summary.simulations_run > 0
              ? Math.round((summary.simulations_resolved/summary.simulations_run)*100)+"%"
              : "0%",                                                               color:"text-blue-400" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Dashboard\DashboardPage.jsx" -Encoding ascii

Write-Host "Fix AssetsPage icons..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deviceService } from "../../services/deviceService";
import useAuthStore from "../../stores/authStore";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonTable } from "../../components/shared/Skeleton.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import {
  Router, Shield, Network, Server, Wifi,
  Battery, Package, Search, Plus, Edit2, Trash2
} from "lucide-react";

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

const AGE_COLOR = (age) => {
  if (!age) return "text-slate-400";
  if (age < 3) return "text-green-400";
  if (age < 5) return "text-yellow-400";
  return "text-red-400";
};

export default function AssetsPage() {
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";
  const navigate = useNavigate();

  const [devices, setDevices]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState(null);
  const [deleting, setDeleting]         = useState(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  const emptyForm = {
    rack_id:"", name:"", type:"router", vendor:"", model:"", serial_number:"",
    ip_address:"", mac_address:"", status:"active", purchase_date:"",
    warranty_expiry:"", rack_position:"", rack_units:1,
  };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await deviceService.getAll({ search, type: filterType, status: filterStatus });
      setDevices(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterType, filterStatus]);

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
    <div className="p-8">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Aset" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Manajemen Aset</h2>
          <p className="text-slate-400 text-sm mt-1">{devices.length} perangkat ditemukan</p>
        </div>
        {canWrite && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Tambah Perangkat
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Cari nama, IP, serial..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 w-64" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Semua Tipe</option>
          {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Semua Status</option>
          {DEVICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <SkeletonTable rows={8} /> : devices.length === 0 ? (
        <EmptyState icon={<Server size={40} className="text-slate-600" />}
          title="Tidak ada perangkat" description="Coba ubah filter atau tambah perangkat baru."
          action={canWrite ? { label:"Tambah Perangkat", onClick: openAdd } : null} />
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Perangkat</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Usia</th>
                <th className="px-4 py-3 font-medium">Garansi</th>
                {canWrite && <th className="px-4 py-3 font-medium">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/assets/${d.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400 flex-shrink-0">
                        {TYPE_ICON[d.type] ?? <Package size={16} />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">{d.name}</p>
                        <p className="text-xs text-slate-500">{d.vendor} {d.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{d.ip_address ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    <p>{d.rack?.room?.floor?.building?.name ?? "—"}</p>
                    <p className="text-slate-600">{d.rack?.name ?? "Tidak di rack"}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-xs">
                    {d.age_in_years
                      ? <span className={AGE_COLOR(d.age_in_years)}>{d.age_in_years} thn</span>
                      : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {d.warranty_expiry
                      ? d.is_under_warranty
                        ? <span className="text-green-400">Aktif</span>
                        : <span className="text-red-400">Habis</span>
                      : <span className="text-slate-600">—</span>}
                  </td>
                  {canWrite && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(d)}
                          className="p-1.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleting(d)}
                          className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Perangkat" : "Tambah Perangkat"} onClose={() => setShowForm(false)}>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {[
              { label:"Nama Perangkat", key:"name",          type:"text",   required:true },
              { label:"Vendor",         key:"vendor",         type:"text" },
              { label:"Model",          key:"model",          type:"text" },
              { label:"Serial Number",  key:"serial_number",  type:"text" },
              { label:"IP Address",     key:"ip_address",     type:"text" },
              { label:"MAC Address",    key:"mac_address",    type:"text" },
              { label:"Posisi Rack (U)",key:"rack_position",  type:"number" },
              { label:"Ukuran (U)",     key:"rack_units",     type:"number" },
              { label:"Tanggal Beli",   key:"purchase_date",  type:"date" },
              { label:"Garansi Sampai", key:"warranty_expiry",type:"date" },
            ].map(({ label, key, type, required }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input type={type} required={required} value={form[key]}
                  onChange={e => setForm({...form, [key]: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipe</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                {DEVICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-slate-800 pb-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
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
'@ | Set-Content -Path "src\pages\Assets\AssetsPage.jsx" -Encoding ascii

Write-Host "Fix StatusBadge..." -ForegroundColor Cyan

@'
export default function StatusBadge({ status }) {
  const map = {
    active:      { label:"Aktif",       cls:"bg-green-500/20 text-green-400 border-green-500/30" },
    inactive:    { label:"Nonaktif",    cls:"bg-slate-500/20 text-slate-400 border-slate-500/30" },
    maintenance: { label:"Maintenance", cls:"bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    down:        { label:"Down",        cls:"bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const s = map[status] ?? { label: status ?? "—", cls:"bg-slate-500/20 text-slate-400 border-slate-500/30" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ background: status === "active" ? "#22c55e" : status === "down" ? "#ef4444" : status === "maintenance" ? "#eab308" : "#6b7280" }} />
      {s.label}
    </span>
  );
}
'@ | Set-Content -Path "src\components\shared\StatusBadge.jsx" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Semua emoji diganti Lucide icons." -ForegroundColor Green
Write-Host "Hard refresh browser: Ctrl+Shift+R" -ForegroundColor Yellow