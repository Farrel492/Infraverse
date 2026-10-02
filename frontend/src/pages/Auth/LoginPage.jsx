import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import useAuthStore from "../../stores/authStore";
import {
  Eye, EyeOff, Lock, Mail, Activity, Server,
  Zap, Shield, ArrowRight, Globe,
  CheckCircle2, Sparkles, Radio
} from "lucide-react";

const FEATURES = [
  { 
    Icon: Activity,  
    label: "Monitoring Telemetri 24/7",   
    sub: "Pantau kesehatan link, latensi jaringan, beban daya watt, dan uptime server secara real-time.",
    tag: "Real-Time Telemetry",
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.25)"
  },
  { 
    Icon: Server,    
    label: "Digital Twin 3D Spatial",         
    sub: "Visualisasi interaktif 3D struktur gedung, lantai, ruangan server NOC, hingga slot rack cabinet 42U.",
    tag: "Interactive 3D",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)"
  },
  { 
    Icon: Zap,       
    label: "Simulasi Insiden & Disaster Recovery",        
    sub: "Uji respons kegagalan hardware, fiber cut, dan insiden daya dengan timer pemulihan SLA otomatis.",
    tag: "Automated Drill",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.25)"
  },
  { 
    Icon: Shield,    
    label: "Predictive Maintenance & Lifecycle",  
    sub: "Peringatan dini habisnya masa garansi perangkat dan otomatisasi jadwal pemeliharaan preventif.",
    tag: "Zero Downtime",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)"
  },
];

const STATS = [
  { value: "99.98%", label: "Uptime SLA Jaringan", detail: "Ketersediaan Tinggi" },
  { value: "< 45ms", label: "Latensi Backbone NOC", detail: "Respons Sangat Cepat" },
  { value: "100+",   label: "Node Hardware Aktif", detail: "Server & Switch" },
];

// Floating animated ambient particles
function AmbientParticles() {
  const items = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    size: Math.random() * 3.5 + 1.5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 7 + 7,
    opacity: Math.random() * 0.35 + 0.15,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm]         = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.login(form);
      setAuth(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message ?? "Email atau kata sandi tidak sesuai.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden"
      style={{ background: "#050c1a" }}
    >
      {/* ===================================================================
          LEFT PANEL — BRANDING, VALUE PROPOSITION & SHOWCASE CARDS
          =================================================================== */}
      <div
        className="hidden lg:flex flex-col w-[54%] xl:w-[56%] relative overflow-y-auto"
        style={{
          background: "linear-gradient(145deg, #030816 0%, #060e22 35%, #091738 70%, #0d204d 100%)",
          borderRight: "1px solid rgba(79,140,220,0.18)",
        }}
      >
        {/* Layered effects */}
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <AmbientParticles />

        {/* Ambient Glowing Orbs */}
        <div
          className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.20) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)" }}
        />

        {/* Top glowing cyan line */}
        <div className="accent-line-top" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14 space-y-10">

          {/* Top Brand & Version */}
          <div
            className={`flex items-center justify-between transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="flex items-center gap-4">
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl flex-shrink-0 shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #1d4ed8, #4f46e5)",
                  boxShadow: "0 8px 32px rgba(59,130,246,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                <span>IV</span>
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#050c1a]"
                  style={{ boxShadow: "0 0 10px #34d399" }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white tracking-tight">
                    InfraVerse
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    NOC Edition
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">
                  Smart Campus Infrastructure & Digital Twin Platform
                </p>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>NOC Gateway: Online</span>
            </div>
          </div>

          {/* Main Headline & Description */}
          <div
            className={`space-y-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/25 text-blue-300 shadow-sm">
              <Sparkles size={14} className="text-blue-400" />
              Solusi Terpadu Manajemen NOC Kampus Berkelanjutan
            </div>

            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-slate-100 leading-[1.18] tracking-tight">
              Pusat Kendali Infrastruktur<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-cyan-300">
                Digital Twin Smart Campus
              </span>
            </h2>

            <p className="text-base lg:text-lg leading-relaxed text-slate-200 font-medium max-w-2xl">
              Kelola seluruh ekosistem hardware IT kampus dalam satu visualisasi spasial interaktif.
              Pantau utilisasi rak server 42U, jalur fiber optic antar-gedung, simulasi mitigasi insiden,
              dan efisiensi daya listrik secara akurat dan transparan.
            </p>

            {/* 4 Feature Showcase Cards — Spacious & Ultra-Legible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {FEATURES.map(({ Icon, label, sub, tag, color, bg, border }, i) => (
                <div
                  key={i}
                  className="p-5 rounded-3xl border transition-all duration-300 flex items-start gap-4 shadow-lg group hover:translate-y-[-2px]"
                  style={{
                    background: "rgba(10, 22, 45, 0.72)",
                    borderColor: border,
                    backdropFilter: "blur(16px)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${color}80`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = border}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-md"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-black text-slate-100 group-hover:text-blue-300 transition-colors">
                        {label}
                      </h4>
                    </div>
                    <span
                      className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md mb-1.5"
                      style={{ background: bg, color: color, border: `1px solid ${border}` }}
                    >
                      {tag}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Stats Showcase */}
          <div
            className={`grid grid-cols-3 gap-6 p-6 rounded-3xl border transition-all duration-700 delay-300 shadow-xl ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{
              background: "rgba(10, 20, 42, 0.75)",
              borderColor: "rgba(79, 140, 220, 0.20)",
              backdropFilter: "blur(20px)",
            }}
          >
            {STATS.map(({ value, label, detail }) => (
              <div key={label} className="space-y-1">
                <p className="text-2xl lg:text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white">
                  {value}
                </p>
                <p className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {detail}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ===================================================================
          RIGHT PANEL — AUTHENTICATION FORM & DEMO TESTING SHORTCUTS
          =================================================================== */}
      <div
        className="flex-1 flex items-center justify-center relative p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto"
        style={{ background: "linear-gradient(145deg, #050c1a 0%, #08142b 100%)" }}
      >
        <div className="absolute inset-0 bg-dots opacity-25 pointer-events-none" />

        <div
          className={`w-full max-w-[460px] relative z-10 my-auto transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Mobile Header Logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="inline-flex w-14 h-14 rounded-2xl items-center justify-center font-black text-white text-2xl mb-3 shadow-2xl"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #4f46e5)" }}
            >
              IV
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              InfraVerse
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">Smart Infrastructure Platform</p>
          </div>

          {/* Form Card */}
          <div
            className="relative rounded-3xl border shadow-2xl overflow-hidden"
            style={{
              background: "rgba(10, 20, 42, 0.88)",
              borderColor: "rgba(79, 140, 220, 0.25)",
              backdropFilter: "blur(28px)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 35px rgba(59,130,246,0.12)",
            }}
          >
            {/* Top gradient highlight */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

            <div className="p-8 sm:p-10 space-y-6">
              
              {/* Header Titles */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Globe size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Portal Otorisasi
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                  Masuk ke Akun
                </h2>
                <p className="text-sm text-slate-300 font-medium mt-1">
                  Akses modul telemetri, digital twin, dan pemeliharaan
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-sm font-semibold text-red-300 flex items-center gap-3 shadow-md animate-fade-in">
                  <span className="text-red-400 flex-shrink-0 text-lg">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                    Email Pengguna <span className="text-blue-400">*</span>
                  </label>
                  <div className="flex items-center h-13 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all shadow-inner">
                    <div className="px-4 text-blue-400 flex items-center justify-center">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="admin@infraverse.id"
                      className="w-full pr-4 text-sm font-semibold text-slate-100 bg-transparent outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Kata Sandi <span className="text-blue-400">*</span>
                    </label>
                  </div>
                  <div className="flex items-center h-13 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all shadow-inner">
                    <div className="px-4 text-indigo-400 flex items-center justify-center">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Masukkan kata sandi..."
                      className="w-full pr-2 text-sm font-semibold text-slate-100 bg-transparent outline-none placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="px-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-98 cursor-pointer mt-2"
                  style={{
                    background: loading
                      ? "rgba(59,130,246,0.4)"
                      : "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #4f46e5 100%)",
                    boxShadow: "0 8px 30px rgba(59,130,246,0.45)",
                  }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi Otorisasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Platform</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>



              {/* Register Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-400 font-semibold">
                  Belum memiliki akun terdaftar?{" "}
                  <Link
                    to="/register"
                    className="text-blue-400 hover:text-blue-300 font-black underline underline-offset-4 transition-colors"
                  >
                    Daftar Akun Baru
                  </Link>
                </p>
              </div>

            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6 font-semibold">
            © 2026 InfraVerse — Digital Twin & Spatial IT Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
