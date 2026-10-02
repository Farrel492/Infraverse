import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { analyticsService } from "../../services/analyticsService";
import { buildingService } from "../../services/buildingService";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import { motion } from "framer-motion";
import {
  Server, CheckCircle, XCircle, Wrench, ShieldAlert,
  Zap, Router, Shield, Network, Wifi, Battery, Package,
  Calendar, Activity, ChevronRight, Leaf, Building2, TrendingUp, Cpu
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area, CartesianGrid
} from "recharts";

const STATUS_COLOR = {
  active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444"
};
const TYPE_ICON_MAP = {
  router:       <Router size={14} />,
  switch:       <Network size={14} />,
  firewall:     <Shield size={14} />,
  server:       <Server size={14} />,
  access_point: <Wifi size={14} />,
  ups:          <Battery size={14} />,
  other:        <Package size={14} />,
};
const TYPE_COLOR = ["#3b82f6","#8b5cf6","#ef4444","#10b981","#f59e0b","#ec4899","#6b7280"];

const PERIOD_OPTIONS = [
  { value: "day",   label: "Hari" },
  { value: "week",  label: "Minggu" },
  { value: "month", label: "Bulan" },
  { value: "year",  label: "Tahun" },
];

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const itemVariants = {
  hidden:  { y: 22, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 90, damping: 20 } }
};

function AnimatedCounter({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / 25) || 1;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 35);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}{suffix}</span>;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-xs shadow-2xl"
      style={{
        background: "rgba(9,18,38,0.95)",
        border: "1px solid rgba(79,140,220,0.20)",
        borderRadius: "12px",
        padding: "10px 14px",
        backdropFilter: "blur(12px)",
      }}
    >
      <p className="font-bold mb-1.5" style={{ color: "#94a3b8" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const PowerTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload ?? {};
  return (
    <div
      className="text-xs shadow-2xl min-w-[160px]"
      style={{
        background: "rgba(7,15,32,0.96)",
        border: "1px solid rgba(79,140,220,0.20)",
        borderRadius: "14px",
        padding: "12px 14px",
        backdropFilter: "blur(16px)",
      }}
    >
      <p className="font-bold pb-2 mb-2 flex items-center justify-between" style={{ color: "#94a3b8", borderBottom: "1px solid rgba(79,140,220,0.12)" }}>
        <span>Waktu:</span>
        <span className="font-mono text-white">{label}</span>
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: "#64748b" }}>Konsumsi:</span>
          <span className="font-bold font-mono" style={{ color: "#34d399" }}>{item.kwh} kWh</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: "#64748b" }}>Beban:</span>
          <span className="font-semibold font-mono" style={{ color: "#fbbf24" }}>{item.watt} W</span>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();

  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [buildings, setBuildings]   = useState([]);
  const [powerData, setPowerData]   = useState(null);
  const [powerLoading, setPowerLoading] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedDevice,   setSelectedDevice]   = useState("");
  const [selectedPeriod,   setSelectedPeriod]   = useState("week");

  useEffect(() => {
    analyticsService.getSummary()
      .then(r => setSummary(r.data))
      .finally(() => setLoading(false));
    buildingService.getAll()
      .then(r => setBuildings(r.data ?? []));
  }, []);

  const loadPower = useCallback(() => {
    setPowerLoading(true);
    const params = { period: selectedPeriod };
    if (selectedBuilding) params.building_id = selectedBuilding;
    if (selectedDevice)   params.device_id   = selectedDevice;
    analyticsService.getPower(params)
      .then(r => setPowerData(r.data))
      .finally(() => setPowerLoading(false));
  }, [selectedBuilding, selectedDevice, selectedPeriod]);

  useEffect(() => { loadPower(); }, [loadPower]);

  const handleBuildingChange = (bId) => {
    setSelectedBuilding(bId);
    if (bId && selectedDevice) {
      const dev = (powerData?.all_devices ?? []).find(d => String(d.id) === String(selectedDevice));
      if (dev && String(dev.building_id) !== String(bId)) setSelectedDevice("");
    }
  };

  const availableDevices = (powerData?.all_devices ?? []).filter(d => {
    if (!selectedBuilding) return true;
    return String(d.building_id) === String(selectedBuilding);
  });

  const powerChartData = powerData?.chart_data ?? [];
  const chartBuildings = powerData?.buildings ?? [];
  const totalKwh  = powerData?.total_kwh ?? 0;
  const totalWatt = powerData?.total_watt ?? 0;

  if (loading || !summary) return (
    <div className="p-8 space-y-6">
      <div className="h-8 rounded-xl w-64 mb-6 shimmer" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  const statCards = [
    {
      label: "Total Perangkat", value: summary.total_devices, Icon: Server,
      color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.20)",
      path: "/assets"
    },
    {
      label: "Perangkat Aktif", value: summary.by_status?.active ?? 0, Icon: CheckCircle,
      color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.20)",
      path: "/assets"
    },
    {
      label: "Perangkat Down", value: summary.by_status?.down ?? 0, Icon: XCircle,
      color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.20)",
      path: "/assets", alert: (summary.by_status?.down ?? 0) > 0
    },
    {
      label: "Maintenance/30hr", value: summary.upcoming_maintenances?.length ?? 0, Icon: Wrench,
      color: "#eab308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.20)",
      path: "/maintenance"
    },
    {
      label: "Garansi Expire", value: summary.warranty_expired, Icon: ShieldAlert,
      color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.20)",
      path: "/assets"
    },
    {
      label: "Total Daya", value: Math.round(totalKwh), suffix: "kWh", Icon: Zap,
      color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.20)",
      path: "/dashboard"
    },
  ];

  const byTypeChart = Object.entries(summary.by_type ?? {}).map(([type, count], i) => ({
    name: type.replace("_"," "), count, fill: TYPE_COLOR[i % TYPE_COLOR.length],
  }));

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Selamat Pagi" : greetingHour < 17 ? "Selamat Siang" : "Selamat Malam";

  return (
    <motion.div
      className="p-6 xl:p-8 space-y-7 min-h-screen"
      style={{ background: "radial-gradient(ellipse at top, #060f22 0%, #050c1a 60%)" }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ═══════════════ HEADER ═══════════════ */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider mb-1.5 text-blue-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {greeting}, {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h2 className="text-3xl lg:text-4xl font-black leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white">
                {user?.name ?? "Administrator"}
              </span>
            </h2>
            <p className="text-sm mt-1 font-semibold text-slate-300">
              Command Center InfraVerse — Platform Digital Twin Infrastruktur Smart Campus
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.20)",
                color: "#34d399",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px #34d399" }} />
              Sistem Online
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold"
              style={{
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.20)",
                color: "#60a5fa",
              }}
            >
              <Cpu size={12} />
              {user?.role?.toUpperCase() ?? "ADMIN"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════ WELCOME BANNER ═══════════════ */}
      <motion.div variants={itemVariants}>
        <div
          className="relative overflow-hidden rounded-3xl p-6 xl:p-7"
          style={{
            background: "linear-gradient(135deg, rgba(8,20,48,0.9) 0%, rgba(12,25,55,0.85) 100%)",
            border: "1px solid rgba(59,130,246,0.18)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-full pointer-events-none">
            <div className="absolute top-4 right-4 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)" }} />
            <div className="absolute -bottom-8 right-20 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)" }} />
          </div>
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

          <div className="relative flex items-center gap-5 xl:gap-6">
            <div
              className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                boxShadow: "0 8px 28px rgba(59,130,246,0.50)",
              }}
            >
              <Activity className="text-white" size={28} />
            </div>
            <div>
              <h3 className="text-lg xl:text-xl font-black text-slate-100 flex items-center gap-2.5">
                Ekosistem Digital Cerdas untuk Masa Depan <Leaf size={18} className="text-emerald-400" />
              </h3>
              <p className="text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed font-medium">
                Platform monitoring infrastruktur IT kampus secara real-time. Pantau{" "}
                <strong className="text-blue-400 font-black">{summary.total_devices} perangkat</strong>{" "}
                aktif, efisiensi daya, dan jadwal maintenance dari satu dasbor terpusat.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════ STAT CARDS ═══════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s, idx) => (
          <motion.button
            key={s.label}
            onClick={() => navigate(s.path)}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="relative text-left overflow-hidden rounded-2xl p-5 border cursor-pointer group"
            style={{ background: s.bg, borderColor: s.border }}
          >
            {/* Alert ping */}
            {s.alert && (
              <span
                className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full"
                style={{ background: "#ef4444", boxShadow: "0 0 8px #ef4444", animation: "ping-ring 1.5s infinite" }}
              />
            )}

            {/* Glow top decoration */}
            <div
              className="absolute -top-4 -left-4 w-20 h-20 rounded-full opacity-30 group-hover:opacity-50 transition-opacity"
              style={{ background: `radial-gradient(circle, ${s.color} 0%, transparent 70%)` }}
            />

            <div className="relative">
              <div className="mb-3.5" style={{ color: s.color }}>
                <s.Icon size={26} strokeWidth={2.2} />
              </div>
              <p className="text-2xl xl:text-3xl font-black font-mono leading-none" style={{ color: "#f0f6ff" }}>
                <AnimatedCounter value={s.value} suffix={s.suffix ?? ""} />
              </p>
              <p className="text-xs font-black uppercase tracking-wider mt-2.5" style={{ color: s.color }}>
                {s.label}
              </p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* ═══════════════ CHARTS ROW ═══════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Power Trend Chart */}
        <div
          className="xl:col-span-2 rounded-3xl p-6 xl:p-7"
          style={{
            background: "rgba(8,16,35,0.75)",
            border: "1px solid rgba(79,140,220,0.12)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}
                >
                  <Zap size={14} style={{ color: "#34d399" }} />
                </div>
                Tren Konsumsi Daya
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Total konsumsi energi perangkat aktif berdasarkan watt terpasang
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: "#34d399" }}>
                {Math.round(totalKwh * 10) / 10} <span className="text-sm font-bold text-slate-400">kWh</span>
              </p>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {Math.round(totalWatt)} W total terpasang
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            {/* Building Filter */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs"
              style={{ background: "rgba(12,22,45,0.80)", borderColor: "rgba(79,140,220,0.14)" }}
            >
              <Building2 size={12} style={{ color: "#60a5fa" }} />
              <select
                value={selectedBuilding}
                onChange={e => handleBuildingChange(e.target.value)}
                className="bg-transparent text-slate-300 text-xs font-bold outline-none cursor-pointer min-w-[110px]"
              >
                <option value="">Semua Gedung</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Device Filter */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs"
              style={{ background: "rgba(12,22,45,0.80)", borderColor: "rgba(79,140,220,0.14)" }}
            >
              <Server size={12} style={{ color: "#34d399" }} />
              <select
                value={selectedDevice}
                onChange={e => setSelectedDevice(e.target.value)}
                className="bg-transparent text-slate-300 text-xs font-bold outline-none cursor-pointer max-w-[200px]"
              >
                <option value="">Semua Perangkat ({availableDevices.length})</option>
                {availableDevices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.watt}W)</option>
                ))}
              </select>
            </div>

            {/* Period Filter */}
            <div
              className="flex items-center gap-1 p-1 rounded-xl border"
              style={{ background: "rgba(12,22,45,0.80)", borderColor: "rgba(79,140,220,0.14)" }}
            >
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedPeriod(opt.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  style={selectedPeriod === opt.value
                    ? { background: "rgba(16,185,129,0.18)", color: "#34d399", border: "1px solid rgba(16,185,129,0.35)" }
                    : { color: "#475569" }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {powerLoading && (
              <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#475569" }}>
                <div className="w-3 h-3 border-2 border-t-emerald-400 rounded-full animate-spin" style={{ borderColor: "rgba(52,211,153,0.3)", borderTopColor: "#34d399" }} />
                Memuat...
              </div>
            )}
          </div>

          {/* Building badges */}
          {chartBuildings.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {chartBuildings.map(b => (
                <div
                  key={b.building_id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(12,22,45,0.80)", border: "1px solid rgba(79,140,220,0.12)" }}
                >
                  <Building2 size={10} style={{ color: "#60a5fa" }} />
                  <span style={{ color: "#cbd5e1" }}>{b.building_name}</span>
                  <span className="font-mono" style={{ color: "#475569" }}>{b.total_kwh} kWh</span>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          {powerChartData.length === 0 || totalKwh === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-48 rounded-2xl border border-dashed"
              style={{ background: "rgba(8,16,35,0.5)", borderColor: "rgba(79,140,220,0.14)" }}
            >
              <Zap size={30} style={{ color: "#1e3a5f" }} className="mb-2" />
              <p className="text-sm font-semibold" style={{ color: "#334155" }}>Belum ada data konsumsi daya</p>
              <p className="text-xs mt-1" style={{ color: "#1e293b" }}>Tambahkan perangkat dengan nilai watt</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={powerChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.30} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,140,220,0.07)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill:"#334155", fontSize:11, fontWeight:700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"#334155", fontSize:11, fontWeight:700 }} axisLine={false} tickLine={false} />
                <Tooltip content={<PowerTooltip />} />
                <Area
                  type="monotone" dataKey="kwh" name="Konsumsi (kWh)"
                  stroke="#10b981" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#colorKwh)"
                  dot={false} activeDot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "rgba(16,185,129,0.3)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Device Distribution */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: "rgba(8,16,35,0.75)",
            border: "1px solid rgba(79,140,220,0.12)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <h3 className="text-base font-black text-slate-100 mb-5 flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}
            >
              <TrendingUp size={14} style={{ color: "#a78bfa" }} />
            </div>
            Distribusi Tipe
          </h3>
          {byTypeChart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48" style={{ color: "#1e293b" }}>
              <Server size={28} className="mb-2" />
              <p className="text-xs font-semibold">Belum ada perangkat</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byTypeChart} margin={{ top:0, right:0, bottom:0, left:-20 }} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill:"#64748b", fontSize:11, fontWeight:700 }}
                  axisLine={false} tickLine={false} width={90}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" name="Jumlah" radius={[0,6,6,0]} barSize={16}>
                  {byTypeChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* ═══════════════ MAINTENANCE SECTION ═══════════════ */}
      <motion.div variants={itemVariants}>
        <div
          className="rounded-3xl p-6 xl:p-7"
          style={{
            background: "rgba(8,16,35,0.75)",
            border: "1px solid rgba(79,140,220,0.12)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.22)" }}
              >
                <Calendar size={14} style={{ color: "#fbbf24" }} />
              </div>
              Maintenance Mendatang
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.22)", color: "#fbbf24" }}
              >
                30 Hari
              </span>
            </h3>
            <button
              onClick={() => navigate("/maintenance")}
              className="btn btn-sm btn-secondary flex items-center gap-1.5"
            >
              Lihat Semua <ChevronRight size={13} />
            </button>
          </div>

          {(summary.upcoming_maintenances?.length ?? 0) === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed"
              style={{ background: "rgba(8,16,35,0.5)", borderColor: "rgba(79,140,220,0.10)" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}
              >
                <CheckCircle size={28} style={{ color: "#34d399" }} />
              </div>
              <p className="text-base text-slate-200 font-bold">Infrastruktur Aman &amp; Terkendali</p>
              <p className="text-xs mt-1 font-medium" style={{ color: "#334155" }}>
                Tidak ada jadwal maintenance mendesak dalam 30 hari ke depan
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {summary.upcoming_maintenances.slice(0,8).map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 p-4 rounded-2xl border transition-all cursor-default group"
                  style={{ background: "rgba(10,20,42,0.80)", borderColor: "rgba(79,140,220,0.10)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(234,179,8,0.22)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(79,140,220,0.10)"}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.20)" }}
                  >
                    <Wrench size={16} style={{ color: "#fbbf24" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-100 truncate">{m.device}</p>
                    <p className="text-[10px] flex items-center gap-1 mt-0.5 font-medium" style={{ color: "#475569" }}>
                      {TYPE_ICON_MAP[m.type] ?? <Package size={10} />}
                      {m.type?.replace("_"," ")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-200">
                      {m.scheduled_date
                        ? new Date(m.scheduled_date).toLocaleDateString("id-ID", { day:"numeric", month:"short" })
                        : "?"}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "#334155" }}>Jadwal</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}
