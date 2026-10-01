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
  TrendingUp, TrendingDown, Calendar, Activity, ChevronRight,
  Leaf, Building2, Filter
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
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

function AnimatedCounter({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / 20) || 1;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}{suffix}</span>;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const PowerTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload ?? {};
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3.5 text-xs shadow-2xl space-y-1.5 min-w-[150px]">
      <p className="text-slate-300 font-bold border-b border-slate-700/60 pb-1 flex items-center justify-between">
        <span>Waktu:</span>
        <span className="text-white font-mono">{label}</span>
      </p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-400">Konsumsi Energi:</span>
        <span className="text-emerald-400 font-bold font-mono text-sm">{item.kwh} kWh</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[11px]">
        <span className="text-slate-400">Beban Terpasang:</span>
        <span className="text-yellow-400 font-mono font-semibold">{item.watt} Watt</span>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();

  const [summary, setSummary]         = useState(null);
  const [loading, setLoading]         = useState(true);

  // Power chart state
  const [buildings, setBuildings]     = useState([]);
  const [powerData, setPowerData]     = useState(null);
  const [powerLoading, setPowerLoading] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(""); // "" = all
  const [selectedDevice, setSelectedDevice]     = useState(""); // "" = all
  const [selectedPeriod, setSelectedPeriod]     = useState("week");

  // Load summary once
  useEffect(() => {
    analyticsService.getSummary()
      .then(r => setSummary(r.data))
      .finally(() => setLoading(false));
    // Load buildings list for filter
    buildingService.getAll()
      .then(r => setBuildings(r.data ?? []));
  }, []);

  // Load power data whenever filter changes
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

  // Handle building filter change: clear device if device belongs to other building
  const handleBuildingChange = (bId) => {
    setSelectedBuilding(bId);
    if (bId && selectedDevice) {
      const dev = (powerData?.all_devices ?? []).find(d => String(d.id) === String(selectedDevice));
      if (dev && String(dev.building_id) !== String(bId)) {
        setSelectedDevice("");
      }
    }
  };

  // Filter available devices based on selected building
  const availableDevices = (powerData?.all_devices ?? []).filter(d => {
    if (!selectedBuilding) return true;
    return String(d.building_id) === String(selectedBuilding);
  });

  const powerChartData = powerData?.chart_data ?? [];
  const chartBuildings = powerData?.buildings ?? [];
  const totalKwh = powerData?.total_kwh ?? 0;
  const totalWatt = powerData?.total_watt ?? 0;

  if (loading || !summary) return (
    <div className="p-8 space-y-6">
      <div className="h-8 bg-slate-700/50 rounded w-64 animate-pulse mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  const statCards = [
    { label:"Total Perangkat",     value: summary.total_devices,                       Icon: Server,      color:"blue",   path:"/assets" },
    { label:"Perangkat Aktif",     value: summary.by_status?.active ?? 0,              Icon: CheckCircle, color:"green",  path:"/assets" },
    { label:"Perangkat Down",      value: summary.by_status?.down ?? 0,                Icon: XCircle,     color:"red",    path:"/assets", alert:(summary.by_status?.down ?? 0) > 0 },
    { label:"Maintenance / 30hr",  value: summary.upcoming_maintenances?.length ?? 0,  Icon: Wrench,      color:"yellow", path:"/maintenance" },
    { label:"Garansi Kedaluwarsa", value: summary.warranty_expired,                    Icon: ShieldAlert, color:"orange", path:"/assets" },
    { label:"Total Daya (kWh)",    value: Math.round(totalKwh),                        Icon: Zap,         color:"emerald",path:"/dashboard" },
  ];

  const colorMap = {
    blue:    "border-blue-500/30 bg-blue-500/10 hover:border-blue-400/60 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    green:   "border-green-500/30 bg-green-500/10 hover:border-green-400/60 shadow-[0_0_15px_rgba(34,197,94,0.1)]",
    red:     "border-red-500/30 bg-red-500/10 hover:border-red-400/60 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
    yellow:  "border-yellow-500/30 bg-yellow-500/10 hover:border-yellow-400/60 shadow-[0_0_15px_rgba(234,179,8,0.1)]",
    orange:  "border-orange-500/30 bg-orange-500/10 hover:border-orange-400/60 shadow-[0_0_15px_rgba(249,115,22,0.1)]",
    emerald: "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
  };
  const iconColor = {
    blue:"text-blue-400", green:"text-green-400", red:"text-red-400",
    yellow:"text-yellow-400", orange:"text-orange-400", emerald:"text-emerald-400",
  };

  const byTypeChart = Object.entries(summary.by_type ?? {}).map(([type, count], i) => ({
    name: type.replace("_"," "), count, fill: TYPE_COLOR[i % TYPE_COLOR.length],
  }));

  return (
    <motion.div
      className="p-8 space-y-8 min-h-screen"
      style={{ background: "radial-gradient(ellipse at top, #0f172a, #020617)" }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100">
              Selamat datang, {user?.name ?? "Administrator"}
            </h2>
          </div>
          <p className="text-slate-400 text-base font-semibold mt-1.5">
            Dasbor Command Center InfraVerse — Platform Digital Twin Infrastruktur Kampus
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-300 font-bold tracking-wide">
              {new Date().toLocaleDateString("id-ID", {
                weekday:"long", year:"numeric", month:"long", day:"numeric"
              })}
            </p>
            <div className="inline-flex mt-1.5 items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
              <p className="text-xs font-bold uppercase tracking-wider">Role: {user?.role ?? "Admin"}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* GREEN IT WELCOME BANNER */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl p-7 border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] bg-slate-900/60 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-purple-600/15 pointer-events-none" />
        <div className="relative flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/40 flex-shrink-0">
            <Activity className="text-white" size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-100 flex items-center gap-3">
              Ekosistem Digital Cerdas untuk Masa Depan <Leaf size={20} className="text-emerald-400" />
            </h3>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-4xl leading-relaxed font-medium">
              Platform monitoring infrastruktur IT kampus secara real-time. Pantau <strong className="text-blue-400 font-black">{summary.total_devices} perangkat</strong> aktif, efisiensi daya, dan jadwal maintenance dari satu dasbor terpusat.
            </p>
          </div>
        </div>
      </motion.div>

      {/* STAT CARDS */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {statCards.map(s => (
          <button key={s.label} onClick={() => navigate(s.path)}
            className={`border rounded-3xl p-6 text-left transition-all relative overflow-hidden backdrop-blur-md ${colorMap[s.color]}`}>
            {s.alert && <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
            <div className={`mb-4 ${iconColor[s.color]}`}>
              <s.Icon size={28} strokeWidth={2.2} />
            </div>
            <p className="text-3xl sm:text-4xl font-black text-slate-100 font-mono tracking-tight">
              <AnimatedCounter value={s.value} suffix={s.suffix} />
            </p>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-2">{s.label}</p>
          </button>
        ))}
      </motion.div>

      {/* POWER CHART SECTION */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Power Trend Chart */}
        <div className="xl:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-7 shadow-2xl">
          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2.5">
                <Zap size={22} className="text-yellow-400" /> Tren Konsumsi Daya
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                Total konsumsi energi perangkat aktif berdasarkan watt terpasang.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-emerald-400">
                {Math.round(totalKwh * 10) / 10} <span className="text-sm font-bold text-slate-400">kWh</span>
              </p>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                {Math.round(totalWatt)} W total terpasang
              </p>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* Building Filter */}
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2">
              <Building2 size={14} className="text-blue-400 flex-shrink-0" />
              <select
                value={selectedBuilding}
                onChange={e => handleBuildingChange(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-bold outline-none cursor-pointer min-w-[130px]"
              >
                <option value="">Semua Gedung</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Device Filter */}
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2">
              <Server size={14} className="text-emerald-400 flex-shrink-0" />
              <select
                value={selectedDevice}
                onChange={e => setSelectedDevice(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-bold outline-none cursor-pointer max-w-[210px]"
              >
                <option value="">Semua Perangkat ({availableDevices.length})</option>
                {availableDevices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.watt}W)
                  </option>
                ))}
              </select>
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/60 rounded-xl p-1">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedPeriod(opt.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedPeriod === opt.value
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {powerLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                Memuat...
              </div>
            )}
          </div>

          {/* Building breakdown badges */}
          {chartBuildings.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {chartBuildings.map(b => (
                <div key={b.building_id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
                  <Building2 size={11} className="text-blue-400" />
                  <span className="font-bold text-slate-200">{b.building_name}</span>
                  <span className="text-slate-400 font-mono">{b.total_kwh} kWh</span>
                </div>
              ))}
            </div>
          )}

          {powerChartData.length === 0 || totalKwh === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-slate-900/40 rounded-2xl border border-dashed border-slate-700/80">
              <Zap size={32} className="text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-400">Belum ada data konsumsi daya.</p>
              <p className="text-xs text-slate-500 mt-1">Tambahkan perangkat dengan nilai watt untuk melihat grafik.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={powerChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" tick={{ fill:"#94a3b8", fontSize:12, fontWeight:600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"#94a3b8", fontSize:12, fontWeight:600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<PowerTooltip />} />
                <Area type="monotone" dataKey="kwh" name="Konsumsi (kWh)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorKwh)" dot={false} activeDot={{ r: 6, fill: "#10b981" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Device Distribution */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-7 shadow-2xl">
          <h3 className="text-lg font-black text-slate-100 mb-6">Distribusi Tipe Perangkat</h3>
          {byTypeChart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <Server size={32} className="mb-2 text-slate-600" />
              <p className="text-xs font-semibold">Belum ada perangkat.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byTypeChart} margin={{ top:0, right:0, bottom:0, left:-20 }} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fill:"#cbd5e1", fontSize:12, fontWeight:600 }} axisLine={false} tickLine={false} width={95} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(255,255,255,0.05)" }} />
                <Bar dataKey="count" name="Jumlah" radius={[0,6,6,0]} barSize={18}>
                  {byTypeChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* MAINTENANCE SECTION */}
      <motion.div variants={itemVariants}>
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-7 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2.5">
              <Calendar size={20} className="text-slate-400" /> Maintenance Mendatang (30 Hari)
            </h3>
            <button
              onClick={() => navigate("/maintenance")}
              className="px-4 py-2 text-xs font-bold text-blue-400 hover:text-white bg-blue-500/15 hover:bg-blue-600 border border-blue-500/30 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              Kelola Semua <ChevronRight size={14} />
            </button>
          </div>

          {(summary.upcoming_maintenances?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-700/80">
              <CheckCircle size={36} className="text-emerald-500/60 mb-3" />
              <p className="text-base text-slate-200 font-bold">Infrastruktur Aman &amp; Terkendali</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Tidak ada jadwal maintenance yang mendesak dalam 30 hari ke depan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {summary.upcoming_maintenances.slice(0,8).map((m, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 hover:bg-slate-800/80 transition-colors">
                  <div className="w-11 h-11 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center shadow-inner flex-shrink-0">
                    <Wrench size={18} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-100 truncate">{m.device}</p>
                    <p className="text-xs text-slate-400 capitalize flex items-center gap-1.5 mt-1 font-medium">
                      {TYPE_ICON_MAP[m.type] ?? <Package size={13}/>} {m.type?.replace("_"," ")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-200">
                      {m.scheduled_date ? new Date(m.scheduled_date).toLocaleDateString("id-ID", { day:"numeric", month:"short" }) : "?"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Jadwal</p>
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
