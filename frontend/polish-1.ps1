if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "src\components\shared","src\components\layout","src\pages\Dashboard" | Out-Null

Write-Host "Menulis Toast & Skeleton components..." -ForegroundColor Cyan

@'
import { Toaster } from "react-hot-toast";
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#1e293b",
          color: "#f1f5f9",
          border: "1px solid #334155",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#22c55e", secondary: "#1e293b" } },
        error:   { iconTheme: { primary: "#ef4444", secondary: "#1e293b" } },
      }}
    />
  );
}
'@ | Set-Content -Path "src\components\shared\ToastProvider.jsx" -Encoding ascii

@'
export function SkeletonCard({ className = "" }) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
      <div className="h-8 bg-slate-700 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-700 rounded w-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-700/50 border-b border-slate-700" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-700/50">
          <div className="h-4 bg-slate-700 rounded w-1/4" />
          <div className="h-4 bg-slate-700 rounded w-1/5" />
          <div className="h-4 bg-slate-700 rounded w-1/6" />
          <div className="h-4 bg-slate-700 rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-700 rounded" style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  );
}
'@ | Set-Content -Path "src\components\shared\Skeleton.jsx" -Encoding ascii

@'
export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-slate-600">/</span>}
          {item.href && i < items.length - 1 ? (
            <a href={item.href} className="text-slate-400 hover:text-blue-400 transition-colors">
              {item.label}
            </a>
          ) : (
            <span className={i === items.length - 1 ? "text-slate-100 font-medium" : "text-slate-400"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
'@ | Set-Content -Path "src\components\shared\Breadcrumb.jsx" -Encoding ascii

@'
export default function EmptyState({ icon = "📭", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-6 max-w-sm">{description}</p>}
      {action && (
        <button onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          {action.label}
        </button>
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\components\shared\EmptyState.jsx" -Encoding ascii

Write-Host "Menulis MainLayout dengan badge notifikasi..." -ForegroundColor Cyan

@'
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuthStore from "../../stores/authStore";
import { authService } from "../../services/authService";
import { analyticsService } from "../../services/analyticsService";
import toast from "react-hot-toast";

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
    try {
      await authService.logout();
      toast.success("Berhasil keluar.");
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  const navItems = [
    { to: "/dashboard",    label: "Dashboard",     icon: "▦",  badge: null },
    { to: "/buildings",    label: "Gedung",         icon: "🏢", badge: null },
    { to: "/assets",       label: "Aset",           icon: "🖥", badge: alerts.down > 0 ? alerts.down : null },
    { to: "/mapping",      label: "Peta Jaringan",  icon: "🔗", badge: null },
    { to: "/simulation",   label: "Simulasi",       icon: "⚡", badge: null },
    { to: "/digital-twin", label: "Digital Twin",   icon: "🌐", badge: null },
    { to: "/maintenance",  label: "Maintenance",    icon: "🔧", badge: alerts.maintenance > 0 ? alerts.maintenance : null },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-lg font-bold">⬡</div>
            <div>
              <h1 className="text-base font-bold text-blue-400 leading-none">InfraVerse</h1>
              <p className="text-xs text-slate-500 mt-0.5">Digital Twin Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2 mt-1">Menu Utama</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:bg-slate-700/70 hover:text-slate-100"
                }`
              }
            >
              <span className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                {item.label}
              </span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </NavLink>
          ))}
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
              {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100 leading-none truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{user?.role}</p>
            </div>
          </NavLink>
          <button onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-slate-500 hover:text-red-400 hover:bg-slate-700/70 rounded-lg transition-colors text-left flex items-center gap-2">
            <span>↩</span> Keluar
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

Write-Host "Menulis Dashboard dengan Recharts..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { analyticsService } from "../../services/analyticsService";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUS_COLOR = { active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444" };
const STATUS_LABEL = { active:"Aktif", inactive:"Nonaktif", maintenance:"Maintenance", down:"Down" };
const TYPE_ICON    = { router:"🔀", switch:"🔌", firewall:"🛡", server:"🖥", access_point:"📡", ups:"🔋", other:"📦" };
const TYPE_COLOR   = ["#3b82f6","#8b5cf6","#ef4444","#10b981","#f59e0b","#ec4899","#6b7280"];
const RISK_COLOR   = { high:"text-red-400 bg-red-500/10 border-red-500/20", medium:"text-yellow-400 bg-yellow-500/10 border-yellow-500/20" };

function AnimatedCounter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 20);
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
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs">
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
    { label:"Total Perangkat",     value: summary.total_devices,            icon:"🖥",  color:"blue",   path:"/assets" },
    { label:"Perangkat Aktif",     value: summary.by_status?.active ?? 0,   icon:"✅",  color:"green",  path:"/assets?status=active" },
    { label:"Perangkat Down",      value: summary.by_status?.down ?? 0,     icon:"🔴",  color:"red",    path:"/assets?status=down", alert: (summary.by_status?.down ?? 0) > 0 },
    { label:"Maintenance/30hr",    value: summary.upcoming_maintenances?.length ?? 0, icon:"🔧", color:"yellow", path:"/maintenance" },
    { label:"Garansi Kedaluwarsa", value: summary.warranty_expired,         icon:"⚠️",  color:"orange", path:"/assets" },
    { label:"Simulasi Dijalankan", value: summary.simulations_run,          icon:"⚡",  color:"purple", path:"/simulation" },
  ];

  const colorMap = {
    blue:"border-blue-500/30 bg-blue-500/5 hover:border-blue-400/60",
    green:"border-green-500/30 bg-green-500/5 hover:border-green-400/60",
    red:"border-red-500/30 bg-red-500/5 hover:border-red-400/60",
    yellow:"border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-400/60",
    orange:"border-orange-500/30 bg-orange-500/5 hover:border-orange-400/60",
    purple:"border-purple-500/30 bg-purple-500/5 hover:border-purple-400/60",
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
          <h2 className="text-2xl font-bold text-slate-100">Selamat datang, {user?.name} 👋</h2>
          <p className="text-slate-400 text-sm mt-1">InfraVerse · Smart Infrastructure Digital Twin Platform</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{new Date().toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
          <p className="text-xs text-blue-400 mt-0.5 capitalize">Role: {user?.role}</p>
        </div>
      </div>

      {/* Tema lomba banner */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
        <div className="text-3xl">🇮🇩</div>
        <div>
          <p className="text-sm font-semibold text-blue-300">Ekosistem Digital Cerdas untuk Indonesia</p>
          <p className="text-xs text-slate-400 mt-0.5">
            InfraVerse membantu pengelolaan infrastruktur digital kampus secara inklusif, efisien, dan berkelanjutan —
            mendukung transformasi digital Indonesia 2045.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(s => (
          <button key={s.label} onClick={() => navigate(s.path)}
            className={`border rounded-xl p-4 text-left transition-all relative overflow-hidden ${colorMap[s.color]}`}>
            {s.alert && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
            <div className="text-2xl mb-3">{s.icon}</div>
            <p className="text-2xl font-bold text-slate-100">
              <AnimatedCounter value={s.value} />
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-tight">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar chart by type */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Distribusi Perangkat per Tipe</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byTypeChart} margin={{ top:0, right:0, bottom:0, left:-20 }}>
              <XAxis dataKey="name" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:"#1e293b" }} />
              <Bar dataKey="count" name="Jumlah" radius={[4,4,0,0]}>
                {byTypeChart.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart by status */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Status Perangkat</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatusChart} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value" nameKey="name">
                {byStatusChart.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8}
                formatter={(value) => <span style={{ color:"#94a3b8", fontSize:12 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictive + Maintenance row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Predictive alerts */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Prediksi Perlu Perhatian</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${predictive.length > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
              {predictive.length} alert
            </span>
          </div>
          {predictive.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-slate-400">Semua perangkat dalam kondisi baik</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {predictive.map(p => (
                <div key={p.device_id} className={`border rounded-lg px-3 py-2.5 text-xs ${RISK_COLOR[p.risk]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{TYPE_ICON[p.type] ?? "📦"} {p.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold uppercase ${p.risk === "high" ? "bg-red-500/30" : "bg-yellow-500/30"}`}>
                      {p.risk}
                    </span>
                  </div>
                  {p.reasons.map((r, i) => <p key={i} className="opacity-75">• {r}</p>)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming maintenance */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Maintenance Terjadwal</h3>
            <button onClick={() => navigate("/maintenance")} className="text-xs text-blue-400 hover:text-blue-300">
              Lihat Semua →
            </button>
          </div>
          {(summary.upcoming_maintenances?.length ?? 0) === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🗓</div>
              <p className="text-sm text-slate-400">Tidak ada maintenance dalam 30 hari</p>
            </div>
          ) : (
            <div className="space-y-2">
              {summary.upcoming_maintenances.slice(0,5).map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
                  <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center text-sm flex-shrink-0">🔧</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{m.device}</p>
                    <p className="text-xs text-slate-500 capitalize">{m.type}</p>
                  </div>
                  <p className="text-xs text-slate-400 flex-shrink-0">{m.scheduled_date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Simulation stats */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Statistik Simulation Center</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label:"Total Simulasi", value: summary.simulations_run, color:"text-purple-400" },
            { label:"Berhasil Diselesaikan", value: summary.simulations_resolved, color:"text-green-400" },
            { label:"Success Rate", value: summary.simulations_run > 0
              ? Math.round((summary.simulations_resolved/summary.simulations_run)*100)+"%"
              : "0%", color:"text-blue-400" },
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

Write-Host "Update App.jsx (tambah ToastProvider)..." -ForegroundColor Cyan

@'
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import ToastProvider from "./components/shared/ToastProvider.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <AppRoutes />
    </BrowserRouter>
  );
}
'@ | Set-Content -Path "src\App.jsx" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Polish-1 (Toast + Skeleton + Dashboard charts + Sidebar badge) siap." -ForegroundColor Green
Write-Host "Lanjut jalankan polish-2.ps1 untuk Maintenance page + Asset detail + Profile." -ForegroundColor Yellow