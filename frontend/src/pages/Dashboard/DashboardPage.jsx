import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { analyticsService } from "../../services/analyticsService";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import { motion } from "framer-motion";
import {
  Server, CheckCircle, XCircle, Wrench, ShieldAlert,
  Zap, Router, Shield, Network, Wifi, Battery, Package,
  TrendingUp, Calendar, Activity, ChevronRight,
  Leaf, BrainCircuit, Lightbulb, AlertTriangle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from "recharts";

const STATUS_COLOR = {
  active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444"
};
const STATUS_LABEL = {
  active:"Aktif", inactive:"Nonaktif", maintenance:"Maintenance", down:"Down"
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
const RISK_COLOR = {
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

// Mock Data for Sustainability & Power
const mockPowerData = [
  { day: "Sen", kwh: 120 }, { day: "Sel", kwh: 132 }, { day: "Rab", kwh: 101 },
  { day: "Kam", kwh: 143 }, { day: "Jum", kwh: 90 },  { day: "Sab", kwh: 70 },
  { day: "Min", kwh: 65 },
];

const aiRecommendations = [
  {
    id: 1,
    title: "Optimasi Daya Jaringan",
    description: "3 Access Point di Gedung B terdeteksi idle selama 5 jam. Pindahkan ke mode hemat daya untuk mengurangi beban 2.5 kWh/hari.",
    type: "energy",
    impact: "High"
  },
  {
    id: 2,
    title: "Prediksi Suhu Ekstrem",
    description: "Suhu Server Data (SRV-01) konsisten di atas 75°C. Analisis AI menyarankan pembersihan fan pendingin segera.",
    type: "risk",
    impact: "Critical"
  }
];

function AnimatedCounter({ value, suffix = "" }) {
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

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();
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
    { label:"Efisiensi Energi",    value: 87, suffix: "%",                             Icon: Leaf,        color:"emerald",path:"/dashboard" }, // Mocked for Green IT
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

  const byTypeChart   = Object.entries(summary.by_type ?? {}).map(([type, count], i) => ({
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
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Selamat datang, {user?.name ?? "?"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Dasbor Utama InfraVerse — Cerdas, Inklusif, Berkelanjutan.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            {new Date().toLocaleDateString("id-ID", {
              weekday:"long", year:"numeric", month:"long", day:"numeric"
            })}
          </p>
          <div className="inline-flex mt-2 items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <p className="text-xs text-slate-300 capitalize">Role: {user?.role ?? "?"}</p>
          </div>
        </div>
      </motion.div>

      {/* AI & GREEN IT WELCOME BANNER */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl p-6 border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)] bg-slate-900/40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Activity className="text-white" size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Ekosistem Digital Cerdas untuk Masa Depan <Leaf size={16} className="text-emerald-400" />
            </h3>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Infrastruktur IT Anda berjalan dengan optimal. Bulan ini, optimalisasi AI InfraVerse telah berhasil mengurangi konsumsi energi sebesar <strong>12%</strong> dan mencegah <strong>3 potensi kegagalan sistem</strong>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* STAT CARDS */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(s => (
          <button key={s.label} onClick={() => navigate(s.path)}
            className={`border rounded-2xl p-5 text-left transition-all relative overflow-hidden backdrop-blur-sm ${colorMap[s.color]}`}>
            {s.alert && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />}
            <div className={`mb-4 ${iconColor[s.color]}`}>
              <s.Icon size={24} strokeWidth={2} />
            </div>
            <p className="text-3xl font-black text-slate-100 font-mono">
              <AnimatedCounter value={s.value} suffix={s.suffix} />
            </p>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">{s.label}</p>
          </button>
        ))}
      </motion.div>

      {/* CHARTS SECTION */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Power Trend Chart */}
        <div className="xl:col-span-2 bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" /> Tren Konsumsi Daya (7 Hari)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Pemantauan energi real-time untuk keberlanjutan.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-400">721 <span className="text-sm font-medium text-slate-500">kWh</span></p>
              <p className="text-xs text-emerald-500 flex items-center justify-end gap-1 mt-0.5"><TrendingUp size={12}/> -4.2% dari minggu lalu</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mockPowerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="day" tick={{ fill:"#94a3b8", fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#94a3b8", fontSize:12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="kwh" name="Konsumsi (kWh)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorKwh)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Device Distribution Bar Chart */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-slate-200 mb-6">Distribusi Tipe Perangkat</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byTypeChart} margin={{ top:0, right:0, bottom:0, left:-20 }} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fill:"#cbd5e1", fontSize:11 }} axisLine={false} tickLine={false} width={85} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(255,255,255,0.05)" }} />
              <Bar dataKey="count" name="Jumlah" radius={[0,4,4,0]} barSize={16}>
                {byTypeChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* AI RECOMMENDATIONS & MAINTENANCE */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Smart AI Recommendation */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <BrainCircuit size={20} className="text-indigo-400" /> InfraVerse AI Copilot
            </h3>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-medium border border-indigo-500/30">
              {aiRecommendations.length} Rekomendasi
            </span>
          </div>
          <div className="space-y-4">
            {aiRecommendations.map(rec => (
              <div key={rec.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-indigo-500/40 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${rec.type === 'energy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {rec.type === 'energy' ? <Lightbulb size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">{rec.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.description}</p>
                    <button className="mt-3 text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                      Terapkan Solusi <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive & Maintenance Combo */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" /> Maintenance Mendatang
            </h3>
            <button onClick={() => navigate("/maintenance")} className="text-xs text-blue-400 hover:text-blue-300">
              Kelola Semua
            </button>
          </div>
          
          {(summary.upcoming_maintenances?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
              <CheckCircle size={32} className="text-green-500/50 mb-3" />
              <p className="text-sm text-slate-400 font-medium">Infrastruktur Aman</p>
              <p className="text-xs text-slate-500 mt-1">Tidak ada jadwal maintenance dalam 30 hari ke depan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.upcoming_maintenances.slice(0,4).map((m, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center shadow-inner">
                    <Wrench size={16} className="text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{m.device}</p>
                    <p className="text-xs text-slate-500 capitalize flex items-center gap-1 mt-0.5">
                      {TYPE_ICON_MAP[m.type] ?? <Package size={12}/>} {m.type.replace("_"," ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-300">
                      {m.scheduled_date ? new Date(m.scheduled_date).toLocaleDateString("id-ID", { day:"numeric", month:"short" }) : "?"}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Jadwal</p>
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
