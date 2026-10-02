import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import useAuthStore from "../../stores/authStore";
import {
  Eye, EyeOff, Lock, Mail, User, CheckCircle2,
  ArrowRight, Sparkles, Shield, Cpu, Globe,
  Activity, Server, Zap, Check, AlertTriangle
} from "lucide-react";

const BENEFITS = [
  {
    Icon: Server,
    label: "Akses Digital Twin 3D Spasial",
    sub: "Navigasi visualisasi rack cabinet NOC, link port backbone, dan denah lantai interaktif.",
    badge: "Full 3D Twin",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)"
  },
  {
    Icon: Activity,
    label: "Monitoring Uptime & Latensi",
    sub: "Katalog status telemetri perangkat secara terpusat dengan ambang batas peringatan dini.",
    badge: "NOC Telemetry",
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.25)"
  },
  {
    Icon: Zap,
    label: "Simulasi Disaster Recovery",
    sub: "Latih kesiapsiagaan tim IT dalam menangani kegagalan router, switch, dan insiden fiber optik.",
    badge: "Auto SLA",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.25)"
  },
  {
    Icon: Shield,
    label: "Otorisasi Berbasis Peran (RBAC)",
    sub: "Keamanan akses terstandarisasi untuk Administrator, Teknisi Lapangan, dan Viewer eksekutif.",
    badge: "Enterprise Security",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)"
  },
];

// Floating particles
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
          className="absolute rounded-full bg-indigo-400"
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    name: "", email: "", password: "", password_confirmation: ""
  });
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password_confirmation) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.register(form);
      setAuth(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) setError(Object.values(errors).flat().join(" "));
      else setError(err.response?.data?.message ?? "Terjadi kesalahan saat pendaftaran akun.");
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
          LEFT PANEL — VALUE PROPOSITION & SHOWCASE
          =================================================================== */}
      <div
        className="hidden lg:flex flex-col w-[54%] xl:w-[56%] relative overflow-y-auto"
        style={{
          background: "linear-gradient(145deg, #040817 0%, #080f28 35%, #0e1b42 70%, #152458 100%)",
          borderRight: "1px solid rgba(129,140,248,0.18)",
        }}
      >
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <AmbientParticles />

        {/* Ambient Glowing Orbs */}
        <div
          className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 65%)" }}
        />

        {/* Top glowing indigo line */}
        <div className="accent-line-top" style={{ background: "linear-gradient(90deg, transparent, #818cf8 35%, #c084fc 65%, transparent)" }} />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14 space-y-10">

          {/* Top Brand */}
          <div
            className={`flex items-center justify-between transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="flex items-center gap-4">
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl flex-shrink-0 shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  boxShadow: "0 8px 32px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                <span>IV</span>
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-400 border-2 border-[#050c1a]"
                  style={{ boxShadow: "0 0 10px #818cf8" }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-white tracking-tight">
                    InfraVerse
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Registrasi Akun
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">
                  Smart Infrastructure Platform & Digital Twin Ecosystem
                </p>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-indigo-300 font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Registrasi Terbuka</span>
            </div>
          </div>

          {/* Main Headline & Description */}
          <div
            className={`space-y-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 shadow-sm">
              <Sparkles size={14} className="text-indigo-400" />
              Akselerasi Pengelolaan NOC dengan Otomasi Cerdas
            </div>

            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-slate-100 leading-[1.18] tracking-tight">
              Mulai Eksplorasi<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300">
                Infrastruktur Generasi Baru
              </span>
            </h2>

            <p className="text-base lg:text-lg leading-relaxed text-slate-200 font-medium max-w-2xl">
              Daftarkan diri Anda untuk mengakses Command Center InfraVerse.
              Kelola inventaris hardware secara spasial, optimalkan efisiensi energi gedung kampus,
              dan tingkatkan reliabilitas jaringan dengan teknologi Digital Twin 3D.
            </p>

            {/* 4 Feature Benefit Cards — Spacious & Ultra-Legible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {BENEFITS.map(({ Icon, label, sub, badge, color, bg, border }, i) => (
                <div
                  key={i}
                  className="p-5 rounded-3xl border transition-all duration-300 flex items-start gap-4 shadow-lg group hover:translate-y-[-2px]"
                  style={{
                    background: "rgba(10, 20, 48, 0.72)",
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
                      <h4 className="text-sm font-black text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {label}
                      </h4>
                    </div>
                    <span
                      className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md mb-1.5"
                      style={{ background: bg, color: color, border: `1px solid ${border}` }}
                    >
                      {badge}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Security Assurance Box */}
          <div
            className={`p-6 rounded-3xl border transition-all duration-700 delay-300 shadow-xl flex items-center gap-4 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{
              background: "rgba(12, 22, 52, 0.75)",
              borderColor: "rgba(129, 140, 248, 0.20)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
              <Shield size={22} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-100 mb-0.5">
                Standar Keamanan Enterprise-Grade
              </p>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Seluruh kredensial dan data telemetri institusi Anda dienkripsi dengan standar industri tertinggi dan diaudit berkala.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================================
          RIGHT PANEL — REGISTRATION FORM
          =================================================================== */}
      <div
        className="flex-1 flex items-center justify-center relative p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto"
        style={{ background: "linear-gradient(145deg, #050c1a 0%, #091430 100%)" }}
      >
        <div className="absolute inset-0 bg-dots opacity-25 pointer-events-none" />

        <div
          className={`w-full max-w-[480px] relative z-10 my-auto transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Mobile Header Logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="inline-flex w-14 h-14 rounded-2xl items-center justify-center font-black text-white text-2xl mb-3 shadow-2xl"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
            >
              IV
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              InfraVerse
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">Smart Infrastructure Platform</p>
          </div>

          {/* Form Card */}
          <div
            className="relative rounded-3xl border shadow-2xl overflow-hidden"
            style={{
              background: "rgba(10, 20, 45, 0.90)",
              borderColor: "rgba(129, 140, 248, 0.25)",
              backdropFilter: "blur(28px)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 35px rgba(99,102,241,0.12)",
            }}
          >
            {/* Top gradient highlight */}
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400" />

            <div className="p-8 sm:p-10 space-y-6">

              {/* Header Titles */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Globe size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Pendaftaran Anggota
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                  Buat Akun Baru
                </h2>
                <p className="text-sm text-slate-300 font-medium mt-1">
                  Bergabunglah dengan ekosistem digital kampus cerdas
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-sm font-semibold text-red-300 flex items-center gap-3 shadow-md animate-fade-in">
                  <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                    Nama Lengkap <span className="text-indigo-400">*</span>
                  </label>
                  <div className="flex items-center h-13 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all shadow-inner">
                    <div className="px-4 text-indigo-400 flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Contoh: Farrel Pratama"
                      className="w-full pr-4 text-sm font-semibold text-slate-100 bg-transparent outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                    Email Pengguna <span className="text-indigo-400">*</span>
                  </label>
                  <div className="flex items-center h-13 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all shadow-inner">
                    <div className="px-4 text-blue-400 flex items-center justify-center">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="farrel@infraverse.id"
                      className="w-full pr-4 text-sm font-semibold text-slate-100 bg-transparent outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                    Kata Sandi <span className="text-indigo-400">*</span>
                  </label>
                  <div className="flex items-center h-13 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all shadow-inner">
                    <div className="px-4 text-purple-400 flex items-center justify-center">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimal 8 karakter aman..."
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

                {/* Password Confirmation */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                    Konfirmasi Kata Sandi <span className="text-indigo-400">*</span>
                  </label>
                  <div className="flex items-center h-13 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all shadow-inner">
                    <div className="px-4 text-purple-400 flex items-center justify-center">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPass2 ? "text" : "password"}
                      required
                      value={form.password_confirmation}
                      onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                      placeholder="Ulangi kata sandi Anda..."
                      className="w-full pr-2 text-sm font-semibold text-slate-100 bg-transparent outline-none placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass2(!showPass2)}
                      className="px-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPass2 ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-98 cursor-pointer mt-4"
                  style={{
                    background: loading
                      ? "rgba(99,102,241,0.4)"
                      : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)",
                    boxShadow: "0 8px 30px rgba(99,102,241,0.45)",
                  }}
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mendaftarkan Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Daftar Sekarang</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-400 font-semibold">
                  Sudah memiliki akun terdaftar?{" "}
                  <Link
                    to="/login"
                    className="text-indigo-400 hover:text-indigo-300 font-black underline underline-offset-4 transition-colors"
                  >
                    Masuk ke Sistem
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
